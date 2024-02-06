export interface WebSocketResponse {
    success: boolean;
    statusCode: number;
    responseId: string;
    payload: object | null;
}

export interface WebSocketError {
    success: boolean;
    statusCode: number;
    responseId: string;
    error: string | Error | null;
}