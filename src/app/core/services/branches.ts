import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Branch } from '../models/database.types';

@Injectable({
    providedIn: 'root',
})
export class Branches {
    private supabase = inject(Supabase);

    async getBranch(): Promise<Branch | null> {
        // Use initialized to ensure profile is loaded
        await this.supabase.initialized;
        const profile = this.supabase.userProfile();

        // If user has a branch assigned, use it
        if (profile?.branch_id) {
            const { data, error } = await this.supabase.client
                .from('branches')
                .select('*')
                .eq('id', profile.branch_id)
                .single();

            if (!error) return data as any as Branch;
        }

        // Fallback to first active branch
        const { data, error } = await this.supabase.client
            .from('branches')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching branch:', error);
            return null;
        }

        return data as any as Branch;
    }

    async updateBranch(id: string, updates: Partial<Branch>) {
        const { data, error } = await this.supabase.client
            .from('branches')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as any as Branch;
    }
}
