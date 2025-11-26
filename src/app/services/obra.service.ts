import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';

export interface Obra {
    _id?: string;
    id?: string;
    numero_contrato: string;
    nombre_obra: string;
    estatus: 'ALTA' | 'BAJA';
    createdAt?: string;
    updatedAt?: string;
}

export type ObraListResponse = ApiResponse<Obra[]>;
export type ObraResponse = ApiResponse<Obra>;

@Injectable({
    providedIn: 'root'
})
export class ObraService {
    private apiUrl = 'http://localhost:3000/api/obras';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Obra[]> {
        return this.http.get<ObraListResponse>(this.apiUrl).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message || 'Error al obtener obras');
            }),
            catchError(this.handleError)
        );
    }

    getById(id: string): Observable<Obra> {
        return this.http.get<ObraResponse>(`${this.apiUrl}/${id}`).pipe(
            map(response => {
                if (response.intCode === 200 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    create(obra: Obra): Observable<Obra> {
        return this.http.post<ObraResponse>(this.apiUrl, obra).pipe(
            map(response => {
                if (response.intCode === 201 && response.data) {
                    return response.data;
                }
                throw new Error(response.message);
            }),
            catchError(this.handleError)
        );
    }

    update(id: string, obra: Partial<Obra>): Observable<Obra> {
        return this.http.put<ObraResponse>(`${this.apiUrl}/${id}`, obra).pipe(
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
        return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`).pipe(
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
