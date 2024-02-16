import * as fs from 'fs';

import { Injectable } from '@nestjs/common';
import { Task } from '../types/task';

// TODO: CONFIG화
const fileInterval = 5000;
const consoleInterval = 1000;
// 실제로는 5분 정도로 해도 괜찮다. 1000 * 60 * 5
const statisticInterval = 1000 * 1;
const tempfilename = 'log4.json'
const tempstatisticfilename = 'log-statistic.json'

// TODO: Error handling
@Injectable()
export class LoggerService {
    private fileBuffer: Task.Log[] = [];
    private consoleBuffer: Task.Log[] = [];
    private statisticBuffer: Task.StatisticLog[] = [];
    private maxBufferSize: number;
    private fileInterval: number;
    private consoleInterval: number;
    private statisticInterval: number;

    constructor() {
        // this.maxBufferSize = tempBufferSize;
        this.fileInterval = fileInterval;
        this.consoleInterval = consoleInterval;
        this.statisticInterval = statisticInterval;

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

        setInterval(() => {
            if(this.statisticBuffer.length > 0) {
                this.statisticBufferFlush();
            }
        }, this.statisticInterval)
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
    private async fileBufferFlush() {
        try {
            console.log('[System] flushing log buffer: ' + this.fileBuffer.length);

            const data = this.fileBuffer.map(log => JSON.stringify(log)).join('\n')

            fs.appendFileSync(tempfilename, data + '\n');

            this.fileBuffer = [];
        } catch (e) {
            console.error('Error during flushing logs: ', e)
        }
    }

    public async pushStatisticLog(log: Task.StatisticLog) {
        try {
            this.statisticBuffer.push(log);
        } catch (e) {

        }
    }

    private async statisticBufferFlush() {
        try {
            console.log('[System] flushing statistic buffer: ' + this.statisticBuffer.length);

            const data = this.statisticBuffer.map(log => JSON.stringify(log)).join('\n')

            fs.appendFileSync(tempstatisticfilename, data + '\n');

            this.statisticBuffer = [];
        } catch (e) {
            console.error('Error during flushing statistic logs: ', e)
        }
    }

    public async pushConsoleLog(log: Task.Log) {
        try {
            this.consoleBuffer.push(log);
          } catch (e) {
          
          }
    }

    private async consoleBufferFlush() {
        try {
            // console.log('[System] flushing console buffer: ' + this.consoleBuffer.length);
            // 검사구문 없으면 더 빠를텐데.
            this.consoleBuffer.map(log => {
                if(log.data === null){
                    console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}][${log.logTiming}]`)
                } else if(typeof log.data !=='string' && 'message' in log.data && 'chain' in log.data){
                    console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}][${log.logTiming}] ` + `[${log.data.chain}] ` + log.data.message)
                } else if(typeof log.data !== 'string' && 'message' in log.data){
                    console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}][${log.logTiming}] ` + log.data.message)
                } else {
                    console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}][${log.logTiming}] ` + log.data)
                }
            });
            this.consoleBuffer = [];
        } catch (e) {
            console.error('Error during flushing console logs: ', e)
        }
    }
}
