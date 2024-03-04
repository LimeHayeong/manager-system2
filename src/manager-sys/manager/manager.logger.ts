import * as fs from 'fs';
import * as path from 'path'

import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { Task } from '../types/task';

// TODO: CONFIG화
const fileInterval = 1000 * 5; // 5초
const consoleInterval = 1000 * 100; // 1초
// 실제로는 5분 정도로 해도 괜찮다. 1000 * 60 * 5
const statisticInterval = 1000 * 1;

@Injectable()
export class ManagerLogger {
    private fileBuffer: Task.Log[] = [];
    private consoleBuffer: Task.Log[] = [];
    private statisticBuffer: Task.StatisticLog[] = [];
    private maxBufferSize: number;
    private fileInterval: number;
    private consoleInterval: number;
    private statisticInterval: number;
    private isStatisticLogUsing: boolean = false;

    constructor() {
        // this.maxBufferSize = tempBufferSize;
        this.fileInterval = fileInterval;
        this.consoleInterval = consoleInterval;
        this.statisticInterval = statisticInterval;

        // for test
        // this.deleteOldLogs();
        // this.truncateLogStatisticFile();
        
        this.initialization();
    }

    private initialization() {
        setInterval(() => this.fileBuffer.length > 0 && this.fileBufferFlush(), this.fileInterval);
        setInterval(() => this.consoleBuffer.length > 0 && this.consoleBufferFlush(), this.consoleInterval);
        setInterval(() => this.statisticBuffer.length > 0 && this.statisticBufferFlush(), this.statisticInterval)
    }

    // 현재 날짜로부터 8일 이전 로그 삭제
    @Cron('21 37 1 * * *')
    private deleteOldLogs() {
        const logDirectory = 'logs'; // 로그가 저장되는 디렉토리
        const files = fs.readdirSync(logDirectory);

        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 8); // 8일 이전 날짜 계산

        files.forEach(file => {
            const filePath = path.join(logDirectory, file);
            const datePattern = /log-(\d{4}-\d{2}-\d{2})\.json$/; // 정규 표현식으로 날짜 형식 매칭
            const match = file.match(datePattern);
            if (match) {
                const fileDate = match[1]; // 첫 번째 캡처 그룹 (날짜)
                const fileDateObject = new Date(fileDate);

                if (fileDateObject < currentDate) {
                    // 파일 날짜가 8일 이전인 경우 삭제
                    fs.unlinkSync(filePath);
                    console.log(`[System] Deleted old log file: ${file}`);
                }
            }
        });
    }

    // log statistic 파일 정리, 1MB 이상이면 삭제. 하루에 1번 실행.
    // 시간이 좀 걸림.
    @Cron('23 38 1 * * *')
    private async truncateLogStatisticFile() {
        // 혹시라도 사용 중이면 대기
        while (this.isStatisticLogUsing) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.isStatisticLogUsing = true;

        try {
            console.log('[System] Truncating log-statistic file...');
        
            const filePath = path.join('logs/log-statistic.json');
            
            // 파일 크기 확인
            let stats = fs.statSync(filePath);
            let fileSizeInBytes = stats.size;
            const targetSizeInBytes = 1024 * 1024; // 1MB in bytes
    
        
            if (fileSizeInBytes > targetSizeInBytes) {
                // 파일 읽기
                let fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
                let lines = fileContent.split('\n');
                
                // 파일 크기가 목표보다 큰 동안 앞부분의 100줄 제거
                while (fileSizeInBytes > targetSizeInBytes && lines.length > 100) {
                    // 앞부분의 100줄 한 번에 제거
                    lines.splice(0, 100);
        
                    // 변경된 내용으로 파일 크기 재계산
                    fileContent = lines.join('\n');
                    fileSizeInBytes = Buffer.byteLength(fileContent, 'utf8');
                }
                
                // 변경된 내용 저장
                fs.writeFileSync(filePath, fileContent, { encoding: 'utf8' });
                console.log('[System] Reduced size of log-statistic file to under 0.5MB.');
            }
        } catch (e) {
            console.error(e);
        }
        
        this.isStatisticLogUsing = false;
    }


    // TaskLog buffer에 push
    public async pushFileLog(log: Task.Log) {
        this.fileBuffer.push(log);
        if(this.fileBuffer.length >= this.maxBufferSize){
            this.fileBufferFlush();
        }
    }

    // Buffer 비우면서 Log 파일에 기록.
    private async fileBufferFlush() {
         // 날짜 기반으로 동적 파일 이름 사용
         const filename = this.getLogFilename('logs/log');
         this.flushBufferToFile(this.fileBuffer, filename);
         this.fileBuffer = [];
    }

    public async pushStatisticLog(log: Task.StatisticLog) {
        this.statisticBuffer.push(log);
    }

    public getStatisticLogUsing(): boolean {
        return this.isStatisticLogUsing
    }

    public useStatisticLog() {
        this.isStatisticLogUsing = true;
    }
    public freeStatisticLog() {
        this.isStatisticLogUsing = false;
    }

    private async statisticBufferFlush() {
        // 혹시라도 사용 중이면 대기
        while (this.isStatisticLogUsing) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.isStatisticLogUsing = true;

        const filename = 'logs/log-statistic.json';
        this.flushBufferToFile(this.statisticBuffer, filename);
        this.statisticBuffer = [];

        this.isStatisticLogUsing = false;
    }

    public async pushConsoleLog(log: Task.Log) {
        this.consoleBuffer.push(log);
    }

    private async consoleBufferFlush() {
        try {
            // console.log('[System] flushing console buffer: ' + this.consoleBuffer.length);
            // 검사구문 없으면 더 빠를텐데.
            // TODO: 임시로 콘솔 제거.
            // this.consoleBuffer.map(log => {
            //     if(log.data === null){
            //         console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}]`)
            //     } else if(typeof log.data !=='string' && 'message' in log.data && 'chain' in log.data){
            //         console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}] ` + `[${log.data.chain}] ` + log.data.message)
            //     } else if(typeof log.data !== 'string' && 'message' in log.data){
            //         console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}] ` + log.data.message)
            //     } else {
            //         console.log(`[${log.domain}:${log.task}:${log.taskType}][${log.level}] ` + log.data)
            //     }
            // });
            this.consoleBuffer = [];
        } catch (e) {
            console.error('Error during flushing console logs: ', e)
        }
    }

    public getStatisticLogFilename(): string {
        return this.getLogFilename('logs/log-statistic');
    }

    // 현재 날짜를 기반으로 로그 파일명 동적 생성
    private getLogFilename(basePath: string): string {
        const date = new Date().toISOString().slice(0, 10); // 형식: YYYY-MM-DD
        return `${basePath}-${date}.json`; // 필요에 따라 형식 조정
    }

    // 파일 쓰기를 처리하는 메소드
    private flushBufferToFile(buffer: Task.Log[] | Task.StatisticLog[], filename: string) {
        try {
            const data = buffer.map(log => JSON.stringify(log)).join('\n');
            fs.appendFileSync(filename, data + '\n');
            console.log(`[System] ${buffer.length}개 항목을 ${filename}에 플러시함`);
        } catch (e) {
            console.error('[System] 로그 플러시 중 오류 발생: ', e);
        }
    }
}
