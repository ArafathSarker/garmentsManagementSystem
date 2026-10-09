import { pool } from '../../config/db.js';

export async function processAcksService(eventIds: string[]) {
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return [];
    }

    const results = [];
    
    // Process each individually to ensure partial success capability
    for (const eventId of eventIds) {
        try {
            const queryResult = await pool.query(
                `UPDATE production_events 
                 SET acknowledged_at = NOW() 
                 WHERE event_id = $1 AND acknowledged_at IS NULL
                 RETURNING event_id`,
                [eventId]
            );

            if (queryResult.rowCount !== null && queryResult.rowCount > 0) {
                results.push({ event_id: eventId, result: "ACKED" });
            } else {
                results.push({ event_id: eventId, result: "FAILED" });
            }
        } catch (error) {
            console.error(`Error acknowledging event ${eventId}:`, error);
            results.push({ event_id: eventId, result: "FAILED" });
        }
    }

    return results;
}
