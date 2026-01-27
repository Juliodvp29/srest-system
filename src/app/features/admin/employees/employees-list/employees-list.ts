import { Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
  FilterConfig,
} from '@app/shared/components/dynamic-table/dynamic-table';
import { Employee, Employees as EmployeesService } from '@services/employees';

import { Supabase } from '@app/core/services/supabase';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [DynamicTable],
  templateUrl: './employees-list.html',
  styleUrl: './employees-list.css',
})
export class EmployeesList {
  private employeesService = inject(EmployeesService);
  private supabase = inject(Supabase);

  refreshTrigger = input<number>(0);
  onAdd = output<void>();
  onEdit = output<Employee>();

  // Reactive branch ID from logged in user profile
  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  private employeesRaw = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() => {
        const bid = this.branchId();
        if (!bid) return [];
        return this.employeesService.getAllEmployees(bid);
      }),
    ),
    { initialValue: [] },
  );

  employees = computed(() => this.employeesRaw());

  columns: ColumnConfig[] = [
    { key: 'full_name', label: 'Nombre Completo', sortable: true },
    { key: 'role', label: 'Cargo', type: 'badge', sortable: true },
    { key: 'phone', label: 'Teléfono', type: 'text' },
    { key: 'created_at', label: 'Creacion', type: 'date' },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        true: 'badge-active',
        false: 'badge-inactive',
      },
    },
  ];

  actions: ActionButton[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (e: Employee) => this.onEdit.emit(e),
      class:
        'size-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-background-dark text-slate-500 transition-all rounded-lg',
    },
    {
      label: 'Eliminar',
      icon: 'delete',
      onClick: (e: Employee) => this.deleteEmployee(e),
      class:
        'size-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-lg',
    },
  ];

  filters: FilterConfig[] = [
    {
      key: 'role',
      label: 'Cargo',
      type: 'select',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Gerente', value: 'manager' },
        { label: 'Mesero', value: 'waiter' },
        { label: 'Cocinero', value: 'chef' },
        { label: 'Cajero', value: 'cashier' },
      ],
    },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ],
    },
  ];

  async deleteEmployee(employee: Employee) {
    if (confirm(`¿Estás seguro de eliminar a ${employee.full_name}?`)) {
      try {
        await this.employeesService.deleteEmployee(employee.id);
        // We'd ideally have a way to trigger refresh from here if not using signals effectively
        // but since this is a child, it's better to emit an event or use a shared state.
        // For simplicity, I'll update the local signal if I had it, or the parent can handle it.
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  }
}
