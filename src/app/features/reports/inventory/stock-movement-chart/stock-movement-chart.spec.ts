import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockMovementChart } from './stock-movement-chart';

describe('StockMovementChart', () => {
  let component: StockMovementChart;
  let fixture: ComponentFixture<StockMovementChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockMovementChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockMovementChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
