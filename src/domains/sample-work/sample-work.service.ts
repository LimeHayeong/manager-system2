import { ClsService, UseCls } from 'nestjs-cls';
import { Injectable, UseInterceptors } from '@nestjs/common';

import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { Helper } from 'src/manager-sys/util/helper';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { ServiceAService } from '../service-a/service-a.service';
import { ServiceBService } from '../service-b/service-b.service';
import { ServiceDService } from '../service-d/service-d.service';
import { Task } from 'src/manager-sys/types/task';
import { WorkStartRequestDTO } from 'src/manager-sys/common-dto/work-control.dto';
import { delay } from 'src/manager-sys/util/delay';

@UseInterceptors(CustomInterceptor)
@Injectable()
export class SampleWorkService {
    constructor(
        private cls: ClsService,
        private manager: ManagerService,
        private serviceA: ServiceAService,
        private serviceB: ServiceBService,
        private serviceD: ServiceDService,
    ) {
        this.initialization()
    }
    async initialization() {
        await this.tirggerWork({ work: 'sampleWork', workType: Task.TaskType.TRIGGER })
    }

    @UseCls(Helper.clsBuilderWork())
    async tirggerWork(data?: WorkStartRequestDTO): Promise<void> {
        if(!await this.manager.buildWork(data)){
            // TODO: build work 실패하면 조치.
            return;
        }
        await this.manager.startWork(data, this.cls.get('workId'))
        await this.serviceA.processRT('WORK');
        await this.serviceB.processRT('WORK');
        await this.serviceD.processRT('WORK');
        await this.manager.endWork(data)
    }
}
