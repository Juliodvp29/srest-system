import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards/role-guard';

export const POS_ROUTES: Routes = [
  {
    path: 'tables',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'waiter', 'cashier'] },
    loadComponent: () =>
      import('./tables-view/tables-view').then((m) => m.TablesView),
  },
  {
    path: 'new-order/:tableId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'waiter'] },
    loadComponent: () => import('./new-order/new-order').then((m) => m.NewOrder),
  },
  {
    path: 'order-detail/:orderId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'waiter', 'cashier'] },
    loadComponent: () =>
      import('./order-detail/order-detail').then((m) => m.OrderDetail),
  },
  {
    path: 'split-bill/:orderId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'waiter', 'cashier'] },
    loadComponent: () =>
      import('./split-bill/split-bill').then((m) => m.SplitBill),
  },
  {
    path: 'payment/:orderId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'cashier'] },
    loadComponent: () => import('./payment/payment').then((m) => m.Payment),
  },
  {
    path: '',
    redirectTo: 'tables',
    pathMatch: 'full',
  },
];
