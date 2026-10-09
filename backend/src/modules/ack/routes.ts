import { Request, Response } from 'express';
import { processAcksService } from './service.js';

export const handleAckPost = async (req: Request, res: Response) => {
    try {
        const { event_ids } = req.body;
        
        if (!Array.isArray(event_ids)) {
            return res.status(400).json({ error: "Expected an array of event_ids" });
        }
        
        const results = await processAcksService(event_ids);
        
        res.status(200).json({ 
            message: "Events acknowledged", 
            results: results 
        });
    } catch (error) {
        console.error("Error acknowledging events:", error);
        res.status(400).json({ error: "Invalid request payload" });
    }
};
