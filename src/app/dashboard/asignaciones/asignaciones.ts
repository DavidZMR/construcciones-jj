import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsignacionService } from '../../services/asignacion.service';
import { EmpleadoService } from '../../services/empleado.service';
import { MaquinariaEquipoService } from '../../services/maquinaria-equipo.service';
import { Asignacion, Empleado, MaquinariaEquipo } from '../../interfaces/api-response.interface';
import Swal from 'sweetalert2';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-asignaciones',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './asignaciones.html',
  styleUrl: './asignaciones.scss',
})
export class Asignaciones implements OnInit, AfterViewInit {
  asignaciones: Asignacion[] = [];
  empleados: Empleado[] = [];
  maquinaria: MaquinariaEquipo[] = [];

  isLoading = false;
  showModal = false;
  showReturnModal = false;
  isEditing = false;
  editingId: string | null = null;

  form: FormGroup;
  returnForm: FormGroup;
  errorMessage = '';

  generalFilter = ''
  strStatus = ''

  displayedColumns: string[] = ['fechaAsignacion', 'empleado', 'maquinaria', 'estado', 'fechaDevolucion', 'acciones'];
  dataSource = new MatTableDataSource<Asignacion>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private asignacionService: AsignacionService,
    private empleadoService: EmpleadoService,
    private maquinariaService: MaquinariaEquipoService
  ) {
    this.form = this.fb.group({
      fechaAsignacion: ['', Validators.required],
      empleado: ['', Validators.required],
      maquinaria: [[], Validators.required],
      observaciones: ['']
    });

    this.returnForm = this.fb.group({
      fechaDevolucion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadCatalogos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  loadData(): void {
    this.isLoading = true;
    this.asignacionService.getAll().subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.dataSource.data = data;
        this.isLoading = false;

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.dataSource.filterPredicate = this.customFilterPredicate();
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading assignments', error);
        this.errorMessage = error.message || 'Error al cargar asignaciones';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCatalogos(): void {
    // Cargar empleados activos
    this.empleadoService.getAll().subscribe({
      next: (data) => {
        this.empleados = data.sort((a, b) => a.nombre.localeCompare(b.nombre)).filter(e => e.estatus === 'ALTA');
      }
    });

    // Cargar maquinaria disponible
    this.maquinariaService.getAll().subscribe({
      next: (data) => {
        this.maquinaria = data.sort((a, b) => a.nombre.localeCompare(b.nombre)).filter(m => m.estado === 'Alta');
      }
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset({
      fechaAsignacion: new Date().toISOString().split('T')[0], // Hoy por defecto
      empleado: '',
      maquinaria: [],
      observaciones: ''
    });
    // Recargar maquinaria para asegurar que tenemos la lista actualizada de disponibles
    this.loadCatalogos();
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(asignacion: Asignacion): void {
    if (asignacion.estado === 'Finalizado') {
      Swal.fire('Aviso', 'No se puede editar una asignación finalizada', 'info');
      return;
    }

    this.isEditing = true;
    this.editingId = asignacion._id || asignacion.id || null;

    // Formatear fecha para input date
    const fecha = asignacion.fechaAsignacion ? new Date(asignacion.fechaAsignacion).toISOString().split('T')[0] : '';

    // Obtener IDs de maquinaria
    const maquinariaIds = asignacion.maquinaria.map((m: any) => m._id || m.id || m);

    // Para editar, necesitamos mostrar también la maquinaria que ya tiene asignada esta asignación
    // aunque su estado sea 'Asignado'.
    // Esto es un poco complejo porque loadCatalogos filtra por 'Alta'.
    // Vamos a añadir temporalmente la maquinaria de esta asignación a la lista local.

    const maquinariaActual = asignacion.maquinaria as MaquinariaEquipo[];

    // Combinar disponibles + actuales
    // Nota: Esto es solo visual para el dropdown.
    // Si el usuario deselecciona una máquina, esta debería volver a estar disponible (pero eso lo maneja el backend al guardar? No, el backend actual maneja creación).
    // El backend updateAsignacion actual solo actualiza fecha y observaciones.
    // Si queremos permitir cambiar maquinaria, el backend necesita lógica compleja.
    // Por ahora, el usuario pidió editar, pero el backend lo limité.
    // Voy a deshabilitar maquinaria en edición o mostrar advertencia.
    // O mejor, solo permito editar fecha y observaciones como planeé en backend.

    this.form.reset({
      fechaAsignacion: fecha,
      empleado: (asignacion.empleado as Empleado)._id || (asignacion.empleado as Empleado).id,
      maquinaria: maquinariaIds,
      observaciones: asignacion.observaciones || ''
    });

    // Deshabilitar controles que no se pueden cambiar fácilmente sin lógica compleja de backend
    this.form.get('empleado')?.disable();
    this.form.get('maquinaria')?.disable();

    this.showModal = true;
    this.errorMessage = '';
  }

  openReturnModal(asignacion: Asignacion): void {
    this.editingId = asignacion._id || asignacion.id || null;
    this.returnForm.reset({
      fechaDevolucion: new Date().toISOString().split('T')[0]
    });
    this.showReturnModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.showReturnModal = false;
    this.form.reset();
    this.returnForm.reset();
    this.errorMessage = '';
    this.form.enable(); // Re-habilitar por si estaba en modo edición
  }

  saveAsignacion(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.form.getRawValue(); // getRawValue para incluir deshabilitados

      if (!this.isEditing) {
        this.asignacionService.create(formValue).subscribe({
          next: () => {
            this.loadData();
            this.closeModal();
            Swal.fire('Éxito', 'Asignación creada correctamente', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al crear asignación';
            this.cdr.detectChanges();
          }
        });
      } else {
        if (!this.editingId) return;

        this.asignacionService.update(this.editingId, formValue).subscribe({
          next: () => {
            this.loadData();
            this.closeModal();
            Swal.fire('Éxito', 'Asignación actualizada correctamente', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al actualizar asignación';
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
    }
  }

  saveReturn(): void {
    if (this.returnForm.valid && this.editingId) {
      this.isLoading = true;
      const fechaDevolucion = this.returnForm.get('fechaDevolucion')?.value;

      this.asignacionService.returnAsignacion(this.editingId, fechaDevolucion).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
          Swal.fire('Éxito', 'Asignación devuelta correctamente', 'success');
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al devolver asignación';
          this.cdr.detectChanges();
        }
      });
    }
  }

  applyGeneralFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.generalFilter = value;

    this.dataSource.filter = JSON.stringify({
      general: value,
      status: this.strStatus || "",
    });
  }

  applyStatusFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value.toLowerCase();
    this.strStatus = value;
    this.dataSource.filter = JSON.stringify({
      general: this.generalFilter || "",
      status: value,
    });
  }

  customFilterPredicate() {
    return (data: any, filter: string): boolean => {
      const parsed = JSON.parse(filter);

      const matchesStatus =
        !parsed.status || (data.estado && data.estado.toLowerCase().includes(parsed.status));


      // Filtro general
      const matchesGeneral =
        !parsed.general ||
        Object.values(data)
          .join(" ")
          .toLowerCase()
          .includes(parsed.general);

      return matchesGeneral && matchesStatus;
    };
  }

  getMaquinariaNombres(asignacion: Asignacion): string {
    if (!asignacion.maquinaria || !Array.isArray(asignacion.maquinaria)) return '';
    return asignacion.maquinaria.map((m: any) => m.nombre).join(', ');
  }

  getEmpleadoNombre(asignacion: Asignacion): string {
    if (!asignacion.empleado) return '';
    return (asignacion.empleado as any).nombre || '';
  }
}
