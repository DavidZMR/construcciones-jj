import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpleadoService } from '../../services/empleado.service';
import { Empleado } from '../../interfaces/api-response.interface';
import Swal from 'sweetalert2';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-empleados',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './empleados.html',
  styleUrl: './empleados.scss',
})
export class Empleados implements OnInit, AfterViewInit {
  empleados: Empleado[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  form: FormGroup;
  errorMessage = '';

  strPuesto = ''
  generalFilter = ''
  strStatus = ''
  strArea = ''

  displayedColumns: string[] = ['nombre', 'area', 'puesto', 'obra', 'estatus', 'acciones'];
  dataSource = new MatTableDataSource<Empleado>();

  uniqueAreas: string[] = [];
  uniquePuestos: string[] = [];
  readonly NEW_OPTION = '__NEW__';

  changeDetection: ChangeDetectionStrategy.OnPush = ChangeDetectionStrategy.OnPush;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private empleadoService: EmpleadoService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      estatus: ['Alta', Validators.required],
      area: ['', Validators.required],
      newArea: [''],
      puesto: ['', Validators.required],
      newPuesto: [''],
      obra: ['']
    });

    // Listeners para limpiar validadores si no se selecciona "Nuevo"
    this.form.get('area')?.valueChanges.subscribe(value => {
      const newAreaControl = this.form.get('newArea');
      if (value === this.NEW_OPTION) {
        newAreaControl?.setValidators([Validators.required]);
      } else {
        newAreaControl?.clearValidators();
        newAreaControl?.setValue('');
      }
      newAreaControl?.updateValueAndValidity();
    });

    this.form.get('puesto')?.valueChanges.subscribe(value => {
      const newPuestoControl = this.form.get('newPuesto');
      if (value === this.NEW_OPTION) {
        newPuestoControl?.setValidators([Validators.required]);
      } else {
        newPuestoControl?.clearValidators();
        newPuestoControl?.setValue('');
      }
      newPuestoControl?.updateValueAndValidity();
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
    this.empleadoService.getAll().subscribe({
      next: (data) => {
        console.log(data)
        this.empleados = data;
        this.dataSource.data = data;
        this.extractUniqueValues();
        this.isLoading = false;
        this.dataSource.filterPredicate = this.customFilterPredicate();

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading employees', error);
        this.errorMessage = error.message || 'Error al cargar empleados';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  extractUniqueValues() {
    const areas = new Set<string>();
    const puestos = new Set<string>();

    this.empleados.forEach(emp => {
      if (emp.area) areas.add(emp.area);
      if (emp.puesto) puestos.add(emp.puesto);
    });

    this.uniqueAreas = Array.from(areas).sort();
    this.uniquePuestos = Array.from(puestos).sort();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset({
      nombre: '',
      estatus: 'Alta',
      area: '',
      newArea: '',
      puesto: '',
      newPuesto: '',
      obra: ''
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(empleado: Empleado): void {
    this.isEditing = true;
    this.editingId = empleado._id || empleado.id || null;

    // Verificar si el área/puesto actual está en la lista (debería estar, pero por si acaso)
    // Si no está, lo agregamos temporalmente a la lista o lo manejamos como texto
    // En este caso, como extraemos de la lista actual, deberían estar.

    this.form.reset({
      nombre: empleado.nombre,
      estatus: empleado.estatus,
      area: empleado.area,
      newArea: '',
      puesto: empleado.puesto,
      newPuesto: '',
      obra: empleado.obra || ''
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.form.reset();
    this.errorMessage = '';
  }

  saveEmpleado(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.form.value;

      // Determinar valores finales de area y puesto
      const finalArea = formValue.area === this.NEW_OPTION ? formValue.newArea : formValue.area;
      const finalPuesto = formValue.puesto === this.NEW_OPTION ? formValue.newPuesto : formValue.puesto;

      const empleadoData: any = {
        nombre: formValue.nombre,
        estatus: formValue.estatus,
        area: finalArea,
        puesto: finalPuesto,
        obra: formValue.obra
      };

      if (!this.isEditing) {
        this.empleadoService.create(empleadoData).subscribe({
          next: () => {
            this.loadData();
            this.closeModal();
            Swal.fire('Éxito', 'Empleado creado correctamente', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al crear empleado';
            this.cdr.detectChanges();
          }
        });
      } else {
        if (!this.editingId) return;

        this.empleadoService.update(this.editingId, empleadoData).subscribe({
          next: () => {
            this.loadData();
            this.closeModal();
            Swal.fire('Éxito', 'Empleado actualizado correctamente', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al actualizar empleado';
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
    }
  }

  delete(empleado: Empleado): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas dar de baja a ${empleado.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        const id = empleado._id || empleado.id;
        if (!id) return;

        this.empleadoService.delete(id).subscribe({
          next: () => {
            this.loadData();
            Swal.fire('Eliminado', 'El empleado ha sido dado de baja.', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            Swal.fire('Error', error.message || 'No se pudo dar de baja al empleado', 'error');
          }
        });
      }
    });
  }

  applyGeneralFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.generalFilter = value;

    this.dataSource.filter = JSON.stringify({
      puesto: this.strPuesto || "",
      general: value,
      status: this.strStatus || "",
      area: this.strArea || ""
    });
  }


  applyPuestoFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value.toLowerCase();
    this.strPuesto = value;

    this.dataSource.filter = JSON.stringify({
      puesto: value,
      general: this.generalFilter || "",
      status: this.strStatus || "",
      area: this.strArea || ""
    });
  }

  applyStatusFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value.toLowerCase();
    this.strStatus = value;
    this.dataSource.filter = JSON.stringify({
      puesto: this.strPuesto || "",
      general: this.generalFilter || "",
      status: value,
      area: this.strArea || ""
    });
  }

  applyAreaFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value.toLowerCase();
    this.strArea = value;
    this.dataSource.filter = JSON.stringify({
      puesto: this.strPuesto || "",
      general: this.generalFilter || "",
      status: this.strStatus || "",
      area: value
    });
  }

  customFilterPredicate() {
    return (data: any, filter: string): boolean => {
      const parsed = JSON.parse(filter);

      const matchesPuesto =
        !parsed.puesto || (data.puesto && data.puesto.toLowerCase().includes(parsed.puesto));

      const matchesStatus =
        !parsed.status || (data.estatus && data.estatus.toLowerCase().includes(parsed.status));

      const matchesArea =
        !parsed.area || (data.area && data.area.toLowerCase().includes(parsed.area));

      console.log('matchesPuesto:', matchesPuesto, 'matchesStatus:', matchesStatus, 'matchesArea:', matchesArea);

      // Filtro general
      const matchesGeneral =
        !parsed.general ||
        Object.values(data)
          .join(" ")
          .toLowerCase()
          .includes(parsed.general);

      return matchesPuesto && matchesGeneral && matchesStatus && matchesArea;
    };
  }
}
