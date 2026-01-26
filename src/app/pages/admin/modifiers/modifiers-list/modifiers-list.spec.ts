import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifiersList } from './modifiers-list';

describe('ModifiersList', () => {
  let component: ModifiersList;
  let fixture: ComponentFixture<ModifiersList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifiersList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifiersList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
