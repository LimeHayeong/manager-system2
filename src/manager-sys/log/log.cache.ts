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
        // 여기도 이후에 domain-service-task, taskType 노가다 완료되면 해당 꺼 가져오는 로직으로 변경해야 함.
        const taskIds = TaskId.TaskIds;

        TaskId.generateTaskId().map((id, i) => {
            taskIds[i].exeTypes.map((exeType) => {
                this.cache[id.concat(`-${exeType}`)] = [];
            })
        })

        // console.log(this.cache)
    }

    public pushLog(taskId: string, log: Log.Log) {
        const idx = taskId.concat(`-${log.exeType}`)
        // console.log('idx: ', idx)
        const logs = this.cache[idx]; 
        if(logs.length > 0 && logs[logs.length - 1].contextId !== log.contextId) {
            // 새로 들어온 contextId와 다르면, 새로운 배열로 만들어줌.
            this.cache[idx] = [];
            this.cache[idx].push(log);
        }else{
            logs.push(log);
        }
    }

    public getRecentLogs(taskId: string, exeType: string, offset: number, limit: number): recentLogsResponseDTO {
        const idx = taskId.concat(`-${exeType}`)
        if(!this.cache[idx]) throw new wsError('TaskId not found', 404);
        const result = this.cache[idx].slice(offset, offset + limit)
        return {
            offset: offset,
            limit: limit,
            logs: result
        }
    }
}