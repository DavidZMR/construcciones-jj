import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Asignacion, AsignacionListResponse, AsignacionResponse, ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
    providedIn: 'root'
})
export class AsignacionService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Asignacion[]> {
        return this.http.get<AsignacionListResponse>(`${this.apiUrl}/asignaciones`).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message || 'Error al obtener asignaciones');
            }),
            catchError(this.handleError)
        );
    }

    create(item: any): Observable<Asignacion> {
        return this.http.post<AsignacionResponse>(`${this.apiUrl}/asignaciones`, item).pipe(
            map(response => {
                if (response.intCode === 201 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    returnAsignacion(id: string, fechaDevolucion: string): Observable<Asignacion> {
        return this.http.put<AsignacionResponse>(`${this.apiUrl}/asignaciones/${id}/devolver`, { fechaDevolucion }).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    update(id: string, item: any): Observable<Asignacion> {
        return this.http.put<AsignacionResponse>(`${this.apiUrl}/asignaciones/${id}`, item).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
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
