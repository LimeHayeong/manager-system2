import * as fs from 'fs';

import { Injectable } from '@nestjs/common';
import { Task } from '../types/task';

// TODO: CONFIG화
const fileInterval = 5000;
const consoleInterval = 1000;
const tempfilename = 'log2.json'

// TODO: Error handling
@Injectable()
export class LoggerService {
    private fileBuffer: Task.Log[] = [];
    private consoleBuffer: Task.Log[] = [];
    private maxBufferSize: number;
    private fileInterval: number;
    private consoleInterval: number;

    constructor() {
        // this.maxBufferSize = tempBufferSize;
        this.fileInterval = fileInterval;
        this.consoleInterval = consoleInterval;

        setInterval(() => {
            if(this.fileBuffer.length > 0) {
                this.fileBufferFlush();
            }
        }, this.fileInterval);

        setInterval(() => {
            if(this.consoleBuffer.length > 0) {
                this.consoleBufferFlush();
            }
        }, this.consoleInterval);
    }

    // TaskLog buffer에 push
    public async pushFileLog(log: Task.Log) {
        try {
            this.fileBuffer.push(log);
            if(this.fileBuffer.length >= this.maxBufferSize){
                this.fileBufferFlush();
            }
          } catch (e) {
          }
    }

    // Buffer 비우면서 Log 파일에 기록.
    // TODO: 파일 세분화
    public async fileBufferFlush() {
        try {
            console.log('[System] flushing log buffer: ' + this.fileBuffer.length);

            const data = this.fileBuffer.map(log => JSON.stringify(log)).join('\n')

            fs.appendFileSync(tempfilename, data + '\n');

            this.fileBuffer = [];
        } catch (e) {
            console.error('Error during flushing logs: ', e)
        }
    }

    public async pushConsoleLog(log: Task.Log) {
        try {
            this.consoleBuffer.push(log);
          } catch (e) {
          
          }
    }

    public async consoleBufferFlush() {
        try {
            // console.log('[System] flushing console buffer: ' + this.consoleBuffer.length);
            // 검사구문 없으면 더 빠를텐데.
            this.consoleBuffer.map(log => {
                if(log.data === null){
                    console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}][${log.logTiming}] `)
                } else if(typeof log.data !== 'string' && 'message' in log.data){
                    console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}][${log.logTiming}] ` + log.data.message)
                }else{
                    console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}][${log.logTiming}] ` + log.data)
                }
            });
            this.consoleBuffer = [];
        } catch (e) {
            console.error('Error during flushing console logs: ', e)
        }
    }
}
