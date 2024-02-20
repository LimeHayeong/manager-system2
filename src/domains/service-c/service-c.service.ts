import { ClsService, UseCls } from 'nestjs-cls';

import { BaseService } from 'src/manager-sys/types/baseService';
import { Helper } from 'src/manager-sys/util/helper';
import { Injectable } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { delay } from 'src/manager-sys/util/delay';

@Injectable()
export class ServiceCService extends BaseService {
    constructor(
        protected readonly managerService: ManagerService,
        protected readonly cls: ClsService
    ) {
        super()
    }

    @UseCls(Helper.clsBuilder('ServiceC', 'processRT'))
    @Helper.AutoTaskManage
    public async processRT(context?: string) {
        await delay(5, 40);
    }
}
