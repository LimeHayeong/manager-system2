export interface ApiResponse {
    success: boolean
    statusCode: number | null
    message: string | null
    data?: any | null
  }
  
  export interface ApiError {
    success: boolean
    statusCode?: number | null
    message: string | null
    error?: string | string[] | null
  }
  