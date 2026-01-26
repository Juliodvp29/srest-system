import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerDisplay } from './timer-display';

describe('TimerDisplay', () => {
  let component: TimerDisplay;
  let fixture: ComponentFixture<TimerDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimerDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
