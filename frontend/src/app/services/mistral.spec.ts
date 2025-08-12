import { TestBed } from '@angular/core/testing';

import { Mistral } from './mistral';

describe('Mistral', () => {
  let service: Mistral;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Mistral);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
