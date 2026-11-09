export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
  errors?: string[];
}

