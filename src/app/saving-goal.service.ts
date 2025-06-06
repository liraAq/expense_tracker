import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

export interface SavingGoalDto {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  deadlineSoon?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SavingGoalsService {
  private api = 'http://localhost:8082/api/goals';

  constructor(private http: HttpClient) {}

  getGoals(): Observable<SavingGoalDto[]> {
    const token = localStorage.getItem('jwt');
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<SavingGoalDto[]>(this.api, {headers});
  }

  create(goal: SavingGoalDto): Observable<SavingGoalDto> {
    const token = localStorage.getItem('jwt');
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<SavingGoalDto>(this.api, goal,{headers});
  }

  update(goal: SavingGoalDto): Observable<SavingGoalDto> {
    const token = localStorage.getItem('jwt');
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<SavingGoalDto>(`${this.api}/${goal.id}`, goal, {headers});
  }

  delete(id: number): Observable<void> {
    const token = localStorage.getItem('jwt');
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${this.api}/${id}`, {headers});
  }
}

