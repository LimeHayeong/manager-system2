import { TaskId } from "src/manager-sys/types/taskId";

export namespace QueryBuilder {
    export function taskIdConditionBuilder(domain: string, service: string, task: string | string[]) {
        const conditions = {}
    
        let taskIds;
        if(task instanceof Array && task.length > 0){
            // taskIds가 배열이면 $in, 아니면 그냥 값으로
            if(task.length === 1){
                conditions['taskId'] = TaskId.convertToTaskId(domain, service, task[0]);
            }else{
                taskIds = generateTaskIdCombinations(domain, service, task);
                conditions['taskId'] = { $in: taskIds };
            }
        }else{
            let taskId;
            if(domain && service && task && typeof task === 'string'){
                taskId = TaskId.convertToTaskId(domain, service, task);
            }else if(domain && service){
                taskId = TaskId.convertToTaskId(domain, service, null);
            }else if(domain){
                taskId = TaskId.convertToTaskId(domain, null, null);
            }
            const regex = TaskId.createRegexFromTaskId(taskId);
            conditions['taskId'] = regex;
        }
    
        return conditions;
    }
    
    export function filterOptionsConditionBuilder(condition: object, exeType: string | string[], level: string | string[], chain: string | string[]): object {
        const conditions = condition;
    
        if (exeType) {
            conditions['exeType'] = typeof exeType === 'string' ? exeType : { $in: exeType };
        }
        if (level) {
            conditions['level'] = typeof level === 'string' ? level : { $in: level };
        }
        if (chain) {
            conditions['data.chain'] = typeof chain === 'string' ? chain : { $in: chain };
        }
    
        return conditions;
    }
    
    // 배열일 때만 처리
    function generateTaskIdCombinations(domain: string, service: string, task: string | string[]): string[] {
        const taskIdCombinations = [];
    
        if(typeof task === "string"){
        }else if(task instanceof Array && task.length > 0){
            task.forEach((task) => {
                const taskId = TaskId.convertToTaskId(domain, service, task);
                taskIdCombinations.push(taskId);
            })
        }
    
        return taskIdCombinations;
    }
}
