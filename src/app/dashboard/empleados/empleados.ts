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
  showReportModal = false;
  isEditing = false;
  editingId: string | null = null;
  form: FormGroup;
  reportForm: FormGroup;
  errorMessage = '';
  reportErrorMessage = '';

  strPuesto = ''
  generalFilter = ''
  strStatus = ''
  strArea = ''
  strObra = ''

  displayedColumns: string[] = ['nombre', 'area', 'puesto', 'obra', 'estatus', 'acciones'];
  dataSource = new MatTableDataSource<Empleado>();

  uniqueAreas: string[] = [];
  uniquePuestos: string[] = [];
  uniqueObras: string[] = [];
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
      estatus: ['ALTA', Validators.required],
      area: ['', Validators.required],
      newArea: [''],
      puesto: ['', Validators.required],
      newPuesto: [''],
      obra: ['']
    });

    this.reportForm = this.fb.group({
      puesto: [''],
      area: [''],
      estatus: [''],
      obra: [''],
      search: ['']
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
    const obras = new Set<string>();

    this.empleados.forEach(emp => {
      if (emp.area) areas.add(emp.area);
      if (emp.puesto) puestos.add(emp.puesto);
      if (emp.obra) obras.add(emp.obra);
    });

    this.uniqueAreas = Array.from(areas).sort();
    this.uniquePuestos = Array.from(puestos).sort();
    this.uniqueObras = Array.from(obras).sort();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset({
      nombre: '',
      estatus: 'ALTA',
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

  private buildFilterJSON(overrides: any = {}) {
    return JSON.stringify({
      puesto: overrides.puesto ?? this.strPuesto ?? '',
      general: overrides.general ?? this.generalFilter ?? '',
      status: overrides.status ?? this.strStatus ?? '',
      area: overrides.area ?? this.strArea ?? '',
      obra: overrides.obra ?? this.strObra ?? ''
    });
  }

  applyGeneralFilter(event: Event) {
    this.generalFilter = (event.target as HTMLInputElement).value.toLowerCase();
    this.dataSource.filter = this.buildFilterJSON({ general: this.generalFilter });
  }

  applyPuestoFilter(event: Event) {
    this.strPuesto = (event.target as HTMLSelectElement).value.toLowerCase();
    this.dataSource.filter = this.buildFilterJSON({ puesto: this.strPuesto });
  }

  applyStatusFilter(event: Event) {
    this.strStatus = (event.target as HTMLSelectElement).value.toLowerCase();
    this.dataSource.filter = this.buildFilterJSON({ status: this.strStatus });
  }

  applyAreaFilter(event: Event) {
    this.strArea = (event.target as HTMLSelectElement).value.toLowerCase();
    this.dataSource.filter = this.buildFilterJSON({ area: this.strArea });
  }

  applyObraFilter(event: Event) {
    this.strObra = (event.target as HTMLSelectElement).value.toLowerCase();
    this.dataSource.filter = this.buildFilterJSON({ obra: this.strObra });
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

      const matchesObra =
        !parsed.obra ||
        (parsed.obra === '__sin_obra__' ? !data.obra : (data.obra && data.obra.toLowerCase().includes(parsed.obra)));

      const matchesGeneral =
        !parsed.general ||
        Object.values(data)
          .join(' ')
          .toLowerCase()
          .includes(parsed.general);

      return matchesPuesto && matchesGeneral && matchesStatus && matchesArea && matchesObra;
    };
  }

  openReportModal(): void {
    this.reportForm.reset({ puesto: '', area: '', estatus: '', obra: '', search: '' });
    this.showReportModal = true;
    this.reportErrorMessage = '';
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportForm.reset();
    this.reportErrorMessage = '';
  }

  generateReportPDF(): void {
    const fPuesto = (this.reportForm.get('puesto')?.value || '').toLowerCase();
    const fArea = (this.reportForm.get('area')?.value || '').toLowerCase();
    const fEstatus = (this.reportForm.get('estatus')?.value || '').toUpperCase();
    const fObra = (this.reportForm.get('obra')?.value || '').toLowerCase();
    const fSearch = (this.reportForm.get('search')?.value || '').toLowerCase();

    let filtered = [...this.empleados];

    if (fPuesto) filtered = filtered.filter(e => e.puesto && e.puesto.toLowerCase() === fPuesto);
    if (fArea) filtered = filtered.filter(e => e.area && e.area.toLowerCase() === fArea);
    if (fEstatus) filtered = filtered.filter(e => e.estatus && e.estatus.toUpperCase() === fEstatus);
    if (fObra === '__sin_obra__') {
      filtered = filtered.filter(e => !e.obra);
    } else if (fObra) {
      filtered = filtered.filter(e => e.obra && e.obra.toLowerCase().includes(fObra));
    }
    if (fSearch) {
      filtered = filtered.filter(e =>
        (e.nombre || '').toLowerCase().includes(fSearch) ||
        (e.puesto || '').toLowerCase().includes(fSearch) ||
        (e.area || '').toLowerCase().includes(fSearch) ||
        (e.obra || '').toLowerCase().includes(fSearch)
      );
    }

    if (filtered.length === 0) {
      this.reportErrorMessage = 'No se encontraron registros con los filtros seleccionados.';
      return;
    }

    import('jspdf').then(jsPDF => {
      import('jspdf-autotable').then(autoTable => {
        const doc = new jsPDF.default();
        const now = new Date();
        const docDate = now.toLocaleDateString();

        const logoUrl = 'assets/images/logo.svg';
        const img = new Image();
        img.src = logoUrl;

        const drawPDFContent = () => {
          const pageWidth = doc.internal.pageSize.width;

          doc.setFontSize(14);
          doc.setFont('times', 'bold');
          doc.text('Reporte de Empleados', pageWidth / 2, 20, { align: 'center' });

          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          doc.text(`Fecha: ${docDate}`, pageWidth - 15, 20, { align: 'right' });

          let infoY = 28;
          doc.setFontSize(9);
          if (fPuesto) { doc.text(`Puesto: ${fPuesto}`, 15, infoY); infoY += 5; }
          if (fArea) { doc.text(`Área: ${fArea}`, 15, infoY); infoY += 5; }
          if (fEstatus) { doc.text(`Estatus: ${fEstatus}`, 15, infoY); infoY += 5; }
          if (fObra) { doc.text(`Obra: ${fObra}`, 15, infoY); infoY += 5; }
          if (fSearch) { doc.text(`Búsqueda: ${fSearch}`, 15, infoY); infoY += 5; }
          doc.text(`Total: ${filtered.length} empleado(s)`, 15, infoY);
          infoY += 5;

          const body = filtered.map(e => [
            e.nombre || '-',
            e.area || '-',
            e.puesto || '-',
            e.obra || '-',
            e.estatus || '-'
          ]);

          (autoTable as any).default(doc, {
            startY: infoY + 3,
            head: [['Nombre', 'Área', 'Puesto', 'Obra', 'Estatus']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69] },
            styles: { fontSize: 10 }
          });

          doc.save(`Reporte_Empleados_${now.getTime()}.pdf`);
          this.closeReportModal();
          Swal.fire('Éxito', 'Reporte generado correctamente', 'success');
        };

        if (img.complete) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL('image/png');
            doc.addImage(pngDataUrl, 'PNG', 15, 10, 30, 12);
          }
          drawPDFContent();
        } else {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const pngDataUrl = canvas.toDataURL('image/png');
              doc.addImage(pngDataUrl, 'PNG', 15, 10, 30, 12);
            }
            drawPDFContent();
          };
          img.onerror = () => {
            drawPDFContent();
          };
        }
      });
    });
  }
}
