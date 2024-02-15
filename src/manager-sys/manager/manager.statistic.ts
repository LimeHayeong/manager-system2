import { Injectable } from "@nestjs/common";
import { LoggerService } from "../logger/logger.service";

@Injectable()
export class ManagerStatistic {
    constructor(
        private readonly logger: LoggerService,
    ) {}
}