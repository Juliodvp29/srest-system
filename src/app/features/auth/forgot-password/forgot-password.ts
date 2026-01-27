import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private fb = inject(NonNullableFormBuilder);
  private supabase = inject(Supabase);

  isLoading = signal(false);
  message = signal('');
  error = signal('');

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.message.set('');
    this.error.set('');

    try {
      await this.supabase.resetPassword(this.forgotForm.getRawValue().email);
      this.message.set('Se ha enviado un correo para restablecer tu contraseña.');
    } catch (err: any) {
      this.error.set(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
