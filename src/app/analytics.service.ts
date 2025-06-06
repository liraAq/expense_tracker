import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export interface PredictionDto {
  predictedExpenses: { [category: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = 'http://localhost:8082/analytics';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Метод для завантаження звіту
  uploadReport(formData: FormData): Observable<string> {
    const token = localStorage.getItem('jwt'); // Отримуємо токен користувача

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      // No need to specify Content-Type for multipart/form-data
    });

    return this.http.post<string>(this.baseUrl, formData, { headers }).pipe(
      catchError((error) => {
        console.error('Error uploading report:', error);
        return throwError(error); // Обробка помилок
      })
    );
  }

  getSummary(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(
      `${this.baseUrl}/summary`,
      { headers: this.getAuthHeaders() }
    );
  }

  getExpensesByCategory(): Observable<{ [category: string]: number }> {
    return this.http.get<{ [category: string]: number }>(
      `${this.baseUrl}/expenses/by-category`,
      { headers: this.getAuthHeaders() }
    );
  }

  getIncomeByCategory(): Observable<{ [category: string]: number }> {
    return this.http.get<{ [category: string]: number }>(
        `${this.baseUrl}/income-by-category`,
        { headers: this.getAuthHeaders() }
    );
  }

  getPredictedExpenses(): Observable<PredictionDto> {
    return this.http.get<PredictionDto>(
      `${this.baseUrl}/predict-expenses`,
      { headers: this.getAuthHeaders() }
    );
  }
}
