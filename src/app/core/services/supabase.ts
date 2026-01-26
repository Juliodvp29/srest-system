import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private supabase: SupabaseClient;
  private _currentUser = signal<User | null>(null);
  public currentUser = this._currentUser.asReadonly();

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);

    // Get initial session
    this.supabase.auth.getSession().then(({ data }) => {
      this._currentUser.set(data.session?.user ?? null);
    });

    // Listen for authentication changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._currentUser.set(session?.user ?? null);
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
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
}
