import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';

@Injectable()
export class WsService {
    constructor(
        @Inject(forwardRef(() => ManagerService))
        private readonly managerService: ManagerService
    ) {}
}
