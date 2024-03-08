import { Inject, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { ILogDoc } from "../database/interface/log.interface";

@Injectable()
export class ManagerQueue {
    constructor(
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
    ) {}
}