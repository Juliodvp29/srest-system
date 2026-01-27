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

  private fetchingRole = false;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);

    // Initial session check - Resolve as soon as possible
    this.initialized = this.supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user ?? null;
        this._currentUser.set(user);
        if (user) {
          // Run in next tick to avoid blocking the auth promise resolution
          setTimeout(() => this.fetchUserRole(user.id), 0);
        }
      })
      .catch((err) => {
        console.error('Supabase getSession error:', err);
      });

    // Listen for authentication changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      this._currentUser.set(user);

      if (user) {
        // Use timeout to decouple from the auth event cycle
        setTimeout(() => this.fetchUserRole(user.id), 0);
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
    if (this.fetchingRole) return;
    this.fetchingRole = true;

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
    } finally {
      this.fetchingRole = false;
    }
  }
}
