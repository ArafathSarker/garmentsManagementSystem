import express from "express";
import cors from "cors";

// Import module routers
import { eventsRouter } from "../modules/events/routes.js";
import { stateRouter } from "../modules/state/routes.js";
import { ackRouter } from "../modules/ack/routes.js";

export const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for parsing JSON bodies

// Register module routes
app.use("/api/events", eventsRouter);
app.use("/api/state", stateRouter);
app.use("/api/ack", ackRouter);

// Basic health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});
