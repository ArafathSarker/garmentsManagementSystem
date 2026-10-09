import express from "express";
import cors from "cors";

// Import module handlers
import { handleEventsPost } from "../modules/events/routes.js";
import { handleStateGet } from "../modules/state/routes.js";
import { handleAckPost } from "../modules/ack/routes.js";

export const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for parsing JSON bodies

// Register API endpoints explicitly
app.post("/api/events", handleEventsPost);
app.get("/api/state", handleStateGet);
app.post("/api/ack", handleAckPost);

// Basic health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});
