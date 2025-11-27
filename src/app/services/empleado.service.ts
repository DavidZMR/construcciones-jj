import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Empleado, EmpleadoListResponse, EmpleadoResponse, ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
    providedIn: 'root'
})
export class EmpleadoService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Empleado[]> {
        return this.http.get<EmpleadoListResponse>(`${this.apiUrl}/empleados`).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message || 'Error al obtener empleados');
            }),
            catchError(this.handleError)
        );
    }

    getById(id: string): Observable<Empleado> {
        return this.http.get<EmpleadoResponse>(`${this.apiUrl}/empleados/${id}`).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    create(item: Omit<Empleado, '_id' | 'createdAt' | 'updatedAt'>): Observable<Empleado> {
        return this.http.post<EmpleadoResponse>(`${this.apiUrl}/empleados`, item).pipe(
            map(response => {
                if (response.intCode === 201 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    update(id: string, item: Partial<Empleado>): Observable<Empleado> {
        return this.http.put<EmpleadoResponse>(`${this.apiUrl}/empleados/${id}`, item).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    delete(id: string): Observable<string> {
        return this.http.delete<ApiResponse>(`${this.apiUrl}/empleados/${id}`).pipe(
            map(response => {
                if (response.intCode === 200) {
                    return response.message;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        console.error('Error HTTP:', error);
        if (error.error && typeof error.error === 'object' && 'intCode' in error.error) {
            const apiError = error.error as ApiResponse;
            return throwError(() => ({
                message: apiError.message || 'Error en la petición',
                error: apiError
            }));
        }
        return throwError(() => ({
            message: error.error?.message || error.message || 'Error en la petición',
            error: error.error
        }));
    }
}
