import { Task } from "test/test-grid";
import mongoose from "mongoose";

export const LogSchema = new mongoose.Schema({
    taskId: { type: String, required: true },
    contextId: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    level: { type: String, required: true, enum: Object.values(Task.LogLevel) },
    timestamp: { type: Number, required: true, index: -1 },
});