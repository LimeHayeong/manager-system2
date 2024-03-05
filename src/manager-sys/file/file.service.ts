import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import { File } from "../types/file";
import { Injectable } from "@nestjs/common";
import { LogEntry } from '../manager/dto/task-statistic.dto';
import { Task } from 'test/test-grid';

const logDirName = 'logs'
const newLogDir = 'logs2'
const logStatisticFileName = 'log-statistic.json'
const fileLockWaitingTime = 1 * 500 // 0.5 sec
const maxStatisticLogFile = 1024 * 1024 // 1MB

@Injectable()
export class FileService {
    private logDirName: string;
    private statisticLogFileName: string;
    private using: File.Lock;

    constructor() {
        this.initialization();
        console.log('[System] FileService initialized')
    }

    private initialization() {
        this.logDirName = logDirName;
        this.statisticLogFileName = logStatisticFileName;
        this.using = new File.Lock();

        // 일단 기본인 statistic 파일만 세팅.
        this.using["statistic"] = false;

        this.transferOldLogfiles();
    }

    public getFileUsing(fileName: string){
        return this.using[fileName];
    }

    public lockFile(fileName: string){
        return this.using[fileName] = true;
    }

    public freeFile(fileName: string){
        return this.using[fileName] = false;
    }
    
    public getStatisticLogFileName(): string{
        return this.statisticLogFileName
    }

    public async getFilePathIfLockWaitingWhenWrite(fileName: string): Promise<string>{
        // 해당 Key 없으면 Undefined return.
        if(this.using[fileName]) return undefined;

        await this.checkLockWaiting(fileName);
        
        return path.join(this.logDirName, fileName);
    }

    public getFilePath(fileName: string): string {
        return this.filePathJoin(fileName);
    }

    public getReadLineByFileName(fileName: string): readline.Interface{
        const filePath = this.filePathJoin(fileName);

        // filePath 없으면 undefined 반환.
        if(!filePath) return undefined;

        const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8'});
        return readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })
    }

    public async getStatisticLogsToJson(): Promise<Task.StatisticLog[]>{
        try {
            await this.checkLockWaiting(this.statisticLogFileName);
            const filePath = this.filePathJoin(this.statisticLogFileName)
            const statisticLogFile = fs.readFileSync(filePath, {encoding: 'utf-8'})
            // JSON 배열로 변환.
            const logs = statisticLogFile.trim()
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => JSON.parse(line));
            return logs
        } catch (e){
            console.error(e);
        }
    }

    public appendFileSync(filepath: string, data: any) {
        fs.appendFileSync(filepath, data + '\n');
    }

    public async truncateFile(filePath: string) {
        try {
            // 파일 크기 확인
            let stats = fs.statSync(filePath);
            let fileSizeInBytes = stats.size;
            const targetSizeInBytes = maxStatisticLogFile; // 1MB in bytes
    
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
    }

    public deleteOldFiles(fileName: string, date: Date) {
        const datePattern = /log-(\d{4}-\d{2}-\d{2}-\d{2})\.json$/; // 정규 표현식으로 날짜 형식 매칭
            const match = fileName.match(datePattern);
            if (match) {
                const fileDate = match[1]; // 첫 번째 캡처 그룹 (날짜)
                const fileDateObject = new Date(fileDate);

                if (fileDateObject < date) {
                    // 파일 날짜 주어진 값 이전이면 삭제
                    const filePath = this.filePathJoin(fileName);
                    fs.unlinkSync(filePath);
                    console.log(`[System] Deleted old log file: ${fileName}`);
                }
            }
    }

    public getFileList(dir: string){
        return fs.readdirSync(dir);
    }

    private filePathJoin(fileName: string): string {
        const filePath = path.join(this.logDirName, fileName);
        if(!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, ''); // 빈 파일 생성
        }
        return filePath;
    }

    private async checkLockWaiting(fileName: string){
        // file이 Lock되어있으면 잠깐 waiting.
        while(this.using[fileName]){
            await new Promise(resolve => setTimeout(resolve, fileLockWaitingTime))
        }
        this.using[fileName] = true;
    }

    // 옛날 로그들 새 로그 파일로 변환하는 용도
    private async transferOldLogfiles() {
        const logFiles = [
            'log-2024-02-26.json',
            'log-2024-02-27.json',
            'log-2024-02-28.json',
            'log-2024-02-29.json',
            'log-2024-03-01.json',
            'log-2024-03-02.json',
            'log-2024-03-03.json',
            'log-2024-03-04.json',
            'log-2024-03-05.json'
        ]

        for (const logFile of logFiles) {
            const filePath = this.filePathJoin(logFile)
            const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
            const logs = fileContent.split('\n').filter(line => line.trim()).map(line => JSON.parse(line) as LogEntry);
    
            const logsByHour: { [key: string]: LogEntry[] } = {};
    
            for (const log of logs) {
                const date = new Date(log.timestamp);
                const dateHourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
                
                if (!logsByHour[dateHourKey]) {
                    logsByHour[dateHourKey] = [];
                }
    
                logsByHour[dateHourKey].push(log);
            }
    
            for (const [dateHourKey, logs] of Object.entries(logsByHour)) {
                const outputFilePath = path.join(newLogDir, `log-${dateHourKey}.json`)
                await fs.promises.writeFile(outputFilePath, logs.map(log => JSON.stringify(log)).join('\n'), { encoding: 'utf-8' });
            }
        }
    }
}