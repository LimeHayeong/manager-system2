import { Log } from "src/manager-sys/types/log";
import { Task } from "src/manager-sys/types/task";
import mongoose from "mongoose";

export const LogSchema = new mongoose.Schema({
    taskId: { type: String, required: true, index: 1 },
    contextId: { type: String, required: true },
    exeType: { type: String, required: true, enum: Object.values(Task.ExecutionType) },
    data: mongoose.Schema.Types.Mixed,
    level: { type: String, required: true, enum: Object.values(Log.Level) },
    timestamp: { type: Number, required: true, index: -1},
});