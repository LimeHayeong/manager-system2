import { DatabaseModule } from '../database/database.module';
import { LogModule } from '../log/log.module';
import { ManagerQueue } from "./manager.queue";
import { ManagerService } from "./manager.service";
import { Module } from "@nestjs/common";
import { WsPushModule } from 'src/ws/push/ws.push.module';
import { managersProviders } from './manager.providers';

@Module({
    imports: [DatabaseModule, LogModule, WsPushModule],
    providers: [ManagerService, ManagerQueue,
    ...managersProviders],
    exports: [ManagerService]
})
export class ManagerModule {}