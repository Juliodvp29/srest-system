import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockAdjuster } from './stock-adjuster';

describe('StockAdjuster', () => {
  let component: StockAdjuster;
  let fixture: ComponentFixture<StockAdjuster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAdjuster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockAdjuster);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
