import mongoose from "mongoose";

export const ExeStatisticSchema = new mongoose.Schema({
    taskId: { type: String, required: true, index: 1 },
    contextId: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    startAt: { type: Number, required: true, index: -1 },
    endAt: { type: Number, required: true },
});

export const TimeStatisticSchema = new mongoose.Schema({
    timeline: { type: Number, required: true, index: -1 },
    // TODO: 채우기...
});