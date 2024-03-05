import { Cron } from '@nestjs/schedule';
import { FileService } from '../file/file.service';
import { Injectable } from '@nestjs/common';
import { Task } from '../types/task';

// TODO: CONFIG화
const fileInterval = 1000 * 5; // 5초
const consoleInterval = 1000 * 100; // 1초
// 실제로는 5분 정도로 해도 괜찮다. 1000 * 60 * 5
const statisticInterval = 1000 * 1;
const bufferSize = 500;

@Injectable()
export class LoggerService {
    private fileBuffer: Task.Log[] = [];
    private consoleBuffer: Task.Log[] = [];
    private statisticBuffer: Task.StatisticLog[] = [];
    private maxBufferSize: number;
    private fileInterval: number;
    private consoleInterval: number;
    private statisticInterval: number;

    constructor(
        private readonly fileService: FileService
    ) {
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
        // this.maxBufferSize = bufferSize;
        setInterval(() => this.fileBuffer.length > 0 && this.fileBufferFlush(), this.fileInterval);
        setInterval(() => this.consoleBuffer.length > 0 && this.consoleBufferFlush(), this.consoleInterval);
        setInterval(() => this.statisticBuffer.length > 0 && this.statisticBufferFlush(), this.statisticInterval)
    }

    // 현재 날짜로부터 8일 이전 로그 삭제
    @Cron('21 37 1 * * *')
    private deleteOldLogs() {
        // Log 디렉토리에 파일 목록 반환
        const files = this.fileService.getFileList(
            this.fileService.getStatisticLogFileName()
        )
        
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 8); // 8일 이전 날짜 계산

        files.forEach(file => {
            this.fileService.deleteOldFiles(file, currentDate)
            this.fileService.getFilePath(file);
        });
    }

    // log statistic 파일 정리, 1MB 이상이면 삭제. 하루에 1번 실행.
    // 시간이 좀 걸림.
    @Cron('23 38 1 * * *')
    private async truncateLogStatisticFile() {
        const filePath = await this.fileService.getFilePathIfLockWaitingWhenWrite(
            this.fileService.getStatisticLogFileName())

        await this.fileService.truncateFile(filePath);
        
        // fileLock 해제
        this.fileService.freeFile(
            this.fileService.getStatisticLogFileName())
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
         const filepath = this.fileService.getFilePath(this.getLogFilename());
         this.flushBufferToFile(this.fileBuffer, filepath);
         this.fileBuffer = [];
    }

    public async pushStatisticLog(log: Task.StatisticLog) {
        this.statisticBuffer.push(log);
    }

    private async statisticBufferFlush() {
        // statistic log file 사용 중이면 대기
        const filePath = await this.fileService.getFilePathIfLockWaitingWhenWrite(
            this.fileService.getStatisticLogFileName()
        )

        this.flushBufferToFile(this.statisticBuffer, filePath);
        this.statisticBuffer = [];

        // Lock 사용 해제
        this.fileService.freeFile(this.fileService.getStatisticLogFileName())
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

    // 현재 날짜를 기반으로 로그 파일명 동적 생성
    // TODO: 현재날짜가 아니라 로그 timestamp 기준으로 해야함.
    private getLogFilename(): string {
        const now = new Date();
        const date = now.toISOString().slice(0, 10); // 형식: YYYY-MM-DD
        const hour = now.getHours().toString().padStart(2, '0'); // 24시간 형식, 두 자리로 표현
    
        return `log-${date}-${hour}.json`; // 필요에 따라 형식 조정
    }

    // 파일 쓰기를 처리하는 메소드
    private flushBufferToFile(buffer: Task.Log[] | Task.StatisticLog[], filepath: string) {
        try {
            const data = buffer.map(log => JSON.stringify(log)).join('\n');
            this.fileService.appendFileSync(filepath, data)
            console.log(`[System] ${buffer.length}개 항목을 ${filepath}에 플러시함`);
        } catch (e) {
            console.error('[System] 로그 플러시 중 오류 발생: ', e);
        }
    }
}
