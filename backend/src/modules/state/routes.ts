import { Router } from 'express';

const stateRouter = Router();

// GET /api/state
// Return summary totals, pending items, and unresolved exceptions
stateRouter.get('/', async (req, res) => {
    try {
        // TODO: Pass to queries layer to fetch from durable evidence/projections
        
        // Mock response for frontend integration
        res.status(200).json({
            summary: {
                net_total: 0,
                processed_events: 0,
                pending_void: 0,
                unresolved: 0,
                duplicates: 0,
                conflicts: 0
            },
            pending: [],
            exceptions: []
        });
    } catch (error) {
        console.error("Error fetching state:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export { stateRouter };
