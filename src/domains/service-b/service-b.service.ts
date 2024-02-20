import { ClsService, UseCls } from 'nestjs-cls';

import { BaseService } from 'src/manager-sys/types/baseService';
import { Cron } from '@nestjs/schedule';
import { Helper } from 'src/manager-sys/util/helper';
import { Injectable } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { delay } from 'src/manager-sys/util/delay';

const chains = ['Chain_33',
'Chain_25',
'Chain_23',
'Cosmos',
'NEO',
'Chain_59',
'Solana',
'Chain_10',
'Chain_43',
'Chain_1',
'Chain_42',
'Chain_35',
'Chain_69',
'Chain_19',
'Chain_52',
'Chain_39',
'Chain_36',
'Chain_56',
'Chain_37',
'Chain_63',
'Chain_71',
'NEM',
'Chain_62',
'Dash',
'Chain_49',
'Litecoin',
'Chain_24',
'Chain_13',
'Chain_50',
'Chain_57']

@Injectable()
export class ServiceBService extends BaseService {
    constructor(
        protected readonly managerService: ManagerService,
        protected readonly cls: ClsService
    ) {
        super()
    }

    @Cron('0 */3 * * * *')
    @UseCls(Helper.clsBuilder('ServiceB', 'processRT'))
    @Helper.AutoTaskManage
    public async processRT(context?: string) {
        await Promise.all(chains.map(async (chain) => {
            const chainMarketData = await this.doSomethingB(chain);
            return chainMarketData
        }))
    }

    private async doSomethingB(chain: string) {
        await delay(0.03, 0.05);
        if (Math.random() < 1 / 20) {
            await this.warn(`[MARKET] not available`, chain)
            return { chainName: chain, price: null };
        } else {
            return { chainName: chain, price: Math.floor(Math.random() * 100) + 1 };
        }
    }
}
