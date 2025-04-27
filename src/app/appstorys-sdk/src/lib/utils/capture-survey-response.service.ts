import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { StorageService } from './storage.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class CaptureSurveyResponseService {
  private apiUrl = 'https://backend.appstorys.com/api/v1/campaigns/capture-survey-response/';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandler: ErrorHandlerService
  ) {}

  async captureSurveyResponse(
    surveyId: string,
    userId: string,
    responseOptions: string[],
    comment?: string
  ): Promise<void> {
    try {
      const accessToken = this.storageService.getItem('access_token');

      if (!accessToken) {
        console.error('Error in captureSurveyResponse. Access token not found');
        return;
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      });

      const body: any = {
        user_id: userId,
        survey: surveyId,
        responseOptions: responseOptions
      };

      if (comment) {
        body.comment = comment;
      }

      const response = await this.http.post<any>(
        this.apiUrl,
        body,
        { headers }
      ).pipe(
        catchError((error: HttpErrorResponse) => {
          const apiError = this.errorHandler.handleError(error);
          console.error('Error in captureSurveyResponse:', apiError);
          return throwError(() => apiError);
        })
      ).toPromise();

      if (response?.status !== 'success') {
        console.error('Error in captureSurveyResponse. Something went wrong', response);
        return;
      }

      console.log('Survey response captured successfully');
    } catch (error) {
      console.error('Error in captureSurveyResponse:', error);
      throw error;
    }
  }
}
