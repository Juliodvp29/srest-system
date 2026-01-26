import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesReport } from './employees-report';

describe('EmployeesReport', () => {
  let component: EmployeesReport;
  let fixture: ComponentFixture<EmployeesReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
