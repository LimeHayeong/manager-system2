import { ClsService, UseCls } from 'nestjs-cls';
import { Injectable, UseInterceptors } from '@nestjs/common';

import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { Helper } from 'src/manager-sys/util/helper';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { ServiceAService } from '../service-a/service-a.service';
import { ServiceBService } from '../service-b/service-b.service';
import { ServiceDService } from '../service-d/service-d.service';
import { WorkStartRequestDTO } from 'src/manager-sys/common-dto/work-control.dto';

@Injectable()
export class SampleWorkService {
    constructor(
        private cls: ClsService,
        private managerService: ManagerService,
        private serviceA: ServiceAService,
        private serviceB: ServiceBService,
        private serviceD: ServiceDService,
    ) {
        // for test
       // this.triggerWork();
    }

    @UseCls(Helper.clsWorkBuilder())
    @Helper.AutoWorkManage
    public async triggerWork(data?: WorkStartRequestDTO): Promise<void> {
        await this.serviceA.processRT('WORK');
        await this.serviceB.processRT('WORK');
        await this.serviceD.processRT('WORK');
    }
}
