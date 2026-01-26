import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserLogin } from '@app/core/models/Login';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(NonNullableFormBuilder);
  private supabase = inject(Supabase);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.handleLogin(this.loginForm.getRawValue());
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  async handleLogin(data: UserLogin) {
    this.isLoading.set(true);
    try {
      await this.supabase.signIn(data.email, data.password);

      // Get returnUrl from query params or default to dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      await this.router.navigateByUrl(returnUrl);
    } catch (err: any) {
      console.error('Login error:', err);
      // alert(err.message || 'Error al iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }
}
