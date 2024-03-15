import { ClsService, UseCls } from 'nestjs-cls';

import { BaseService } from 'src/manager-sys/types/baseService';
import { Cron } from '@nestjs/schedule';
import { Helper } from 'src/manager-sys/util/helper';
import { Injectable } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { delay } from 'src/manager-sys/util/delay';

@Injectable()
export class DomainCFirstService extends BaseService {
    constructor(
        protected readonly manager: ManagerService,
        protected readonly cls: ClsService
    ) {
        super()
    }

    @Cron('0 * */1 * * *')
    @UseCls(Helper.clsBuilder('DomainC', 'FirstService', 'processRT'))
    @Helper.AutoTaskManage
    public async processRT(context?: string) {
        await delay(5, 40);
    }
}