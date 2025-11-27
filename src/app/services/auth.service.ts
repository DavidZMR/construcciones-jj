import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LoginResponse, LoginResponseData, ApiResponse } from '../interfaces/api-response.interface';

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponseData> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        console.log('Login response:', response);
        if (response.intCode === 200 && response.data) {
          this.setToken(response.data.token);
          this.setUser(response.data.user);
          return response.data;
        }
        throw new Error(response.message || 'Error al iniciar sesión');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login HTTP error:', error);
        // Si el error tiene la estructura estándar de respuesta del backend
        if (error.error && typeof error.error === 'object' && 'intCode' in error.error && 'message' in error.error) {
          const apiError = error.error as ApiResponse;
          return throwError(() => ({
            error: apiError,
            message: apiError.message
          }));
        }
        // Si no tiene la estructura, usar el mensaje genérico
        return throwError(() => ({
          error: error.error,
          message: error.error?.message || error.message || 'Error al iniciar sesión'
        }));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
}

