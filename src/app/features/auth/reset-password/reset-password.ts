import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private fb = inject(NonNullableFormBuilder);
  private supabase = inject(Supabase);
  private router = inject(Router);

  isLoading = signal(false);
  error = signal('');
  success = signal(false);

  resetForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
      },
    },
  );

  async onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    try {
      await this.supabase.updatePassword(this.resetForm.getRawValue().password);
      this.success.set(true);
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    } catch (err: any) {
      this.error.set(err.message || 'Error al actualizar la contraseña.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
