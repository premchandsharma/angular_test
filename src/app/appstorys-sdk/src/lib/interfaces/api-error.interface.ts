export interface ApiError {
    status: number;
    message: string;
    details?: any;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
  }