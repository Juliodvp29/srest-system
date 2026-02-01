import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'menu/:tableId',
        loadComponent: () => import('./menu-view/menu-view').then((m) => m.MenuView),
      },
      {
        path: 'cart',
        loadComponent: () => import('./cart/cart').then((m) => m.Cart),
      },
      {
        path: 'order-status/:orderId',
        loadComponent: () => import('./order-status/order-status').then((m) => m.OrderStatus),
      },
      {
        path: 'order-confirmation',
        loadComponent: () =>
          import('./order-confirmation/order-confirmation').then((m) => m.OrderConfirmation),
      },
      {
        path: '',
        redirectTo: 'menu/unknown',
        pathMatch: 'full',
      },
    ],
  },
];
