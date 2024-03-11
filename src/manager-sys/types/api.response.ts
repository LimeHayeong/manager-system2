export interface ApiResponse {
    code: number | null
    payload: {
        message: string | null
        data?: any | null
    }
  }
  
  export interface ApiError {
    code: number | null
    payload: {
        message: string | null
        error?: string | string[] | null
    }
  }
  