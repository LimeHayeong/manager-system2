import { Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { ILogDoc } from "../database/dto/log.interface";
import { Log } from "../types/log";
import { log } from "console";

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

        setInterval(() => {
            if(this.logBuffer.length > 0) {
                const bufferToFlush = [...this.logBuffer]
                this.logBuffer = [];
                this.flushLogBuffer(bufferToFlush);
            }
        }, this.logInterval);
        setInterval(() => {
            if(this.consoleBuffer.length > 0) {
                const bufferToFlush = [...this.consoleBuffer]
                this.consoleBuffer = [];
                this.flushConsoleBuffer(bufferToFlush);
            }
        }, this.consoleInterval);
    }

    public async pushLog(log: Log.Log) {
        this.logBuffer.push(log);
        if( this.logBuffer.length >= this.maxBufferSize){
            // 버퍼가 최대 크기에 도달하면 현재 버퍼를 복사하고 비동기적으로 플러시
            const bufferToFlush = [...this.logBuffer];
            this.logBuffer = []; // 현재 버퍼 초기화
            this.flushLogBuffer(bufferToFlush); // 복사된 버퍼 비동기처리
        }
    }

    public async pushConsole(log: Log.Log) {
        this.logBuffer.push(log);
        if( this.logBuffer.length >= this.maxBufferSize){
            // 버퍼가 최대 크기에 도달하면 현재 버퍼를 복사하고 비동기적으로 플러시
            const bufferToFlush = [...this.logBuffer];
            this.logBuffer = []; // 현재 버퍼 초기화
            this.flushLogBuffer(bufferToFlush);
        }
    }

    private async flushLogBuffer(buffer: Log.Log[]) {
        try {
            const bulkOps = buffer.map(log => ({
                insertOne: {
                    document: log
                }
            }))
            await this.logModel.bulkWrite(bulkOps);
            console.log('[System] 로그 플러시 완료: ', buffer.length)
        } catch (e) {
            console.error('[System] 로그 플러시 중 오류 발생: ', e)
        }
    }

    private async flushConsoleBuffer(buffer: Log.Log[]) {
        try {
            buffer.map(log => console.log(log));
        } catch (e) {
            console.error('[System] 콘솔 로그 플러시 중 오류 발생: ', e)
        }
    }
}