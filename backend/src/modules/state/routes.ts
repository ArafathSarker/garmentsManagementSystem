import { Request, Response } from 'express';
import { getStateQueries } from './queries.js';

export const handleStateGet = async (req: Request, res: Response) => {
    try {
        const sourceId = req.query.source_id as string | undefined;
        const data = await getStateQueries(sourceId);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching state:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
