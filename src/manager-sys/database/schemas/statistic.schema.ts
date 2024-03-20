import mongoose from "mongoose";

export const ExeStatisticSchema = new mongoose.Schema({
    taskId: [{ type: String, required: true}],
    contextId: { type: String, required: true, index: 1 },
    data: mongoose.Schema.Types.Mixed,
    startAt: { type: Number, required: true, index: -1},
    endAt: { type: Number, required: true },
});

export const TimeStatisticSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true, index: -1},
    taskId: { type: String, required: true, index: 1 },
    data: mongoose.Schema.Types.Mixed,
});

export const MetaSchema = new mongoose.Schema({
    lastStatisticId: { type: mongoose.Schema.Types.ObjectId, required: true}
})