import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesForm } from './employees-form';

describe('EmployeesForm', () => {
  let component: EmployeesForm;
  let fixture: ComponentFixture<EmployeesForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
