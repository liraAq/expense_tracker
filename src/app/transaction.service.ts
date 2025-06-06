import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

// Оголошення інтерфейсу для TransactionDto
// transaction.service.ts
export interface TransactionDto {
  id: number;               // Corresponds to Long in Java
  description: string;
  amount: number;           // Corresponds to Double in Java
  date: string;             // Corresponds to LocalDateTime in Java, but will use a string representation in TypeScript
  type: string;             // Corresponds to TransactionType in Java, but treated as a string in TypeScript
  receiptUrl: string;      // Corresponds to the receiptUrl field in Java
  category: {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE';
  };     // Corresponds to Long in Java
}





@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8082/transactions';  // Ваш серверний URL

  constructor(private http: HttpClient) {}

  getUserTransactions(): Observable<TransactionDto[]> {
    const token = localStorage.getItem('jwt');
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<TransactionDto[]>(this.apiUrl, { headers }); 
  }

  // Додавання транзакції
  addTransaction(formData: FormData): Observable<TransactionDto> {
    const token = localStorage.getItem('jwt');
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // No need to specify Content-Type for multipart/form-data
    });
  
    return this.http.post<TransactionDto>(this.apiUrl, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error adding transaction:', error);
        return throwError(error);  // You can also handle or show error messages here
      })
    );
  }
  
  // Фільтрація транзакцій за датами та категорією
  filterTransactions(startDate?: string, endDate?: string, categoryId?: number): Observable<TransactionDto[]> {
    const token = localStorage.getItem('jwt');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    // Ініціалізація параметрів запиту
    let params = new HttpParams();
  
    // Додаємо параметри лише якщо вони задані
    if (startDate) {
      params = params.set('startDate', startDate);
    }
  
    if (endDate) {
      params = params.set('endDate', endDate);
    }
  
    // Додати навіть якщо categoryId === 0
    if (categoryId !== null && categoryId !== undefined) {
      params = params.set('categoryId', categoryId.toString());
    }
  
    // Відправляємо запит з параметрами та заголовками
    return this.http.get<TransactionDto[]>(`${this.apiUrl}/filter`, {
      params,
      headers
    });
  }
  
  

  // Оновлення транзакції
  updateTransaction(id: number, formData: FormData): Observable<TransactionDto> {
    const token = localStorage.getItem('jwt');
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Не встановлюємо Content-Type вручну
    });
  
    return this.http.put<TransactionDto>(`${this.apiUrl}/${id}`, formData, { headers });
  }
  

  // Видалення транзакції
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
