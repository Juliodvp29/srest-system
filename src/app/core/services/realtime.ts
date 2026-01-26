import { Injectable, OnDestroy, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from './supabase';

export interface RealtimeEvent {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  old?: any;
  new?: any;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeService implements OnDestroy {
  private channels = new Map<string, RealtimeChannel>();

  private _orderEvents = signal<RealtimeEvent | null>(null);
  private _orderItemEvents = signal<RealtimeEvent | null>(null);
  private _tableEvents = signal<RealtimeEvent | null>(null);
  private _kitchenEvents = signal<RealtimeEvent | null>(null);

  public orderChanges = this._orderEvents.asReadonly();
  public orderItemChanges = this._orderItemEvents.asReadonly();
  public tableChanges = this._tableEvents.asReadonly();
  public kitchenChanges = this._kitchenEvents.asReadonly();

  constructor(private supabase: Supabase) {}

  private createSubscription(
    channelName: string,
    table: string,
    filter: string | undefined,
    signalToUpdate: (event: RealtimeEvent) => void,
  ): void {
    if (this.channels.has(channelName)) return;

    const channel = this.supabase.client
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, (payload: any) => {
        signalToUpdate({
          table,
          event: payload.eventType,
          old: payload.old,
          new: payload.new,
        });
      })
      .subscribe();

    this.channels.set(channelName, channel);
  }

  subscribeToOrders(branchId: string): void {
    this.createSubscription(`orders-${branchId}`, 'orders', `branch_id=eq.${branchId}`, (e) =>
      this._orderEvents.set(e),
    );
  }

  subscribeToOrderItems(orderId: string): void {
    this.createSubscription(
      `order-items-${orderId}`,
      'order_items',
      `order_id=eq.${orderId}`,
      (e) => this._orderItemEvents.set(e),
    );
  }

  subscribeToTables(branchId: string): void {
    this.createSubscription(`tables-${branchId}`, 'tables', `branch_id=eq.${branchId}`, (e) =>
      this._tableEvents.set(e),
    );
  }

  subscribeToKitchen(): void {
    this.createSubscription(
      'kitchen-updates',
      'order_items',
      `status=in.(pending,preparing)`,
      (e) => this._kitchenEvents.set(e),
    );
  }

  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel) => this.supabase.client.removeChannel(channel));
    this.channels.clear();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }
}
