import { DatabaseModule } from '../database/database.module';
import { LogModule } from '../log/log.module';
import { ManagerGateway } from './manager.gateway';
import { ManagerQueue } from "./manager.queue";
import { ManagerService } from "./manager.service";
import { Module } from "@nestjs/common";
import { managersProviders } from './manager.providers';

@Module({
    imports: [DatabaseModule, LogModule],
    providers: [ManagerService, ManagerGateway, ManagerQueue,
    ...managersProviders],
    exports: [ManagerService]
})
export class ManagerModule {}