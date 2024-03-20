import { Module } from "@nestjs/common";
import { WsPushGateway } from "./ws.push.gateway";

@Module({
    providers: [WsPushGateway],
    exports: [WsPushGateway]
})
export class WsPushModule {}