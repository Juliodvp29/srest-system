import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersDetail } from './orders-detail';

describe('OrdersDetail', () => {
  let component: OrdersDetail;
  let fixture: ComponentFixture<OrdersDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
