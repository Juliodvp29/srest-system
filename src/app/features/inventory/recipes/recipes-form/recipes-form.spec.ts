import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipesForm } from './recipes-form';

describe('RecipesForm', () => {
  let component: RecipesForm;
  let fixture: ComponentFixture<RecipesForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipesForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipesForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
