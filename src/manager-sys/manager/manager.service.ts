import { Injectable } from "@nestjs/common";
import { ManagerGateway } from "./manager.gateway";
import { ManagerQueue } from "./manager.queue";

@Injectable()
export class ManagerService {
    constructor(
        private readonly queue: ManagerQueue,
        private readonly wsGateway: ManagerGateway,
    ) {}
}