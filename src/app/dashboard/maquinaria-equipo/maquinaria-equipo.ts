import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaquinariaEquipoService } from '../../services/maquinaria-equipo.service';
import { MaquinariaEquipo } from '../../interfaces/api-response.interface';
import Swal from 'sweetalert2';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-maquinaria-equipo',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './maquinaria-equipo.html',
  styleUrl: './maquinaria-equipo.scss',
})
export class MaquinariaEquipoComponent implements OnInit, AfterViewInit {
  items: MaquinariaEquipo[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  editingItem: MaquinariaEquipo | null = null;
  form: FormGroup;
  errorMessage = '';
  strType = ''
  generalFilter = ''
  strStatus = ''

  changeDetection: ChangeDetectionStrategy.OnPush = ChangeDetectionStrategy.OnPush;

  displayedColumns: string[] = ['codigo', 'nombre', 'tipo', 'placa', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<MaquinariaEquipo>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private maquinariaService: MaquinariaEquipoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      tipo: ['Herramienta', Validators.required],
      descripcion: [''],
      placa: [''],
      estado: ['Alta', Validators.required]
    });

    // Suscribirse a cambios en el tipo para validar placa
    this.form.get('tipo')?.valueChanges.subscribe(value => {
      const placaControl = this.form.get('placa');
      if (value === 'Vehículo') {
        placaControl?.setValidators([Validators.required]);
      } else {
        placaControl?.clearValidators();
        placaControl?.setValue('');
      }
      placaControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  loadData(): void {
    this.isLoading = true;

    this.maquinariaService.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.dataSource.data = items;
        this.dataSource.filterPredicate = this.customFilterPredicate();

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al cargar datos';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ... (methods from openCreateModal to delete remain unchanged)

  openCreateModal(): void {
    this.isEditing = false;
    this.editingItem = null;
    this.form.reset({
      codigo: '',
      nombre: '',
      tipo: 'Herramienta',
      descripcion: '',
      placa: '',
      estado: 'Alta'
    });
    this.form.get('estado')?.enable();
    this.showModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  openEditModal(item: MaquinariaEquipo): void {
    this.isEditing = true;
    this.editingItem = item;
    this.form.reset({
      codigo: item.codigo,
      nombre: item.nombre,
      tipo: item.tipo,
      descripcion: item.descripcion,
      placa: item.placa,
      estado: item.estado
    });

    if (item.estado === 'Asignado') {
      this.form.get('estado')?.disable();
    } else {
      this.form.get('estado')?.enable();
    }

    this.showModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.form.reset();
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  save(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.form.value;

      if (!this.isEditing) {
        this.maquinariaService.create(formData).subscribe({
          next: () => {
            this.loadData();
            this.closeModal();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al crear elemento';
            this.cdr.detectChanges();
          }
        });
      } else {
        this.maquinariaService.update(this.editingItem!._id || this.editingItem!.id!, formData).subscribe({
          next: () => {
            this.loadData();
            this.closeModal();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al actualizar elemento';
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }

  delete(item: MaquinariaEquipo): void {
    if (item.estado === 'Asignado') {
      Swal.fire('Operación no permitida', 'No se puede dar de baja un elemento que se encuentra Asignado.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Confirmar eliminación',
      text: `¿Estás seguro de que deseas eliminar ${item.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.maquinariaService.delete(item._id || item.id!).subscribe({
          next: () => {
            this.loadData();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false;
            this.cdr.detectChanges();
            Swal.fire('Error', error.message || 'Error al eliminar elemento', 'error');
          }
        });
      }
    })
  }

  applyGeneralFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.generalFilter = value;

    this.dataSource.filter = JSON.stringify({
      type: this.strType || "",
      general: value,
      status: this.strStatus || ""
    });
  }


  applyTypeFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value.toLowerCase();
    this.strType = value;

    this.dataSource.filter = JSON.stringify({
      type: value,
      general: this.generalFilter || "",
      status: this.strStatus || ""
    });
  }

  applyStatusFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value.toLowerCase();
    this.strStatus = value;
    this.dataSource.filter = JSON.stringify({
      type: this.strType || "",
      general: this.generalFilter || "",
      status: value
    });
  }

  customFilterPredicate() {
    return (data: any, filter: string): boolean => {
      const parsed = JSON.parse(filter);

      const matchesType =
        !parsed.type || (data.tipo && data.tipo.toLowerCase().includes(parsed.type));

      const matchesStatus =
        !parsed.status || (data.estado && data.estado.toLowerCase().includes(parsed.status));

      // Filtro general
      const matchesGeneral =
        !parsed.general ||
        Object.values(data)
          .join(" ")
          .toLowerCase()
          .includes(parsed.general);

      return matchesType && matchesGeneral && matchesStatus;
    };
  }

}
