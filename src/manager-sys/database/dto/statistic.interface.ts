import { Document } from "mongoose";
import { Stat } from "src/manager-sys/types/statistic";

export interface IExeStatisticDoc extends Document, Readonly<Stat.ExeStatistic> {
}

export interface ITimeStatisticDoc extends Document, Readonly<Stat.TimeStatistic> {
}

export interface IMetaDoc extends Document, Readonly<Stat.Meta> {
}