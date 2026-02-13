import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Branch, Reservation, ReservationStatus } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Branches } from '@app/core/services/branches';
import { Reservations } from '@app/core/services/reservations';
import { Tables } from '@app/core/services/tables';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-reservations-list',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe, RouterLink],
    templateUrl: './reservations-list.html',
})
export class ReservationsList implements OnInit {
    private reservationsService = inject(Reservations);
    private branchesService = inject(Branches);
    private alertService = inject(AlertService);
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private tablesService = inject(Tables);

    reservations = signal<Reservation[]>([]);
    loading = signal<boolean>(true);
    selectedDate = signal<string>(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local
    showUpcoming = signal<boolean>(true);
    branchId = signal<string | null>(null);

    async ngOnInit() {
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['date']) {
                this.selectedDate.set(params['date']);
                this.showUpcoming.set(false); // If specific date selected, disable upcoming by default
            }
        });
        await this.loadBranch();
    }

    async loadBranch() {
        try {
            const branch = await this.branchesService.getBranch();
            if (branch) {
                this.branchId.set(branch.id);
                await this.loadReservations();
            } else {
                this.loading.set(false);
                this.alertService.error('Error', 'No se encontró la sucursal activa.');
            }
        } catch (error) {
            console.error('Error loading branch:', error);
            this.loading.set(false);
        }
    }

    async loadReservations() {
        if (!this.branchId()) return;

        this.loading.set(true);
        try {
            const data = await this.reservationsService.getReservations(
                this.branchId()!,
                this.selectedDate(),
                this.showUpcoming()
            );
            this.reservations.set(data);
        } catch (error) {
            console.error('Error loading reservations:', error);
            this.alertService.error('Error', 'Error al cargar las reservas.');
        } finally {
            this.loading.set(false);
        }
    }

    onDateChange() {
        this.showUpcoming.set(false);
        this.loadReservations();
    }

    toggleUpcoming() {
        this.showUpcoming.update(v => !v);
        this.loadReservations();
    }

    async updateStatus(reservation: Reservation, status: ReservationStatus) {
        try {
            await this.reservationsService.updateStatus(reservation.id, status);

            // Sync Table Status
            if (reservation.table_id) {
                if (status === 'seated') {
                    await this.tablesService.updateTableStatus(reservation.table_id, 'occupied');
                } else if (['completed', 'cancelled', 'no_show'].includes(status)) {
                    // Check if table should be available or if it has other active orders
                    await this.tablesService.checkAndUpdateTableStatus(reservation.table_id);
                }
            }

            this.alertService.success('Actualizado', `Estado cambiado a ${this.getStatusLabel(status)}`);
            await this.loadReservations();
        } catch (error) {
            console.error('Error updating status:', error);
            this.alertService.error('Error', 'No se pudo actualizar el estado.');
        }
    }

    getStatusColor(status: ReservationStatus): string {
        switch (status) {
            case 'booked': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'seated': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'completed': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'no_show': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    getStatusLabel(status: ReservationStatus): string {
        switch (status) {
            case 'booked': return 'Pendiente';
            case 'confirmed': return 'Confirmada';
            case 'seated': return 'En Mesa';
            case 'completed': return 'Completada';
            case 'cancelled': return 'Cancelada';
            case 'no_show': return 'No Show';
            default: return status;
        }
    }
}
