import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asignaciones } from './asignaciones';

describe('Asignaciones', () => {
  let component: Asignaciones;
  let fixture: ComponentFixture<Asignaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Asignaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Asignaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
