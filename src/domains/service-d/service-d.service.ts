import * as _ from 'lodash';

import { ClsService, UseCls } from 'nestjs-cls';

import { BaseService } from 'src/manager-sys/types/baseService';
import { Helper } from 'src/manager-sys/util/helper';
import { Injectable } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { delay } from 'src/manager-sys/util/delay';

@Injectable()
export class ServiceDService extends BaseService {
    constructor(
        protected readonly managerService: ManagerService,
        protected readonly cls: ClsService
    ) {
        super()
    }

    @UseCls(Helper.clsBuilder('ServiceD', 'processRT'))
    @Helper.AutoManage
    private async processRT() {
        // 10,000개의 항목을 생성 (예시)
        const chains = Array.from({ length: 10000 }, (_, i) => `Chain_${i + 1}`);

        // 단일 Promise.all은 부하가 심함.
        for (const chainChunk of _.chunk(chains, 50)) {
            // 이벤트 루프의 다음 틱에 예약..?
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

    
    public async doSomethingD(chainInfo: any) {
        try {
            await delay(0.01, 0.015)
            this.log(`[${chainInfo.chainName}] okay`);
        } catch (e) {
            this.error(e);
        }
    }

    private async doSomethingD2(chain: string) {
        try {
            const randomNumber = Math.random()
            if (randomNumber < 1 / 100) {
                // 1% 확률로 warn 발생
                await delay(0.02, 0.025)
                this.warn(`[${chain}] is not available`);
                return { chainName: chain, price: null };
            } else if(1 / 100 <= randomNumber && randomNumber <= 3 / 200) {
                // 0.5% 확률로 에러 발생
                await delay(0.05, 0.07)
                throw new Error(`[${chain}] error occured`);
            }{
                return { chainName: chain, price: Math.floor(Math.random() * 100) + 1 };
            }
        } catch(e) {
            this.error(e)
        }

    }

}
