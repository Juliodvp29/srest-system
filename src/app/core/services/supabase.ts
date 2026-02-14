import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Loading } from './loading';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private router = inject(Router);
  private supabase: SupabaseClient;
  public initialized: Promise<void>;
  private _currentUser = signal<User | null>(null);
  public currentUser = this._currentUser.asReadonly();
  private _userProfile = signal<{ name: string; role: string; branch_id: string } | null>(null);
  public userProfile = this._userProfile.asReadonly();

  public userRole = computed(() => this._userProfile()?.role ?? null);

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
          // Fetch user details immediately after session recovery
          setTimeout(() => this.fetchUserProfile(user.id), 0);
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
        setTimeout(() => this.fetchUserProfile(user.id), 0);
      } else {
        this._userProfile.set(null);
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

  // Helper to run any async Supabase operation while toggling global loading
  private loading = inject(Loading);

  async withLoading<T>(fn: () => PromiseLike<T>): Promise<T> {
    try {
      this.loading.show(); // Trigger global UI loader
      return await fn();
    } finally {
      this.loading.hide();
    }
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

  // Fetch user profile from employees table
  private async fetchUserProfile(userId: string) {
    if (this.fetchingRole) return;
    this.fetchingRole = true;

    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('full_name, role, branch_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        this._userProfile.set(null);
        return;
      }

      this._userProfile.set({
        name: data?.full_name ?? 'Usuario',
        role: data?.role ?? 'auth-user',
        branch_id: data?.branch_id ?? '',
      });
    } catch (err) {
      this._userProfile.set(null);
    } finally {
      this.fetchingRole = false;
    }
  }
}
