import { Request, Response } from 'express';
import { processEventsService } from './service.js';

export const handleEventsPost = async (req: Request, res: Response) => {
    try {
        const events = req.body;
        
        if (!Array.isArray(events)) {
            return res.status(400).json({ error: "Expected an array of events" });
        }
        
        const results = await processEventsService(events);
        
        // Per spec: Return HTTP 200 when the processed JSON list arrives in exact order, even if some items are REJECTED.
        res.status(200).json({ results });
    } catch (error) {
        console.error("Error processing events:", error);
        res.status(400).json({ error: "Invalid request payload" });
    }
};
