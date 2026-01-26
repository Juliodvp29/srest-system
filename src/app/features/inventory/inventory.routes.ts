import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards/role-guard';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'items',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./item-list/item-list/item-list').then((m) => m.ItemList),
  },
  {
    path: 'movements',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () =>
      import('./movements/movements/movements').then((m) => m.Movements),
  },
  {
    path: 'recipes',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./recipes/recipes/recipes').then((m) => m.Recipes),
  },
  {
    path: 'low-stock',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./low-stock/low-stock/low-stock').then((m) => m.LowStock),
  },
  {
    path: 'purchase-order',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () =>
      import('./purchase-order/purchase-order/purchase-order').then((m) => m.PurchaseOrder),
  },
  {
    path: '',
    redirectTo: 'items',
    pathMatch: 'full',
  },
];
