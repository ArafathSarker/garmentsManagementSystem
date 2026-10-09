export const schemaQueries = [
    {
        name: 'production_sources table',
        sql: `
            CREATE TABLE IF NOT EXISTS production_sources (
                source_id VARCHAR PRIMARY KEY,
                display_name VARCHAR,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `
    },
    {
        name: 'production_events table',
        sql: `
            CREATE TABLE IF NOT EXISTS production_events (
                source_id VARCHAR NOT NULL REFERENCES production_sources(source_id),
                event_id VARCHAR NOT NULL,
                type VARCHAR NOT NULL CHECK (type IN ('COUNT', 'VOID')),
                quantity INTEGER CHECK (
                    (type = 'COUNT' AND quantity > 0 AND quantity <= 500) OR
                    (type = 'VOID' AND quantity IS NULL)
                ),
                target_event_id VARCHAR,
                event_time TIMESTAMPTZ NOT NULL,
                status VARCHAR NOT NULL CHECK (status IN ('ACCEPTED', 'PENDING_REFERENCE')),
                acknowledged_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (source_id, event_id)
            );
        `
    },
    {
        name: 'one_void_per_count_idx index',
        sql: `
            CREATE UNIQUE INDEX IF NOT EXISTS one_void_per_count_idx
                ON production_events (source_id, target_event_id)
                WHERE type = 'VOID' AND status = 'ACCEPTED';
        `
    },
    {
        name: 'submission_attempts table',
        sql: `
            CREATE TABLE IF NOT EXISTS submission_attempts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                raw_payload JSONB NOT NULL,
                source_id VARCHAR,
                event_id VARCHAR,
                classification VARCHAR NOT NULL CHECK (classification IN ('ACCEPTED', 'PENDING_REFERENCE', 'DUPLICATE', 'CONFLICT', 'REJECTED')),
                error_reason TEXT,
                received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `
    },
    {
        name: 'mqtt_challenges table',
        sql: `
            CREATE TABLE IF NOT EXISTS mqtt_challenges (
                challenge_id VARCHAR PRIMARY KEY,
                request_body JSONB NOT NULL,
                serialized_result JSONB,
                status VARCHAR NOT NULL,
                received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                responded_at TIMESTAMPTZ
            );
        `
    }
];
