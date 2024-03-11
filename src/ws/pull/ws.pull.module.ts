import { LogModule } from "src/manager-sys/log/log.module";
import { ManagerModule } from "src/manager-sys/manager/manager.module";
import { Module } from "@nestjs/common";
import { WsPullGateway } from "./ws.pull.gateway";

@Module({
    imports: [ManagerModule, LogModule],
    providers: [WsPullGateway],
})
export class WsPullModule {}