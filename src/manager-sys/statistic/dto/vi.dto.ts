export interface ViExeRequestDTO {
    domain: string;
    task: string;
    taskType: string;
    pointNumber: number;
    pointSize: number;
}

export interface ViTimeRequestDTO {
    domain: string;
    task: string;
    taskType: string;
    pointNumber: number;
    unitTime:  '30m' | '1h' | '4h' | '6h' |  '12h' | '24h';
}

export interface ViExeResultDTO {
    domain: string;
    task: string;
    taskType: string;
    pointNumber: number;
    pointSize: number;
    data: any;
}

export interface ViExeData {
    domain: string;
    task: string;
    taskType: string;
    
}