## Requirement Decisions & Future Migrations

1. **Microservices & Event Brokers:** The assessment requested not to implement a real microservices platform today (like Kafka, RabbitMQ, or Kubernetes) but asked to explain a credible future migration path instead.
   - **Future Migration Path:** Right now, the system operates as a modular monolith. The events, state, and acknowledgement modules act as independent domains inside a single Express application.
   - To migrate this to a true microservices architecture, we would introduce an event broker like **Apache Kafka** or **RabbitMQ**.
   - The `POST /api/events` and MQTT broker would act purely as an Ingress. It would drop the raw payloads onto a `raw-events` Kafka topic.
   - The `events` service would be extracted into its own container, listening to the `raw-events` topic. It would execute the validation (e.g., max 500 constraint) and duplicate checking, and then publish valid events to a `processed-events` topic.
   - The `state` service would consume the `processed-events` topic, updating a fast read-optimized database (like Redis or materialized views in Postgres) to serve the `GET /api/state` queries at high throughput.
   This guarantees that changing a business rule in the event processing pipeline does not require re-deploying the state API.

2. **Database Isolation:** Currently, a single PostgreSQL instance handles raw ingestion audits, event tracking, and state aggregation. As throughput scales, the read-heavy dashboard polling (every 5 seconds) could block write-heavy ingest. 
   - **Future Migration Path:** We would split the datastore using the CQRS (Command Query Responsibility Segregation) pattern. Writes (ingest) would go to a primary PostgreSQL master node, while the dashboard reads from asynchronous Read Replicas.
