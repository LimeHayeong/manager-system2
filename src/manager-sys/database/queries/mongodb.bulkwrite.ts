export function exeStatisticOps(docs: any[]) {
    return docs.map((doc) => ({
      updateOne: {
          filter: { contextId: doc.contextId },
          update: {
              $addToSet: { taskId: { $each: doc.taskId } }, // 여러 taskId를 추가할 경우
              $min: { startAt: doc.startAt },
              $max: { endAt: doc.endAt },
              $inc: {
                  "data.info": doc.data.info || 0,
                  "data.warn": doc.data.warn || 0,
                  "data.error": doc.data.error || 0
              },
              setOnInsert: {

              }
          },
          upsert: true
      }
  }));
}

export function timeStatisticOps(docs: any[]) {
  return docs.map((doc) => ({
    updateOne: {
        filter: { taskId: doc.taskId, timestamp: doc.timestamp },
        update: {
        $inc: {
            "data.info": doc.data.info || 0,
            "data.warn": doc.data.warn || 0,
            "data.error": doc.data.error || 0
        },
        $setOnInsert: { otherField: "defaultValue" } // 필요한 경우 다른 필드 설정
        },
        upsert: true
    }
}));
}