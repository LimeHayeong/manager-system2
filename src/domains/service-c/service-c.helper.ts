import { ClsService, UseCls } from 'nestjs-cls';

import { BaseService } from 'src/manager-sys/types/baseService';
import { Helper } from 'src/manager-sys/util/helper';
import { Injectable } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { delay } from 'src/manager-sys/util/delay';

@Injectable()
export class ServiceCHelper extends BaseService {
    constructor(
        protected readonly managerService: ManagerService,
        protected readonly cls: ClsService
    ) {
        super()
    }

    @UseCls(Helper.clsBuilder('ServiceC', 'processHelper'))
    @Helper.AutoManage
    public async processHelper() {
        await this.helpSomething();
    }

    private async helpSomething() {
        await delay(10,20);
        await this.log('25% done')
        await delay(10,20);
        await this.log('50% done')
        await delay(10,20);
        await this.log('75% done')
        await delay(10,20);
    }
}
