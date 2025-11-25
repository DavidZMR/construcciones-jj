import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { MaquinariaEquipo, MaquinariaEquipoListResponse, MaquinariaEquipoResponse, ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
    providedIn: 'root'
})
export class MaquinariaEquipoService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    getAll(): Observable<MaquinariaEquipo[]> {
        return this.http.get<MaquinariaEquipoListResponse>(`${this.apiUrl}/maquinaria-equipo`).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message || 'Error al obtener maquinaria y equipo');
            }),
            catchError(this.handleError)
        );
    }

    getById(id: string): Observable<MaquinariaEquipo> {
        return this.http.get<MaquinariaEquipoResponse>(`${this.apiUrl}/maquinaria-equipo/${id}`).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    create(item: Omit<MaquinariaEquipo, '_id' | 'createdAt' | 'updatedAt'>): Observable<MaquinariaEquipo> {
        return this.http.post<MaquinariaEquipoResponse>(`${this.apiUrl}/maquinaria-equipo`, item).pipe(
            map(response => {
                if (response.intCode === 201 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    update(id: string, item: Partial<MaquinariaEquipo>): Observable<MaquinariaEquipo> {
        return this.http.put<MaquinariaEquipoResponse>(`${this.apiUrl}/maquinaria-equipo/${id}`, item).pipe(
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
        return this.http.delete<ApiResponse>(`${this.apiUrl}/maquinaria-equipo/${id}`).pipe(
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
