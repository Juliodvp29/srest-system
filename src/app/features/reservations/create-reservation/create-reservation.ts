import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Branch, Table, Reservation } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Branches } from '@app/core/services/branches';
import { Reservations } from '@app/core/services/reservations';
import { Tables } from '@app/core/services/tables'; // Need to fetch tables

@Component({
    selector: 'app-create-reservation',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './create-reservation.html',
})
export class CreateReservation implements OnInit {
    private reservationsService = inject(Reservations);
    private branchesService = inject(Branches);
    private errorService = inject(AlertService);
    private tablesService = inject(Tables);
    private router = inject(Router);

    loading = signal<boolean>(false);
    tables = signal<Table[]>([]);
    branchId = signal<string | null>(null);

    // Form Data
    customerName = signal('');
    customerPhone = signal('');
    customerEmail = signal('');
    date = signal('');
    time = signal('');
    partySize = signal(2);
    duration = signal(90);
    notes = signal('');
    selectedTableId = signal<string>('');

    constructor() {
        // Set default date to today
        const today = new Date();
        this.date.set(today.toLocaleDateString('en-CA')); // YYYY-MM-DD local

        // Set default time to next hour
        const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
        nextHour.setMinutes(0, 0, 0);
        this.time.set(nextHour.toTimeString().slice(0, 5));
    }

    async ngOnInit() {
        try {
            const branch = await this.branchesService.getBranch();
            if (branch) {
                this.branchId.set(branch.id);
                await this.loadTables(branch.id);
            }
        } catch (error) {
            console.error('Error loading branch:', error);
        }
    }

    async loadTables(branchId: string) {
        try {
            const data = await this.tablesService.getTablesByBranch(branchId);
            this.tables.set(data);
        } catch (error) {
            console.error('Error loading tables:', error);
        }
    }

    async saveReservation() {
        if (!this.branchId()) return;
        if (!this.customerName() || !this.date() || !this.time()) {
            this.errorService.error('Error', 'Por favor complete los campos obligatorios.');
            return;
        }

        this.loading.set(true);
        try {
            // Create a Date object from local date and time inputs
            // The browser treats `${date}T${time}` as local time
            const dateTime = new Date(`${this.date()}T${this.time()}`);

            const reservation: Partial<Reservation> = {
                branch_id: this.branchId()!,
                customer_name: this.customerName(),
                customer_phone: this.customerPhone(),
                customer_email: this.customerEmail(),
                party_size: this.partySize(),
                reservation_time: dateTime.toISOString(),
                duration_minutes: this.duration(),
                status: 'booked',
                notes: this.notes(),
                table_id: this.selectedTableId() || undefined,
            };

            await this.reservationsService.createReservation(reservation);

            // Sync Table Status
            if (this.selectedTableId()) {
                await this.tablesService.checkAndUpdateTableStatus(this.selectedTableId());
            }

            this.errorService.success('Éxito', 'Reserva creada correctamente.');
            this.router.navigate(['/reservations']);
        } catch (error) {
            console.error('Error creating reservation:', error);
            this.errorService.error('Error', 'No se pudo crear la reserva.');
        } finally {
            this.loading.set(false);
        }
    }
}
