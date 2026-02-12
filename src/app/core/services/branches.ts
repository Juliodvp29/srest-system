import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Branch } from '../models/database.types';

@Injectable({
    providedIn: 'root',
})
export class Branches {
    private supabase = inject(Supabase);

    async getBranch(): Promise<Branch | null> {
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return null;

        // First try to find branch linked to user if there's a relation (e.g. employee)
        // For now assuming single tenant or getting the first active branch for demo
        // Ideally we would get the branch from the employee record

        const { data, error } = await this.supabase.client
            .from('branches')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching branch:', error);
            return null; // Or throw
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
