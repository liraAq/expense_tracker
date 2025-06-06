import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryDto {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}


@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl = 'http://localhost:8082/api/categories';

  constructor(private http: HttpClient) {}

  getCategoriesByType(type: string): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.apiUrl}?type=${type}`);
  }
}
