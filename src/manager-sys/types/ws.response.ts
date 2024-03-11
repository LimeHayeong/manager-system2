export interface WebSocketResponse {
    code: number | null
    responseId: string
    payload: {
        message: string | null
        data?: any | null
    }
  }
  
  export interface WebSocketError {
    code: number | null
    responseId: string;
    payload: {
        message: string | null
        error?: string | string[] | null
    }
  }
  