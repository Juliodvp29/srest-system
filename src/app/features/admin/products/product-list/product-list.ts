import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Products } from '@app/core/services/products';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
} from '../../../../shared/components/dynamic-table/dynamic-table';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [DynamicTable],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  productService = inject(Products);
  products = toSignal(this.productService.getAllProducts(), { initialValue: [] });

  productColumns: ColumnConfig[] = [
    { key: 'image_url', label: 'Producto', type: 'image' },
    { key: 'category_id', label: 'Categoría', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency', sortable: true },
    {
      key: 'is_available',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        true: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        false: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      },
    },
  ];

  productActions: ActionButton[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (p) => console.log('Edit', p),
      class:
        'size-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-background-dark text-slate-500 transition-all rounded-lg',
    },
    {
      label: 'Eliminar',
      icon: 'delete',
      onClick: (p) => console.log('Delete', p),
      class:
        'size-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-lg',
    },
  ];
}
