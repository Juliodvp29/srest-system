import { TestBed } from '@angular/core/testing';

import { Modifiers } from './modifiers';

describe('Modifiers', () => {
  let service: Modifiers;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Modifiers);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
