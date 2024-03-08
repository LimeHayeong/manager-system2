export interface WebSocketResponse {
    statusCode: number | null
    responseId: string
    payload: {
        message: string | null
        data?: any | null
    }
  }
  
  export interface WebSocketError {
    statusCode: number | null
    responseId: string;
    payload: {
        message: string | null
        error?: string | string[] | null
    }
  }
  