import { File } from "../types/file";
import { Injectable } from "@nestjs/common";

const logDirName = 'logs'
const logStatisticFileName = 'log-statistic'

@Injectable()
export class FileService {
    private logDirName: string;
    private logStatisticFileName: string;
    private lock: File.Lock;

    constructor() {
        this.initialization();
    }

    private initialization() {
        this.logDirName = logDirName;
        this.logStatisticFileName = logStatisticFileName;
    }
}