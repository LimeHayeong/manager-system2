export interface ApiResponse {
    code: number
    payload: {
        message: string | null
        data: any | null
    }
  }
  
  export interface ApiError {
    code: number
    payload: {
        message: string | null
        error: string | string[] | null
    }
  }
  