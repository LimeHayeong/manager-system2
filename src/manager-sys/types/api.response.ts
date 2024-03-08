export interface ApiResponse {
    statusCode: number | null
    payload: {
        message: string | null
        data?: any | null
    }
  }
  
  export interface ApiError {
    statusCode: number | null
    payload: {
        message: string | null
        error?: string | string[] | null
    }
  }
  