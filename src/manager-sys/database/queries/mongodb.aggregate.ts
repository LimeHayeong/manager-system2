export function timeStatAggregationPipeline(firstId, lastId) {
  return [
    { $match: { _id: { $gte: firstId, $lte: lastId } } },
            {
                $addFields: {
                    normalizedTimestamp: {
                      $subtract: [
                        "$timestamp",
                        {
                          $mod: [
                            "$timestamp",
                            60 * 1000, // 1분
                          ],
                        },
                      ],
                    },
                  },
                },
          {
            $group: {
              _id: {
                taskId: "$taskId",
                timestamp: "$normalizedTimestamp",
              },
              INFO: {
                $sum: {
                  $cond: [
                    { $eq: ["$level", "INFO"] },
                    1,
                    0,
                  ],
                },
              },
              WARN: {
                $sum: {
                  $cond: [
                    { $eq: ["$level", "WARN"] },
                    1,
                    0,
                  ],
                },
              },
              ERROR: {
                $sum: {
                  $cond: [
                    { $eq: ["$level", "ERROR"] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        {
            $project: {
              _id: 0, // _id 필드 제거
              taskId: "$_id.taskId", // _id를 taskId로 매핑
              timestamp: "$_id.timestamp", // _id를 timestamp로 매핑
              data: {
                info: "$INFO",
                warn: "$WARN",
                error: "$ERROR",
              }
            },
          
        }]
}

export function exeStatAggregationPipeline(firstId, lastId) { 
  return [{ $match: { _id: { $gte: firstId, $lte: lastId } } },
    {
        $group: {
          _id: "$contextId",
          taskId: { $addToSet: "$taskId" },
          INFO: { $sum: { $cond: [{ $eq: ["$level", "INFO"] }, 1, 0] } },
          WARN: { $sum: { $cond: [{ $eq: ["$level", "WARN"] }, 1, 0] } },
          ERROR: { $sum: { $cond: [{ $eq: ["$level", "ERROR"] }, 1, 0] } },
          startAt: { $min: "$timestamp" },
          endAt: { $max: "$timestamp" }
        },
    },
        {
            $project: {
                _id: 0, // _id 필드 제거
                contextId: "$_id", // _id를 contextId로 매핑
                taskId: 1,
                data: {
                    info: "$INFO",
                    warn: "$WARN",
                    error: "$ERROR",
                },
                startAt: 1,
                endAt: 1
        }
      }
]}