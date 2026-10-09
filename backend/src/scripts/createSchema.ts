import { pool } from '../config/db.js';
import { schemaQueries } from '../shared/db/schema.js';

async function createSchema() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const query of schemaQueries) {
            console.log(`Executing: ${query.name}`);
            await client.query(query.sql);
        }

        await client.query('COMMIT');
        console.log("Schema created successfully in 3NF.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to create schema:", e);
        process.exit(1);
    } finally {
        client.release();
        // Close the pool so the script can exit
        await pool.end();
    }
}

createSchema();
