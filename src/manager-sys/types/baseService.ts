import { ClsService } from "nestjs-cls";
import { ManagerService } from "../manager/manager.service";

export abstract class BaseService {
    protected abstract cls: ClsService;
    protected abstract managerService: ManagerService;
  
    protected log(msg: any) {
      const context = this.cls.get('context');
      // this.managerService.log(context, msg);
    }

    protected error(msg: any) {
        const context = this.cls.get('context');
        // this.managerService.log(context, msg);
    }

    protected warn(msg: any) {
        const context = this.cls.get('context');
        // this.managerService.log(context, msg);
    }
  }