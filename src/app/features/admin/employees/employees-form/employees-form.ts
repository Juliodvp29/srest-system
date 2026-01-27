import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from '@app/core/services/alert';
import { Employee, Employees as EmployeesService } from '@app/core/services/employees';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-employees-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employees-form.html',
  styleUrl: './employees-form.css',
})
export class EmployeesForm {
  private fb = inject(FormBuilder);
  private employeesService = inject(EmployeesService);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  initialData = input<Employee | null>(null);
  onSaved = output<void>();
  onCancel = output<void>();

  isLoading = signal(false);

  employeeForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    role: ['waiter' as Employee['role'], [Validators.required]],
    phone: [''],
    branch_id: [this.supabase.userProfile()?.branch_id || '', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.employeeForm.patchValue({
          full_name: data.full_name,
          role: data.role,
          phone: data.phone || '',
          branch_id: data.branch_id,
        });
        // Email and password are only for creation usually
        this.employeeForm.get('email')?.disable();
        this.employeeForm.get('password')?.clearValidators();
      } else {
        this.employeeForm.reset({
          role: 'waiter',
          branch_id: this.supabase.userProfile()?.branch_id || '',
        });
        this.employeeForm.get('email')?.enable();
        this.employeeForm
          .get('password')
          ?.setValidators([Validators.required, Validators.minLength(6)]);
      }
      this.employeeForm.get('password')?.updateValueAndValidity();
    });
  }

  async onSubmit() {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.employeeForm.getRawValue();
    const isEdit = !!this.initialData();

    try {
      if (isEdit) {
        // Simple update
        await this.employeesService.updateEmployee(this.initialData()!.id, {
          full_name: formValue.full_name || '',
          role: formValue.role as Employee['role'],
          phone: formValue.phone || undefined,
        });
        this.alertService.success('Éxito', 'Información del empleado actualizada.');
      } else {
        // TWO-STEP CREATION
        // 1. Create Auth User
        const { user } = await this.supabase.signUp(
          formValue.email || '',
          formValue.password || '',
        );

        if (!user) throw new Error('No se pudo crear el usuario de autenticación.');

        // 2. Create Employee record linked to user
        await this.employeesService.createEmployee({
          user_id: user.id,
          full_name: formValue.full_name || '',
          role: formValue.role as Employee['role'],
          phone: formValue.phone || undefined,
          branch_id: formValue.branch_id || this.supabase.userProfile()?.branch_id || '',
          is_active: true,
        });

        this.alertService.success('Éxito', 'Empleado creado y cuenta de acceso activada.');
      }
      this.onSaved.emit();
    } catch (error: any) {
      console.error('Error in employee process:', error);
      this.alertService.error('Error', error.message || 'Ocurrió un error inesperado.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
