export namespace Task {
    export enum TaskType {
      CRON = 'CRON',
      TRIGGER = 'TRIGGER',
      WORK = 'WORK',
    }
  
    export enum LogLevel {
      INFO = 'INFO',
      WARN = 'WARN',
      ERROR = 'ERROR',
    }
  
    export enum LogTiming {
      START = 'START',
      PROCESS = 'PROCESS',
      END = 'END',
    }
  
    export enum TaskStatus {
      TERMINATED = 'TERMINATED',
      PROGRESS = 'PROGRESS',
      WAITING = 'WAITING',
    }
  
    export interface Log {
      domain: string;
      task: string;
      taskType?: TaskType;
      contextId: { [key: string]: string };
      level: LogLevel;
      logTiming: LogTiming;
      data: IContext | null;
      timestamp: number; // toISOString
    }
  
    export class ErrorObject {
      name: string;
      message: string;
      stack: string;
    }
  
    export interface WorkState {
      // 구별자
      work: string;
      workType: TaskType;
      contextId: string;
      status: TaskStatus;
      updatedAt: number;
      startAt: number;
      endAt: number;
      // 그냥 identifier만 보관하자.
      taskList: ITaskIdentity[];
    }

    // 실행 중 그 순간에 대한 세부 context
    export interface IContext {
      message?: string;
      // functionContext?: any;
      stack?: string[];
    }
  
    // Task 구별자와 실행 context, 최근 log가 담김 >> Manager service 용.
    export interface TaskStatewithLogs extends TaskState, ITaskLogContext {}
    // Task 구별자와 실행 context가 담김.
    export interface TaskState extends ITaskIdentity, ITaskExecutionStatus {}
  
    // Task 구별자.
    // domain: Service domain
    // task: task명
    // taskType: taskType(실행 종류)
    export interface ITaskIdentity {
      domain: string;
      task: string;
      taskType: TaskType;
    }
  
    // Task 실행 context
    // contextId: 실행하는 context id >> 향후 string 대신 더 복잡한 contextId가 주어질 수 있음.
    // status: 현재 task 상태
    // isAvaiable: 현재 task가 실행 가능한지 여부
    // updatedAt: 마지막으로 업데이트된 시간
    // startAt: task 시작 시간(현재 실행 중이거나 마지막 실행 기준)
    // endAt: task 종료 시간(현재 실행 중이거나 마지막 실행 기준)
    export interface ITaskExecutionStatus {
      contextId: string;
      status: TaskStatus;
      isAvailable: boolean;
      updatedAt: number;
      startAt: number;
      endAt: number;
    }
  
    // Task 실행시, log에 관한 Context
    export interface ITaskLogContext {
      recentLogs: Log[][];
    }

    export function toEnumValue<T>(enumObj: T, value: string): T[keyof T] | undefined {
        if (Object.values(enumObj).includes(value)) {
          return value as T[keyof T];
        }
        return undefined;
      }
  }
  