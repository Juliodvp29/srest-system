import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderItemsList } from './order-items-list';

describe('OrderItemsList', () => {
  let component: OrderItemsList;
  let fixture: ComponentFixture<OrderItemsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderItemsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderItemsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
