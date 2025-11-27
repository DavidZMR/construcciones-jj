import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaquinariaEquipo } from './maquinaria-equipo';

describe('MaquinariaEquipo', () => {
  let component: MaquinariaEquipo;
  let fixture: ComponentFixture<MaquinariaEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaquinariaEquipo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaquinariaEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
