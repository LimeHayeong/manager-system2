import { Injectable } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';

@Injectable()
export class ServiceAService {
    constructor(
        private readonly managerService: ManagerService
    ) {

    }
}
