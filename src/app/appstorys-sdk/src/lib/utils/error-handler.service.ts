import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../interfaces/api-error.interface';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  handleError(error: HttpErrorResponse): ApiError {
    let errorMessage = 'An unknown error occurred';
    let status = 500;

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      status = error.status;
      errorMessage = error.error?.message || error.message;
    }

    return {
      status,
      message: errorMessage,
      details: error.error
    };
  }
}