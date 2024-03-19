export interface ViExeRequestbyTaskIdDTO extends taskId, ViExeOptions {
}

export interface ViTimeRequestbyTaskIdDTO extends taskId, ViTimeOptions {
}

export interface ViExeResponsebyTaskIdDTO extends taskId, ViExeOptions {
    data: pointData[];
}

export interface ViTimeResponsebyTaskIdDTO extends taskId, ViTimeOptions {
    data: pointData[];
}

export interface ViExeOptions {
    pointNumber?: number;
    pointSize?: 10 | 30 | 50;
}

export interface ViTimeOptions {
    pointNumber?: number;
    unitTime?: '30m' | '1h' | '4h' | '6h' |  '12h' | '24h';
}

export interface taskId {
    domain: string;
    service?: string;
    task?: string[] | string;
}

export interface pointData {
    from: number;
    to: number;
    info: number;
    warn: number;
    error: number;
}