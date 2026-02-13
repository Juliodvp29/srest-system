import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { KitchenOrderItem } from '../../orders-board/order-card/order-card';

@Component({
  selector: 'app-item-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './item-checklist.html',
  styleUrl: './item-checklist.css',
})
export class ItemChecklist {
  items = input.required<KitchenOrderItem[]>();
  itemStatusChange = output<{ itemId: string; status: 'pending' | 'preparing' | 'ready' }>();

  totalCount = computed(() => this.items().length);
  completedCount = computed(
    () => this.items().filter((i) => i.status === 'ready' || i.status === 'delivered').length,
  );
  progressPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  toggleItem(item: KitchenOrderItem) {
    const newStatus = item.status === 'ready' ? 'preparing' : 'ready';
    this.itemStatusChange.emit({ itemId: item.id, status: newStatus });
  }

  statusIcon(status: string): string {
    if (status === 'ready' || status === 'delivered') return 'check_circle';
    if (status === 'preparing') return 'pending';
    return 'radio_button_unchecked';
  }

  statusColor(status: string): string {
    if (status === 'ready' || status === 'delivered') return 'text-green-500';
    if (status === 'preparing') return 'text-blue-500';
    return 'text-slate-400 dark:text-sage/40';
  }
}
