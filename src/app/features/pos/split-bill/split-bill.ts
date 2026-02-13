import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '@app/core/services/alert';
import { Orders } from '@app/core/services/orders';

interface SplitItem {
  order_item_id: string;
  name: string;
  price: number;
  quantity: number; // Quantity in this split
  amount: number;
  original_quantity: number; // Max available from original item
}

interface Split {
  id: number;
  name: string;
  items: SplitItem[];
}

@Component({
  selector: 'app-split-bill',
   changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './split-bill.html',
  styleUrl: './split-bill.css',
  providers: [CurrencyPipe],
})
export class SplitBill implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private ordersService = inject(Orders);
  private alertService = inject(AlertService);

  orderId = signal<string>('');
  order = signal<any>(null);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);

  // Split State
  unassignedItems = signal<SplitItem[]>([]);
  splits = signal<Split[]>([]);

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('orderId');
      if (id) {
        this.orderId.set(id);
        await this.loadOrder(id);
      }
    });
  }

  async loadOrder(id: string) {
    this.loading.set(true);
    try {
      const data = await this.ordersService.getOrderWithItems(id);
      this.order.set(data);

      // Initialize unassigned items
      const items: SplitItem[] = data.order_items.map((item: any) => ({
        order_item_id: item.id,
        name: item.product.name,
        price: item.product.price, // Use item.price if stored
        quantity: item.quantity,
        original_quantity: item.quantity,
        amount: item.amount,
      }));
      this.unassignedItems.set(items);

      // Create first empty split
      this.addSplit();
    } catch (err) {
      console.error('Error loading order:', err);
    } finally {
      this.loading.set(false);
    }
  }

  addSplit() {
    this.splits.update((current) => [
      ...current,
      {
        id: Date.now(),
        name: `Persona ${current.length + 1}`,
        items: [],
      },
    ]);
  }

  removeSplit(splitIndex: number) {
    const splitToRemove = this.splits()[splitIndex];

    // Return items to unassigned
    this.unassignedItems.update((current) => {
      const updated = [...current];
      for (const item of splitToRemove.items) {
        const existing = updated.find((i) => i.order_item_id === item.order_item_id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          updated.push({ ...item });
        }
      }
      return updated;
    });

    this.splits.update((current) => current.filter((_, i) => i !== splitIndex));
  }

  moveItemToSplit(item: SplitItem, splitIndex: number) {
    if (this.splits().length === 0) return;

    // Remove 1 from unassigned
    this.unassignedItems.update((current) => {
      return current
        .map((i) => {
          if (i.order_item_id === item.order_item_id) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);
    });

    // Add 1 to split
    this.splits.update((current) => {
      const updatedSplits = [...current];
      const split = updatedSplits[splitIndex];

      const existingInSplit = split.items.find((i) => i.order_item_id === item.order_item_id);
      if (existingInSplit) {
        existingInSplit.quantity += 1;
        existingInSplit.amount = existingInSplit.quantity * existingInSplit.price;
      } else {
        split.items.push({
          ...item,
          quantity: 1,
          amount: item.price,
        });
      }

      return updatedSplits;
    });
  }

  returnItemFromSplit(item: SplitItem, splitIndex: number) {
    // Remove 1 from split
    this.splits.update((current) => {
      const updatedSplits = [...current];
      const split = updatedSplits[splitIndex];

      const existingInSplit = split.items.find((i) => i.order_item_id === item.order_item_id);
      if (existingInSplit) {
        existingInSplit.quantity -= 1;
        existingInSplit.amount = existingInSplit.quantity * existingInSplit.price;
        if (existingInSplit.quantity <= 0) {
          split.items = split.items.filter((i) => i.order_item_id !== item.order_item_id);
        }
      }
      return updatedSplits;
    });

    // Add 1 to unassigned
    this.unassignedItems.update((current) => {
      const existing = current.find((i) => i.order_item_id === item.order_item_id);
      if (existing) {
        return current.map((i) =>
          i.order_item_id === item.order_item_id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        return [...current, { ...item, quantity: 1, amount: item.price }];
      }
    });
  }

  getSplitTotal(split: Split): number {
    return split.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async saveSplits() {
    if (this.unassignedItems().length > 0) {
      this.alertService.warning('Advertencia', 'Debes asignar todos los items antes de guardar.');
      return;
    }

    this.saving.set(true);
    try {
      const splitsPayload = this.splits().map((s) => ({
        customer_name: s.name,
        items: s.items.map((i) => ({
          order_item_id: i.order_item_id,
          quantity: i.quantity,
          amount: i.price * i.quantity,
        })),
      }));

      await this.ordersService.splitBill(this.orderId(), splitsPayload);

      this.alertService.success('Éxito', 'Cuenta dividida correctamente!');
      this.router.navigate(['/pos/order-detail', this.orderId()]);
    } catch (err) {
      console.error('Error splitting bill:', err);
      this.alertService.error('Error', 'Error al dividir la cuenta.');
    } finally {
      this.saving.set(false);
    }
  }
}
