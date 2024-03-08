import mongoose from "mongoose";

export const StatisticSchema = new mongoose.Schema({
    taskId: { type: String, required: true },
    contextId: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    startAt: { type: Number, required: true, index: -1 },
    endAt: { type: Number, required: true },
});
