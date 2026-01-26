import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Helper function for notifications 
  const showErrorNotification = (message: string) => {
    alert(message);
  };

  return next(req).pipe(
    // 1. Retry once in case of network error
    retry(1),

    // 2. Capture and process errors
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        // Client side error
        errorMessage = `Error: ${error.error.message}`;
        console.error('Error del cliente:', error.error.message);
      } else {
        // Server side error
        errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
        console.error('Error del servidor:', errorMessage);

        switch (error.status) {
          case 401:
            console.log('Usuario no autorizado, redirigiendo a login...');
            router.navigate(['/login']);
            break;

          case 403:
            console.log('Acceso prohibido');
            router.navigate(['/unauthorized']);
            break;

          case 404:
            console.log('Recurso no encontrado');
            break;

          case 500:
            console.log('Error interno del servidor');
            showErrorNotification('Error del servidor. Intenta de nuevo más tarde.');
            break;

          case 503:
            console.log('Servicio no disponible');
            showErrorNotification('El servicio no está disponible temporalmente.');
            break;

          default:
            console.log('Error desconocido');
        }
      }

      return throwError(() => new Error(errorMessage));
    })
  );
};