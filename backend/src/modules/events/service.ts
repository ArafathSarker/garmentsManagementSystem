import { pool } from '../../config/db.js';

export async function processEventsService(events: any[]) {
    const results = [];
    
    // Batch processing requirement: process items in submitted order.
    // Wrap in a transaction if the entire batch should succeed/fail together,
    // BUT the requirement says: "An invalid item is REJECTED and recorded, but valid items in the same batch still succeed."
    // This means we should NOT wrap the *entire* batch in a single failing transaction.
    // Instead, process each event individually (perhaps in its own transaction or savepoint) to isolate failures.

    for (const event of events) {
        let resultStatus = 'ACCEPTED';
        let errorReason = null;

        const { source_id, event_id, type, quantity, target_event_id, event_time } = event;

        try {
            // Basic validation
            if (!source_id || !event_id || !type || !event_time) {
                throw new Error("Missing required fields");
            }
            if (type !== 'COUNT' && type !== 'VOID') {
                throw new Error("Invalid type");
            }

            // Begin isolated transaction for this event
            await pool.query('BEGIN');

            // Upsert the source_id to satisfy foreign key constraints
            await pool.query(
                `INSERT INTO production_sources (source_id, display_name) VALUES ($1, $1) ON CONFLICT (source_id) DO NOTHING`,
                [source_id]
            );

            // Check for existing event (Duplicate/Conflict)
            const existingQuery = await pool.query(
                `SELECT * FROM production_events WHERE source_id = $1 AND event_id = $2`,
                [source_id, event_id]
            );

            if (existingQuery.rows.length > 0) {
                const existing = existingQuery.rows[0];
                // Check if it's an exact duplicate
                if (existing.type === type && existing.quantity === quantity && existing.target_event_id === target_event_id) {
                    throw new Error("DUPLICATE");
                } else {
                    throw new Error("CONFLICT");
                }
            }

            // Handle VOID logic
            if (type === 'VOID') {
                if (!target_event_id) throw new Error("VOID missing target_event_id");

                // Check if target COUNT exists
                const targetQuery = await pool.query(
                    `SELECT status FROM production_events WHERE source_id = $1 AND event_id = $2 AND type = 'COUNT'`,
                    [source_id, target_event_id]
                );

                if (targetQuery.rows.length === 0) {
                    // VOID arrived before COUNT -> PENDING_REFERENCE
                    resultStatus = 'PENDING_REFERENCE';
                }
            }

            // Insert into production_events
            await pool.query(
                `INSERT INTO production_events (source_id, event_id, type, quantity, target_event_id, event_time, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [source_id, event_id, type, quantity || null, target_event_id || null, event_time, resultStatus]
            );

            // If this was a COUNT, we should check if any PENDING_REFERENCE VOIDs apply to it
            if (type === 'COUNT') {
                const pendingVoids = await pool.query(
                    `SELECT event_id FROM production_events 
                     WHERE source_id = $1 AND target_event_id = $2 AND type = 'VOID' AND status = 'PENDING_REFERENCE'
                     ORDER BY created_at ASC`,
                    [source_id, event_id]
                );

                if (pendingVoids.rows.length > 0) {
                    // Resolve the first one
                    const winningVoid = pendingVoids.rows[0];
                    await pool.query(
                        `UPDATE production_events SET status = 'ACCEPTED' WHERE source_id = $1 AND event_id = $2`,
                        [source_id, winningVoid.event_id]
                    );

                    // Reject others (if any) by deleting from production_events and updating their submission attempts
                    for (let i = 1; i < pendingVoids.rows.length; i++) {
                        const rejectedVoid = pendingVoids.rows[i];
                        await pool.query(
                            `DELETE FROM production_events WHERE source_id = $1 AND event_id = $2`,
                            [source_id, rejectedVoid.event_id]
                        );
                        await pool.query(
                            `UPDATE submission_attempts SET classification = 'REJECTED', error_reason = 'Another VOID already applied'
                             WHERE source_id = $1 AND event_id = $2`,
                            [source_id, rejectedVoid.event_id]
                        );
                    }
                }
            }

            await pool.query('COMMIT');
        } catch (error: any) {
            await pool.query('ROLLBACK');
            
            if (error.message === 'DUPLICATE') {
                resultStatus = 'DUPLICATE';
                errorReason = 'Event already processed with same payload';
            } else if (error.message === 'CONFLICT') {
                resultStatus = 'CONFLICT';
                errorReason = 'Event ID exists with different payload';
            } else {
                resultStatus = 'REJECTED';
                errorReason = error.message;
            }
        }

        // Always record attempt
        try {
            await pool.query(
                `INSERT INTO submission_attempts (raw_payload, source_id, event_id, classification, error_reason)
                 VALUES ($1, $2, $3, $4, $5)`,
                [event, source_id, event_id, resultStatus, errorReason]
            );
        } catch (err) {
            console.error("Failed to log submission attempt:", err);
        }

        results.push({
            event_id,
            status: resultStatus,
            error: errorReason
        });
    }

    return results;
}
