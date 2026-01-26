import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifiersModal } from './modifiers-modal';

describe('ModifiersModal', () => {
  let component: ModifiersModal;
  let fixture: ComponentFixture<ModifiersModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifiersModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifiersModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
