import { pool } from '../../config/db.js';

export async function getStateQueries(sourceId?: string) {
    const params = sourceId ? [sourceId] : [];
    const sourceFilterAnd = sourceId ? 'AND source_id = $1' : '';

    const summaryQuery = await pool.query(`
        WITH counts AS (
            SELECT quantity, event_id, source_id FROM production_events WHERE type = 'COUNT' AND status = 'ACCEPTED' ${sourceFilterAnd}
        ),
        voids AS (
            SELECT target_event_id, source_id FROM production_events WHERE type = 'VOID' AND status = 'ACCEPTED' ${sourceFilterAnd}
        )
        SELECT 
            COALESCE((SELECT COALESCE(SUM(quantity), 0) FROM counts c WHERE NOT EXISTS (
                SELECT 1 FROM voids v WHERE v.target_event_id = c.event_id AND v.source_id = c.source_id
            )), 0)::int as net_total,
            (SELECT COUNT(*) FROM production_events WHERE status = 'ACCEPTED' ${sourceFilterAnd})::int as processed_events,
            (SELECT COUNT(*) FROM production_events WHERE type = 'VOID' AND status = 'PENDING_REFERENCE' ${sourceFilterAnd})::int as pending_void,
            (SELECT COUNT(*) FROM submission_attempts WHERE classification = 'REJECTED' ${sourceFilterAnd})::int as unresolved,
            (SELECT COUNT(*) FROM submission_attempts WHERE classification = 'DUPLICATE' ${sourceFilterAnd})::int as duplicates,
            (SELECT COUNT(*) FROM submission_attempts WHERE classification = 'CONFLICT' ${sourceFilterAnd})::int as conflicts,
            (SELECT COUNT(*) FROM submission_attempts WHERE classification = 'REJECTED' ${sourceFilterAnd})::int as rejected_submissions
    `, params);

    // Pending: Successfully processed COUNT/VOID events sent for ack but not yet acked
    const pendingQuery = await pool.query(`
        SELECT source_id, event_id, type, quantity, status, event_time 
        FROM production_events 
        WHERE status = 'ACCEPTED' AND acknowledged_at IS NULL
        ${sourceFilterAnd}
    `, params);

    // Exceptions: Unresolved device lost, rejected, conflict
    const exceptionsQuery = await pool.query(`
        SELECT source_id, event_id, classification, error_reason as error, received_at 
        FROM submission_attempts 
        WHERE classification IN ('REJECTED', 'CONFLICT')
        ${sourceFilterAnd}
    `, params);

    return {
        summary: summaryQuery.rows[0],
        pending: pendingQuery.rows,
        exceptions: exceptionsQuery.rows
    };
}
