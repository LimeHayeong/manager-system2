import * as _ from 'lodash';

import { ClsService, UseCls } from 'nestjs-cls';

import { BaseService } from 'src/manager-sys/types/baseService';
import { Cron } from '@nestjs/schedule';
import { Helper } from 'src/manager-sys/util/helper';
import { Injectable } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { delay } from 'src/manager-sys/util/delay';

@Injectable()
export class DomainDFirstService extends BaseService {
    constructor(
        protected readonly manager: ManagerService,
        protected readonly cls: ClsService
    ) {
        super()
    }

    @Cron('0 */5 * * * *')
    @UseCls(Helper.clsBuilder('domain.d', 'service', 'processRT'))
    @Helper.AutoTaskManage
    public async processRT(context?: string) {
        const chains = Array.from({ length: 5000 }, (_, i) => `Chain_${i + 1}`);

        for (const chainChunk of _.chunk(chains, 50)) {
            await new Promise(resolve => setImmediate(resolve));

            const chunkResults = await Promise.all(
              chainChunk.map(async (chain: string) => {
                try {
                  const chainInfo = await this.doSomethingD2(chain);
                  if (chainInfo) {
                    await this.doSomethingD(chainInfo);
                  }
                  return chainInfo;
                } catch (e) {
                  return null;
                }
              }),
            );
        }
    }

    private async doSomethingD(chainInfo: any) {
        try {
            await delay(0.01, 0.015)
            await this.log(`okay`, chainInfo.chainName);
        } catch (e) {
            await this.error(e);
        }
    }

    private async doSomethingD2(chain: string) {
        try {
            const randomNumber = Math.random()
            if (randomNumber < 1 / 100) {
                await delay(0.02, 0.025)
                await this.warn(`not available`, chain);
                return { chainName: chain, price: null };
            } else if(1 / 100 <= randomNumber && randomNumber <= 3 / 200) {
                await delay(0.05, 0.07)
                throw new Error(`error occured`);
            }{
                return { chainName: chain, price: Math.floor(Math.random() * 100) + 1 };
            }
        } catch (e) {
            await this.error(e, chain);
        }
    }
}