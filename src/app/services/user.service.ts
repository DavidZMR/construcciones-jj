import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { User, UsersResponse, UserResponse, ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users`).pipe(
      map(response => {
        console.log('GetUsers response:', response);
        if (response.intCode === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener usuarios');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error HTTP en getUsers:', error);
        // Si el error tiene la estructura estándar del backend
        if (error.error && typeof error.error === 'object' && 'intCode' in error.error) {
          const apiError = error.error as ApiResponse;
          return throwError(() => ({
            message: apiError.message || 'Error al obtener usuarios',
            error: apiError
          }));
        }
        // Error genérico
        return throwError(() => ({
          message: error.error?.message || error.message || 'Error al obtener usuarios',
          error: error.error
        }));
      })
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<UserResponse>(`${this.apiUrl}/users/${id}`).pipe(
      map(response => {
        if (response.intCode === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message);
      })
    );
  }

  createUser(user: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Observable<User> {
    return this.http.post<UserResponse>(`${this.apiUrl}/users`, user).pipe(
      map(response => {
        if (response.intCode === 201 && response.data) {
          return response.data;
        }
        console.log('CreateUser response error:', response);
        throw new Error(response.message);
      })
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<UserResponse>(`${this.apiUrl}/users/${id}`, user).pipe(
      map(response => {
        if (response.intCode === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message);
      })
    );
  }

  deleteUser(id: string): Observable<string> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/users/${id}`).pipe(
      map(response => {
        if (response.intCode === 200) {
          return response.message;
        }
        throw new Error(response.message);
      })
    );
  }
}

