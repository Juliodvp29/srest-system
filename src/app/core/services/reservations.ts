import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Reservation, ReservationStatus } from '../models/database.types';

@Injectable({
    providedIn: 'root',
})
export class Reservations {
    private supabase = inject(Supabase);

    async getReservations(branchId: string, date: string, includeUpcoming: boolean = false): Promise<Reservation[]> {
        // Date comes in YYYY-MM-DD format (local)
        // We want from 00:00:00.000 in the user's local timezone
        const startOfDay = new Date(`${date}T00:00:00`).toISOString();

        let query = this.supabase.client
            .from('reservations')
            .select('*, table:tables(*)')
            .eq('branch_id', branchId)
            .gte('reservation_time', startOfDay);

        if (!includeUpcoming) {
            const endOfDay = new Date(`${date}T23:59:59.999`).toISOString();
            query = query.lte('reservation_time', endOfDay);
        }

        const { data, error } = await query.order('reservation_time', { ascending: true });

        if (error) throw error;
        return data as any as Reservation[];
    }

    async createReservation(reservation: Partial<Reservation>): Promise<Reservation> {
        const { data, error } = await this.supabase.client
            .from('reservations')
            .insert(reservation)
            .select()
            .single();

        if (error) throw error;
        return data as any as Reservation;
    }

    async updateStatus(id: string, status: ReservationStatus): Promise<void> {
        const { error } = await this.supabase.client
            .from('reservations')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }

    async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation> {
        const { data, error } = await this.supabase.client
            .from('reservations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as any as Reservation;
    }
}
