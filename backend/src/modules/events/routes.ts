import { Router } from 'express';

const eventsRouter = Router();

// POST /api/events
// Process a batch of JSON events
eventsRouter.post('/', async (req, res) => {
    try {
        // TODO: Pass to validation and service layers
        const events = req.body;
        
        // Mock response for now to satisfy initial REST API check
        res.status(200).json({ message: "Events received", count: Array.isArray(events) ? events.length : 0 });
    } catch (error) {
        console.error("Error processing events:", error);
        res.status(400).json({ error: "Invalid request payload" });
    }
});

export { eventsRouter };
