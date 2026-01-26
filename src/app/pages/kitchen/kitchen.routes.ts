import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards/role-guard';

export const KITCHEN_ROUTES: Routes = [
  {
    path: 'orders',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'chef'] },
    loadComponent: () =>
      import('./orders-board/orders-board').then((m) => m.OrdersBoard),
  },
  {
    path: 'order-detail/:orderId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'chef'] },
    loadComponent: () =>
      import('./orders-detail/orders-detail').then((m) => m.OrdersDetail),
  },
  {
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full',
  },
];
