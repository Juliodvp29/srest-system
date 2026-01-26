import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifiersForm } from './modifiers-form';

describe('ModifiersForm', () => {
  let component: ModifiersForm;
  let fixture: ComponentFixture<ModifiersForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifiersForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifiersForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
