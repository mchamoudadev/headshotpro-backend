import { Response } from "express";

// Standard response object

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}


// success response

export const successResponse = <T>( res: Response, message: string,data?: T,  statusCode: number = 200, meta?:ApiResponse['meta']) : Response=> {

    const response: ApiResponse<T> = {
        success: true,
        message,
        ...(data !== undefined && { data}),
        ...(meta !== undefined && { meta}),
    }

    // if(data !== undefined){
    //     response.data = data;
    // }

    // if(meta !== undefined){
    //     response.meta = meta;
    // }


    return res.status(statusCode).json(response);


}


// error response

export const errorResponse = (res: Response, message: string,statusCode:number=500, errors?:Record<string, string>[]) : Response=> {

    const response: ApiResponse = {
        success: false,
        message,
        ...(errors !== undefined && { errors}),
    }

    return res.status(statusCode).json(response);
}


/**
 * Send a created response (201)
 */
export const createdResponse = <T>(
    res: Response,
    message: string,
    data?: T
  ): Response => {
    return successResponse(res, message, data, 201);
  };
  

  export const noContentResponse = (res: Response): Response => {
    return res.status(204).send();
  };



/**
 * Send a paginated response
 */
export const paginatedResponse = <T>(
    res: Response,
    message: string,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    }
  ): Response => {

    // 200 total / 10 limit = 20 pages

    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return successResponse(res, message, data, 200, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
    });
  };