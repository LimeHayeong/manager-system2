export namespace Stat {
    export interface ExeStatistic {
        taskId: string;
        contextId: string;
        // TODO: data type 지정
        data: any;
        startAt: number;
        endAt: number;
    }

    export interface TimeStatistic {
        timeline: number;
    }

    export interface GRID {
        taskId: string;
        grid: gridData[]
    }

    export interface gridData {
        taskId: string;
        start: number;
        end: number;
        contextIds: string[];
    }

    // TODO
    // data 활용을 해야되나?
    // 이거 chain category까지 있어야 할 듯.
    export interface taskStatistic {
        logCount?: number;
        infoCount?: number;
        warnCount?: number;
        errorCount?: number;
    }
}