# AI Usage and Conversation Record

This document contains the record of AI assistance used during the candidate assessment, as per the requirements.

## AI Tools Used
- Google Antigravity (Gemini 3.1 Pro)

---

## Conversation Transcript

### User - Prompt 1
> check the whole pages and create the database the database should be in 3nf converted.

### AI - Response 1
*The AI analyzed the candidate assessment documents and designed a 3NF PostgreSQL database schema. The AI wrote the initial schema script into `backend/src/scripts/createSchema.ts`.*

**Explanation provided by AI:**
- **1NF (First Normal Form):** All attributes contain only atomic values. There are no repeating groups. For instance, `raw_payload` in `submission_attempts` uses JSONB, but this is a standard exception for logging systems since it represents a singular, intact atomic "document" from the perspective of the attempt logging.
- **2NF (Second Normal Form):** It meets 1NF and all non-key attributes are fully functionally dependent on the primary key. In `production_events`, the primary key is a composite of `(source_id, event_id)`. The fields `type`, `quantity`, `event_time`, `status`, and `acknowledged_at` all depend on the *entire* event, not just the `source_id` or just the `event_id`.
- **3NF (Third Normal Form):** It meets 2NF and there are no transitive dependencies between non-key attributes. For example, `status` does not depend on `quantity`, nor does `acknowledged_at` depend on `type`.

### User - Prompt 2
> please follow the file architecture and I want you create a seperate dbobject there must be a js object array there will be objects called name and sql and you will iterate the object in the createSchema.ts it will more better for me and please folow the give pictures architecture.

### AI - Response 2
*The AI refactored the database schema creation to match the suggested folder layout from the assessment brief. It created the `backend/src/shared/db/schema.ts` file holding an array of SQL queries and updated `backend/src/scripts/createSchema.ts` to loop through them.*

### User - Prompt 3
> now create a agent conversation read.me file as mentioned in the pictures and put the conversations please

### AI - Response 3
*The AI created this `AI_USAGE.md` file and transcribed the conversation record.*
