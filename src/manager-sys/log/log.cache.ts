import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Log } from "../types/log";
import { Model } from "mongoose";
import { ILogDoc } from "../database/dto/log.interface";
import { TaskId } from "../types/taskId";
import { wsError } from "../types/ws.response";
import { recentLogsResponseDTO } from "src/ws/dto/recent-logs.dto";

@Injectable()
export class LogCache implements OnModuleInit {
    private cache: Log.LogCache = {};

    constructor(
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
    ) {
    }

    async onModuleInit() {
        TaskId.generateTaskId().map((id) => {
            this.cache[id] = [];
        })
    }

    public pushLog(taskId: string, log: Log.Log) {
        const logs = this.cache[taskId];
        if(logs.length > 0 && logs[logs.length - 1].contextId !== log.contextId) {
            // 새로 들어온 contextId와 다르면, 새로운 배열로 만들어줌.
            this.cache[taskId] = [];
            this.cache[taskId].push(log);
        }else{
            logs.push(log);
        }
    }

    public getRecentLogs(taskId: string, offset: number, limit: number): recentLogsResponseDTO {
        if(!this.cache[taskId]) throw new wsError('TaskId not found', 404);
        const result = this.cache[taskId].slice(offset, offset + limit)
        return {
            offset: offset,
            limit: limit,
            logs: result
        }
    }
}