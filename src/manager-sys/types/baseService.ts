import { ClsService } from "nestjs-cls";
import { ManagerService } from "../manager/manager.service";
import { Task } from "./task";

export abstract class BaseService {
    protected abstract cls: ClsService;
    protected abstract managerService: ManagerService;
  
    protected log(msg: any) {
      const context = this.cls.get('context');
      this.managerService.logTask(context, msg, Task.LogLevel.INFO);
    }

    protected warn(msg: any) {
        const context = this.cls.get('context');
        this.managerService.logTask(context, msg, Task.LogLevel.WARN);
    }

    protected error(msg: any) {
        const context = this.cls.get('context');
        this.managerService.logTask(context, msg, Task.LogLevel.ERROR);
    }
  }