import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LowStockAlert } from './low-stock-alert';

describe('LowStockAlert', () => {
  let component: LowStockAlert;
  let fixture: ComponentFixture<LowStockAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LowStockAlert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LowStockAlert);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
