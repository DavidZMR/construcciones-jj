import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login error completo:', error);
          
          // Extraer el mensaje de error de la estructura de respuesta estándar
          // El servicio puede devolver el error en error.message o error.error.message
          let message = '';
          
          if (error && typeof error === 'object') {
            // Primero intentar obtener el mensaje directamente
            if (error.message) {
              message = error.message;
            }
            // Si no, buscar en error.error (estructura de HttpErrorResponse)
            else if (error.error) {
              if (typeof error.error === 'object' && error.error.message) {
                message = error.error.message;
              } else if (typeof error.error === 'string') {
                message = error.error;
              }
            }
          }
          
          // Si no se encontró mensaje, usar uno por defecto
          this.errorMessage = message || 'Error al iniciar sesión. Verifica tus credenciales.';
          this.isLoading = false;
          
          console.log('Mensaje de error extraído:', this.errorMessage);
          console.log('isLoading:', this.isLoading);
          console.log('errorMessage:', this.errorMessage);
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
        }
      });
    } else {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
