import { pool } from '../../config/db.js';

export async function getStateQueries() {
    // We should read summary totals from durable evidence (the tables)
    // For net_total: Sum of accepted COUNT quantities minus accepted VOID quantities
    // Actually, VOID events have quantity = null in our schema, but they reverse exactly one COUNT.
    // So net_total = (sum of COUNT quantities) - (sum of COUNT quantities that have an accepted VOID)
    
    const summaryQuery = await pool.query(`
        WITH counts AS (
            SELECT quantity, event_id, source_id FROM production_events WHERE type = 'COUNT' AND status = 'ACCEPTED'
        ),
        voids AS (
            SELECT target_event_id, source_id FROM production_events WHERE type = 'VOID' AND status = 'ACCEPTED'
        )
        SELECT 
            COALESCE((SELECT COALESCE(SUM(quantity), 0) FROM counts c WHERE NOT EXISTS (
                SELECT 1 FROM voids v WHERE v.target_event_id = c.event_id AND v.source_id = c.source_id
            )), 0)::int as net_total,
            (SELECT COUNT(*) FROM production_events WHERE status = 'ACCEPTED')::int as processed_events,
            (SELECT COUNT(*) FROM production_events WHERE type = 'VOID' AND status = 'PENDING_REFERENCE')::int as pending_void,
            (SELECT COUNT(*) FROM submission_attempts WHERE classification = 'REJECTED')::int as unresolved,
            (SELECT COUNT(*) FROM submission_attempts WHERE classification = 'DUPLICATE')::int as duplicates,
            (SELECT COUNT(*) FROM submission_attempts WHERE classification = 'CONFLICT')::int as conflicts
    `);

    // Pending: Successfully processed COUNT/VOID events sent for ack but not yet acked
    const pendingQuery = await pool.query(`
        SELECT source_id, event_id, type, quantity, status, event_time 
        FROM production_events 
        WHERE status = 'ACCEPTED' AND acknowledged_at IS NULL
    `);

    // Exceptions: Unresolved device lost, rejected, conflict
    const exceptionsQuery = await pool.query(`
        SELECT source_id, event_id, classification, error_reason as error, received_at 
        FROM submission_attempts 
        WHERE classification IN ('REJECTED', 'CONFLICT')
    `);

    return {
        summary: summaryQuery.rows[0],
        pending: pendingQuery.rows,
        exceptions: exceptionsQuery.rows
    };
}
