import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BestSellersChart } from './best-sellers-chart';

describe('BestSellersChart', () => {
  let component: BestSellersChart;
  let fixture: ComponentFixture<BestSellersChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BestSellersChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BestSellersChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
