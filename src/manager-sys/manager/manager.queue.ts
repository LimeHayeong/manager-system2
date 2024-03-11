import { Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { ILogDoc } from "../database/dto/log.interface";
import { Log } from "../types/log";

const logInterval = 1000 * 60; // 1분
const consoleInterval = 1000 * 10; // 10초
const bufferSize = 500;

@Injectable()
export class ManagerQueue {
    private logBuffer: Log.Log[] = [];
    private consoleBuffer: Log.Log[] = [];
    private maxBufferSize: number;
    private logInterval: number;
    private consoleInterval: number;

    constructor(
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
    ) {
        this.init();
    }

    private init() {
        this.logInterval = logInterval;
        this.consoleInterval = consoleInterval;
        this.maxBufferSize = bufferSize;

        setInterval(() => this.logBuffer.length > 0 && this.flushLogBuffer(), this.logInterval);
        setInterval(() => this.consoleBuffer.length > 0 && this.flushConsoleBuffer(), this.consoleInterval);
    }

    public pushLog(log: Log.Log) {
        this.logBuffer.push(log);
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flushLogBuffer();
        }
    }

    public pushConsole(log: Log.Log) {
        this.consoleBuffer.push(log);
        if (this.consoleBuffer.length >= this.maxBufferSize) {
            this.flushConsoleBuffer();
        }
    }

    private async flushLogBuffer() {
        try {
            const bulkOps = this.logBuffer
                .map(log => ({
                    insertOne: {
                        document: log
                    }
                }))
            await this.logModel.bulkWrite(bulkOps);

            console.log(`[System] ${bulkOps.length}개 항목을 db에 넣음`)
            this.logBuffer = [];
        } catch (e) {
            console.error('[System] 로그 플러시 중 오류 발생: ', e)
        }
    }

    private async flushConsoleBuffer() {
        try {
            // this.consoleBuffer.map(log => {
            //     console.log(log);
            // })
            this.consoleBuffer = [];
        } catch (e) {
            console.error('[System] 콘솔 플러시 중 오류 발생: ', e)
        }
    }
}