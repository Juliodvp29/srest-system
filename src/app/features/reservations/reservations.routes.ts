import { Routes } from '@angular/router';

export const RESERVATIONS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./reservations-list/reservations-list').then(m => m.ReservationsList)
    },
    {
        path: 'create',
        loadComponent: () => import('./create-reservation/create-reservation').then(m => m.CreateReservation)
    }
];
