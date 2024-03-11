import { Document } from "mongoose";
import { Log } from "src/manager-sys/types/log";

export interface ILogDoc extends Document, Readonly<Log.Log> {
}