import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private router = inject(Router);
  private supabase: SupabaseClient;
  public initialized: Promise<void>;
  private _currentUser = signal<User | null>(null);
  public currentUser = this._currentUser.asReadonly();
  private _userRole = signal<string | null>(null);
  public userRole = this._userRole.asReadonly();

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);

    // Initial session check - Resolve as soon as user state is known
    this.initialized = this.supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      this._currentUser.set(user);
      if (user) {
        // Start role fetching in background
        this.fetchUserRole(user.id);
      }
    });

    // Listen for authentication changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      this._currentUser.set(user);

      if (user) {
        await this.fetchUserRole(user.id);
      } else {
        this._userRole.set(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        this.router.navigate(['/auth/reset-password']);
      }
    });
  }

  // Get Supabase client
  get client(): SupabaseClient {
    return this.supabase;
  }

  // Sign
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  // Register
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  // Sign out
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // Recover password
  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login`,
    });
    if (error) throw error;
  }

  // Update password
  async updatePassword(password: string) {
    const { error } = await this.supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
  }

  // Fetch user role from employees table
  private async fetchUserRole(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        this._userRole.set(null);
        return;
      }

      this._userRole.set(data?.role ?? null);
    } catch (err) {
      this._userRole.set(null);
    }
  }
}
