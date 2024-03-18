export function timeStatAggregationPipeline(firstId, lastId): any[] {
  return [
    { $match: { _id: { $gte: firstId, $lte: lastId } } },
    { $sort: { timestamp: 1}},
            {
                $addFields: {
                    normalizedTimestamp: {
                      $subtract: [
                        "$timestamp",
                        {
                          $mod: [
                            "$timestamp",
                            30 * 60 * 1000, // 30분
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

export function exeStatAggregationPipeline(firstId, lastId): any[] { 
  return [{ $match: { _id: { $gte: firstId, $lte: lastId } } },
    { $sort: { timestamp: 1 } },
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

export function viExeAggregationPipeline(conditions: object, pointSize: number, i: number): any[] {
  return [
    { $match: conditions },
    { $sort: { startAt: 1 } },
    { $skip: pointSize * i },
    { $limit: pointSize },
    {
        $group: {
            _id: null,
            from: { $min: "$startAt" },
            to: { $max: "$endAt" },
            info: { $sum: "$data.info" },
            warn: { $sum: "$data.warn" },
            error: { $sum: "$data.error" }
        }
    },
    {
        $project: {
            _id: 0,
            from: 1,
            to: 1,
            info: 1,
            warn: 1,
            error: 1
        }
    }
  ]
}

export function viTimeAggregationPipeline(conditions: object, unitTime: string, i: number): any[] {
  const pointSize = getPointSizefromUnitTime(unitTime);

  return [
    { $match: conditions },
    { $sort: { timestamp: 1 }},
    { $skip: pointSize * i },
    { $limit: pointSize },
    {
      $group: {
        _id: null,
        from: { $min: "$timestamp" },
        to: { $max: "$timestamp" },
        info: { $sum: "$data.info" },
        warn: { $sum: "$data.warn" },
        error: { $sum: "$data.error" }
      }
    },
    {
      $addFields: {
        to: { $add: ["$to", 30 * 60 * 1000] }
      }
    },
    {
      $project: {
          _id: 0,
          from: 1,
          to: 1,
          info: 1,
          warn: 1,
          error: 1
      }
    }
  ]
}

function getPointSizefromUnitTime(timeStr: string): number {
  // 시간을 분으로 변환
  let timeInMinutes: number = 0;
  if (timeStr.includes('h')) {
      timeInMinutes = parseInt(timeStr.replace('h', '')) * 60;
  } else if (timeStr.includes('m')) {
      timeInMinutes = parseInt(timeStr.replace('m', ''));
  }

  // 30분 단위로 나눈 몫 계산
  const quotient: number = Math.floor(timeInMinutes / 30);
  return quotient;
}