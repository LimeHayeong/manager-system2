import { DatabaseModule } from '../database/database.module';
import { ManagerGateway } from './manager.gateway';
import { ManagerQueue } from "./manager.queue";
import { ManagerService } from "./manager.service";
import { Module } from "@nestjs/common";
import { managersProviders } from './manager.providers';

@Module({
    imports: [DatabaseModule],
    providers: [ManagerService, ManagerGateway, ManagerQueue,
    ...managersProviders],
    exports: [ManagerService]
})
export class ManagerModule {}