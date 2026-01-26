import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyStats } from './daily-stats';

describe('DailyStats', () => {
  let component: DailyStats;
  let fixture: ComponentFixture<DailyStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyStats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
