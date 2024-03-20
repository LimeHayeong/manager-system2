export interface WebSocketResponse {
  code: number
  responseId: string
  payload: {
      message: string | null
      data: any | null
  }
}
  
export interface WebSocketError {
  code: number
  responseId: string;
  payload: {
      message: string | null
      error: string | string[] | null
  }
}

export class wsError extends Error{
  constructor(
    message?: string,
    code?: number
  ){
    super(message)
    this.code = code;
  }
  code: number;
}