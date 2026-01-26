import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'menu/:tableNumber',
    loadComponent: () => import('./menu/menu').then((m) => m.Menu),
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart').then((m) => m.Cart),
  },
  {
    path: 'order-confirmation',
    loadComponent: () =>
      import('./order-confirmation/order-confirmation').then((m) => m.OrderConfirmation),
  },
  {
    path: 'order-status/:orderId',
    loadComponent: () => import('./order-status/order-status').then((m) => m.OrderStatus),
  },
  {
    path: '',
    redirectTo: 'menu/1',
    pathMatch: 'full',
  },
];
