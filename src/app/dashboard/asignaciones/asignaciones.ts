import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AsignacionService } from '../../services/asignacion.service';
import { EmpleadoService } from '../../services/empleado.service';
import { MaquinariaEquipoService } from '../../services/maquinaria-equipo.service';
import { ObraService, Obra } from '../../services/obra.service';
import { Asignacion, Empleado, MaquinariaEquipo } from '../../interfaces/api-response.interface';
import Swal from 'sweetalert2';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-asignaciones',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './asignaciones.html',
  styleUrl: './asignaciones.scss',
})
export class Asignaciones implements OnInit, AfterViewInit {
  asignaciones: Asignacion[] = [];
  empleados: Empleado[] = [];
  maquinaria: MaquinariaEquipo[] = [];
  obras: Obra[] = [];

  isLoading = false;
  showModal = false;
  showReturnModal = false;
  showReportModal = false;
  showSignatureModal = false;
  isEditing = false;
  editingId: string | null = null;

  // Signature state
  activeSignatureSlot: string = '';
  signatures: { [key: string]: string } = {};
  currentAsignacionForPDF: Asignacion | null = null;
  currentPreviewImage: string | null = null;
  isCanvasDirty: boolean = false;
  private isDrawing = false;
  private canvasCtx: CanvasRenderingContext2D | null = null;

  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  form: FormGroup;
  returnForm: FormGroup;
  reportForm: FormGroup;
  errorMessage = '';

  generalFilter = ''
  strStatus = ''
  strObra = ''
  strEmpleado = ''
  fechaAsignacionDesde = ''
  fechaAsignacionHasta = ''
  fechaDevolucionDesde = ''
  fechaDevolucionHasta = ''

  displayedColumns: string[] = ['fechaAsignacion', 'empleado', 'obra', 'maquinaria', 'estado', 'fechaDevolucion', 'acciones'];
  dataSource = new MatTableDataSource<Asignacion>();

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.dataSource.paginator = this.paginator;
  }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.dataSource.sort = this.sort;
  }

  paginator!: MatPaginator;
  sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private asignacionService: AsignacionService,
    private empleadoService: EmpleadoService,
    private maquinariaService: MaquinariaEquipoService,
    private obraService: ObraService
  ) {
    this.form = this.fb.group({
      fechaAsignacion: ['', Validators.required],
      empleado: ['', Validators.required],
      maquinaria: this.fb.array([], Validators.required),
      obra: ['']
    });

    this.returnForm = this.fb.group({
      fechaDevolucion: ['', Validators.required],
      itemsDevueltos: this.fb.array([], Validators.required)
    });

    this.reportForm = this.fb.group({
      machineryEquipment: [[]],
      obra: [[]],
      empleado: [[]],
      fechaAsigDesde: [''],
      fechaAsigHasta: ['']
    });
  }

  get maquinariaFormArray() {
    return this.form.get('maquinaria') as FormArray;
  }

  get itemsDevueltosFormArray() {
    return this.returnForm.get('itemsDevueltos') as FormArray;
  }

  ngOnInit(): void {
    this.loadData();
    this.loadCatalogos();

    // Configurar sorting y filtering aquí para asegurar que estén listos
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'empleado': return (item.empleado?.nombre || '').toLowerCase();
        case 'obra': return (item.obra?.nombre_obra || '').toLowerCase();
        default: return (item[property] || '').toString().toLowerCase();
      }
    };

    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  ngAfterViewInit() {
    // Ya no es necesario inicializar aquí gracias a los setters
  }

  loadData(): void {
    this.isLoading = true;
    this.asignacionService.getAll().subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.dataSource.data = data;
        this.isLoading = false;
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
        this.maquinaria = data.sort((a, b) => a.nombre.localeCompare(b.nombre)).filter(o => o.estado !== 'Baja');
      }
    });

    // Cargar obras activas
    this.obraService.getAll().subscribe({
      next: (data) => {
        this.obras = data.sort((a, b) => a.nombre_obra.localeCompare(b.nombre_obra)).filter(o => o.estatus === 'ALTA');
      }
    });
  }

  addMaquinariaItem(item?: any) {
    const group = this.fb.group({
      item: [item?.item || '', Validators.required],
      cantidad: [item?.cantidad || 1, [Validators.required, Validators.min(1)]],
      observaciones: [item?.observaciones || '']
    });
    this.maquinariaFormArray.push(group);
  }

  removeMaquinariaItem(index: number) {
    this.maquinariaFormArray.removeAt(index);
    this.cdr.detectChanges();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset({
      fechaAsignacion: new Date().toISOString().split('T')[0], // Hoy por defecto
      empleado: '',
      obra: ''
    });
    this.maquinariaFormArray.clear();
    this.addMaquinariaItem(); // Add one empty item by default

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

    // Recargar catálogos para tener disponibilidad más reciente
    this.loadCatalogos();

    // Formatear fecha para input date
    const fecha = asignacion.fechaAsignacion ? new Date(asignacion.fechaAsignacion).toISOString().split('T')[0] : '';

    this.maquinariaFormArray.clear();
    if (asignacion.maquinaria && Array.isArray(asignacion.maquinaria)) {
      asignacion.maquinaria.forEach((m: any) => {
        const itemId = m.item && (m.item._id || m.item.id) ? (m.item._id || m.item.id) : m.item;
        this.addMaquinariaItem({
          item: itemId,
          cantidad: m.cantidad,
          observaciones: m.observaciones
        });
      });
    }

    // Extraer IDs de forma segura
    const empleadoId = typeof asignacion.empleado === 'object' ?
      (asignacion.empleado._id || asignacion.empleado.id) : asignacion.empleado;

    const obraId = asignacion.obra ?
      (typeof asignacion.obra === 'object' ? (asignacion.obra._id || asignacion.obra.id) : asignacion.obra) : '';

    this.form.patchValue({
      fechaAsignacion: fecha,
      empleado: empleadoId,
      obra: obraId
    });

    this.showModal = true;
    this.errorMessage = '';
  }

  openReturnModal(asignacion: Asignacion): void {
    this.editingId = asignacion._id || asignacion.id || null;
    this.returnForm.reset({
      fechaDevolucion: new Date().toISOString().split('T')[0]
    });

    // Inicializar array con items pendientes de devolución
    this.itemsDevueltosFormArray.clear();
    asignacion.maquinaria.forEach((m: any) => {
      const cantidadPendiente = m.cantidad - (m.cantidadDevuelta || 0);
      if (cantidadPendiente > 0) {
        this.itemsDevueltosFormArray.push(this.fb.group({
          itemId: [m.item._id || m.item.id],
          nombre: [m.item.nombre],
          cantidadTotal: [m.cantidad],
          cantidadDevuelta: [m.cantidadDevuelta || 0],
          cantidadPendiente: [cantidadPendiente],
          cantidadADevolver: [cantidadPendiente, [Validators.min(1), Validators.max(cantidadPendiente)]],
          seleccionado: [false]
        }));
      }
    });

    this.showReturnModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.showReturnModal = false;
    this.showReportModal = false;
    this.form.reset();
    this.maquinariaFormArray.clear();
    this.returnForm.reset();
    this.reportForm.reset();
    this.errorMessage = '';
    this.form.enable(); // Re-habilitar por si estaba en modo edición
  }

  assignedMachinery: any[] = [];

  openReportModal(): void {
    this.loadAssignedMachinery();
    this.reportForm.reset({
      machineryEquipment: [],
      obra: [],
      empleado: []
    });
    this.showReportModal = true;
    this.errorMessage = '';
  }

  uniqueAssignedMachinery: any[] = [];

  loadAssignedMachinery(): void {
    this.asignacionService.getAssignedMachinery().subscribe({
      next: (data) => {
        this.assignedMachinery = data.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

        // Filtrar duplicados por ID para el dropdown
        const seen = new Set();
        this.uniqueAssignedMachinery = this.assignedMachinery.filter(item => {
          const duplicate = seen.has(item.id);
          seen.add(item.id);
          return !duplicate;
        });
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading assigned machinery', error);
        this.errorMessage = 'Error al cargar maquinaria asignada';
      }
    });
  }

  generateReportPDF(): void {
    if (this.reportForm.valid) {
      const selectedIds = this.reportForm.get('machineryEquipment')?.value || [];
      const selectedObras = this.reportForm.get('obra')?.value || [];
      const selectedEmpleados = this.reportForm.get('empleado')?.value || [];
      const fDesde = this.reportForm.get('fechaAsigDesde')?.value || '';
      const fHasta = this.reportForm.get('fechaAsigHasta')?.value || '';

      let selectedItems = this.assignedMachinery;
      // Filter by Obra
      if (selectedObras.length > 0) {
        selectedItems = selectedItems.filter(item => {
          const obraId = item.project ? item.project.project_id : null;
          return selectedObras.includes(obraId);
        });
      }

      // Filter by Empleado
      if (selectedEmpleados.length > 0) {
        selectedItems = selectedItems.filter(item => {
          const empId = item.assigned_to ? item.assigned_to.person_id : null;
          return selectedEmpleados.includes(empId);
        });
      }

      // Filter by Maquinaria (Specific Items)
      if (selectedIds.length > 0) {
        selectedItems = selectedItems.filter(item => selectedIds.includes(item.id));
      }

      // Filter by Fecha Asignación range
      if (fDesde || fHasta) {
        selectedItems = selectedItems.filter(item => {
          const fecha = item.fechaAsignacion ? new Date(item.fechaAsignacion) : null;
          if (!fecha) return false;
          if (fDesde && fecha < new Date(fDesde)) return false;
          if (fHasta) {
            const hasta = new Date(fHasta);
            hasta.setHours(23, 59, 59, 999);
            if (fecha > hasta) return false;
          }
          return true;
        });
      }

      if (selectedItems.length === 0) {
        this.errorMessage = 'No se encontraron registros con los filtros seleccionados.';
        return;
      }

      import('jspdf').then(jsPDF => {
        import('jspdf-autotable').then(autoTable => {
          const doc = new jsPDF.default();

          // Header
          const now = new Date();
          const docDate = now.toLocaleDateString();

          const logoUrl = 'assets/images/logo.svg';
          const img = new Image();
          img.src = logoUrl;

          const drawPDFContent = () => {
            // Title
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            const pageWidth = doc.internal.pageSize.width;
            doc.text('Maquinaria y equipo asignados', pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('times', 'normal');
            doc.text(`Fecha: ${docDate}`, pageWidth - 15, 20, { align: 'right' });

            let infoY = 27;
            doc.setFontSize(9);
            if (fDesde || fHasta) {
              const rangoTexto = fDesde && fHasta ? `${fDesde} a ${fHasta}` : fDesde ? `Desde ${fDesde}` : `Hasta ${fHasta}`;
              doc.text(`Fecha asignación: ${rangoTexto}`, 15, infoY);
              infoY += 5;
            }
            doc.text(`Total: ${selectedItems.length} registro(s)`, 15, infoY);
            infoY += 5;

            // Table
            const body = selectedItems.map(item => [
              item.fechaAsignacion ? new Date(item.fechaAsignacion).toLocaleDateString() : '-',
              item.code || '-',
              item.name || '-',
              item.assigned_to?.person_name || '-',
              item.project?.project_name || 'Sin obra asignada',
              item.assigned_quantity || 0,
              item.returned_quantity || 0
            ]);

            (autoTable as any).default(doc, {
              startY: infoY + 2,
              head: [['Fecha', 'Código', 'Nombre', 'Asignado a', 'Obra', 'C. Asig.', 'C. Dev.']],
              body: body,
              theme: 'grid',
              headStyles: { fillColor: [220, 53, 69] },
              styles: { fontSize: 9 }
            });

            doc.save(`Reporte_Maquinaria_Asignada_${now.getTime()}.pdf`);
            this.closeModal();
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
      const itemsSeleccionados = this.itemsDevueltosFormArray.controls
        .filter(ctrl => ctrl.get('seleccionado')?.value)
        .map(ctrl => ({
          itemId: ctrl.get('itemId')?.value,
          cantidadDevuelta: ctrl.get('cantidadADevolver')?.value
        }));

      if (itemsSeleccionados.length === 0) {
        this.errorMessage = 'Debe seleccionar al menos un item para devolver';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      const fechaDevolucion = this.returnForm.get('fechaDevolucion')?.value;

      this.asignacionService.returnAsignacion(this.editingId, fechaDevolucion, itemsSeleccionados).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
          Swal.fire('Éxito', 'Devolución procesada correctamente', 'success');
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al procesar devolución';
          this.cdr.detectChanges();
        }
      });
    }
  }

  private buildFilterJSON(overrides: any = {}) {
    return JSON.stringify({
      general: overrides.general ?? this.generalFilter ?? '',
      status: overrides.status ?? this.strStatus ?? '',
      obra: overrides.obra ?? this.strObra ?? '',
      empleado: overrides.empleado ?? this.strEmpleado ?? '',
      fechaAsigDesde: this.fechaAsignacionDesde ?? '',
      fechaAsigHasta: this.fechaAsignacionHasta ?? '',
      fechaDevDesde: this.fechaDevolucionDesde ?? '',
      fechaDevHasta: this.fechaDevolucionHasta ?? ''
    });
  }

  applyGeneralFilter(event: Event) {
    this.generalFilter = (event.target as HTMLInputElement).value.toLowerCase();
    this.dataSource.filter = this.buildFilterJSON({ general: this.generalFilter });
  }

  applyStatusFilter(event: Event) {
    this.strStatus = (event.target as HTMLSelectElement).value.toLowerCase();
    this.dataSource.filter = this.buildFilterJSON({ status: this.strStatus });
  }

  applyObraFilter(event: Event) {
    this.strObra = (event.target as HTMLSelectElement).value;
    this.dataSource.filter = this.buildFilterJSON({ obra: this.strObra });
  }

  applyEmpleadoFilter(event: Event) {
    this.strEmpleado = (event.target as HTMLSelectElement).value;
    this.dataSource.filter = this.buildFilterJSON({ empleado: this.strEmpleado });
  }

  applyDateFilter() {
    this.dataSource.filter = this.buildFilterJSON();
  }

  customFilterPredicate() {
    return (data: any, filter: string): boolean => {
      const parsed = JSON.parse(filter);

      const matchesStatus =
        !parsed.status || (data.estado && data.estado.toLowerCase().includes(parsed.status));

      const obraId = data.obra && (data.obra._id || data.obra.id) ? (data.obra._id || data.obra.id) : '';
      const matchesObra = !parsed.obra || obraId === parsed.obra;

      const empleadoId = data.empleado && (data.empleado._id || data.empleado.id) ? (data.empleado._id || data.empleado.id) : '';
      const matchesEmpleado = !parsed.empleado || empleadoId === parsed.empleado;

      const matchesGeneral =
        !parsed.general ||
        Object.values(data)
          .join(' ')
          .toLowerCase()
          .includes(parsed.general);

      // Date range: Fecha Asignación
      let matchesFechaAsig = true;
      if (parsed.fechaAsigDesde || parsed.fechaAsigHasta) {
        const fecha = data.fechaAsignacion ? new Date(data.fechaAsignacion) : null;
        if (!fecha) {
          matchesFechaAsig = false;
        } else {
          if (parsed.fechaAsigDesde) {
            matchesFechaAsig = matchesFechaAsig && fecha >= new Date(parsed.fechaAsigDesde);
          }
          if (parsed.fechaAsigHasta) {
            const hasta = new Date(parsed.fechaAsigHasta);
            hasta.setHours(23, 59, 59, 999);
            matchesFechaAsig = matchesFechaAsig && fecha <= hasta;
          }
        }
      }

      // Date range: Fecha Devolución
      let matchesFechaDev = true;
      if (parsed.fechaDevDesde || parsed.fechaDevHasta) {
        const fecha = data.fechaDevolucion ? new Date(data.fechaDevolucion) : null;
        if (!fecha) {
          matchesFechaDev = false;
        } else {
          if (parsed.fechaDevDesde) {
            matchesFechaDev = matchesFechaDev && fecha >= new Date(parsed.fechaDevDesde);
          }
          if (parsed.fechaDevHasta) {
            const hasta = new Date(parsed.fechaDevHasta);
            hasta.setHours(23, 59, 59, 999);
            matchesFechaDev = matchesFechaDev && fecha <= hasta;
          }
        }
      }

      return matchesGeneral && matchesStatus && matchesObra && matchesEmpleado && matchesFechaAsig && matchesFechaDev;
    };
  }

  getMaquinariaNombres(asignacion: Asignacion): string {
    if (!asignacion.maquinaria || !Array.isArray(asignacion.maquinaria)) return '';
    return asignacion.maquinaria.map((m: any) => {
      const nombre = m.item?.nombre || 'Desconocido';
      const cantidad = m.cantidad || 1;
      return `${nombre} (${cantidad})`;
    }).join(', ');
  }

  getEmpleadoNombre(asignacion: Asignacion): string {
    if (!asignacion.empleado) return '';
    return (asignacion.empleado as any).nombre || '';
  }

  getEstadoDevolucion(asignacion: Asignacion): string {
    if (asignacion.estado === 'Finalizado') return 'Completado';

    const totalItems = asignacion.maquinaria.length;
    const itemsDevueltos = asignacion.maquinaria.filter((m: any) =>
      (m.cantidadDevuelta || 0) >= m.cantidad
    ).length;

    if (itemsDevueltos === 0) return 'Activo';
    return `Parcial (${itemsDevueltos}/${totalItems})`;
  }

  getObraNombre(asignacion: Asignacion): string {
    if (!asignacion.obra) return '-';
    return (asignacion.obra as any).nombre_obra || '-';
  }

  generatePDF(asignacion: Asignacion, sigs: { [key: string]: string } = {}) {
    import('jspdf').then(jsPDF => {
      import('jspdf-autotable').then(autoTable => {
        const doc = new jsPDF.default();

        const now = new Date();
        const folio = `ASG-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

        const logoUrl = 'assets/images/logo.svg';
        const img = new Image();
        img.src = logoUrl;

        const buildPDF = () => {
          doc.setFontSize(11);
          doc.setFont('times', 'bold');
          const pageWidth = doc.internal.pageSize.width;
          doc.text('CONSTRUCCIONES J.J. S.A. DE C.V.', pageWidth / 2, 16, { align: 'center' });

          doc.setFontSize(11);
          doc.setFont('times', 'normal');
          doc.text('ASIGNACIÓN DE MAQUINARIA Y EQUIPO', pageWidth / 2, 23, { align: 'center' });

          doc.setFontSize(11);
          doc.setTextColor(220, 53, 69);
          doc.text(`FOLIO: ${folio}`, 155, 16);
          doc.setTextColor(0, 0, 0);

          doc.setFontSize(11);
          doc.text(`FECHA: ${new Date(asignacion.fechaAsignacion).toLocaleDateString()}`, 155, 23);

          doc.setLineWidth(0.5);
          doc.line(15, 30, 195, 30);

          doc.setFont('times', 'bold');
          doc.text('DATOS DEL EMPLEADO:', 15, 38);
          doc.setFont('times', 'normal');
          doc.text((asignacion.empleado as any).nombre || '', 64, 38);

          doc.setFont('times', 'bold');
          doc.text('OBRA:', 15, 45);
          doc.setFont('times', 'normal');
          doc.text(this.getObraNombre(asignacion), 64, 45);

          const machineryData = (asignacion.maquinaria as any[]).map(m => [
            m.item?.codigo || '-',
            m.item?.nombre || '-',
            m.cantidad || 1,
            m.observaciones || '-'
          ]);

          (autoTable as any).default(doc, {
            startY: 52,
            head: [['CÓDIGO', 'DESCRIPCIÓN', 'CANTIDAD', 'OBSERVACIONES']],
            body: machineryData,
            theme: 'grid',
            headStyles: {
              fillColor: [200, 200, 200],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 11
            },
            styles: { fontSize: 11, halign: 'center', valign: 'middle' },
            columnStyles: { 1: { halign: 'left' }, 3: { halign: 'left' } }
          });

          const finalY = (doc as any).lastAutoTable.finalY + 10;

          doc.setFontSize(11);
          doc.setFont('times', 'normal');
          const legalText = "ESTOY DE ACUERDO EN DEVOLVER EL EQUIPO DE PROTECCIÓN PERSONAL, HERRAMIENTA Y MAQUINARIA EN BUENAS CONDICIONES, CONSIDERANDO EL DESGASTE POR USO RAZONABLE AL ALMACÉN DE CONSTRUCCIONES JJ UNA VEZ TERMINADOS MIS TRABAJOS CON DONDE LOS NECESITE. SI NO FUESE DE ESTA MANERA, ES DECIR, QUE DIERA MAL USO, LA EMPRESA DEBERÁ DESCONTAR DE MI SALARIO EL VALOR DE REPARACIÓN O EN SU CASO EL VALOR DE REPOSICIÓN. (ART. 110-1 LFT)";
          const splitText = doc.splitTextToSize(legalText, 180);
          doc.text(splitText, 15, finalY, { align: 'justify', maxWidth: 180 });

          let signatureY = finalY + 50;
          if (signatureY + 60 > 280) {
            doc.addPage();
            signatureY = 40;
          }

          doc.setLineWidth(0.2);
          doc.setFont('times', 'normal');
          doc.setFontSize(11);

          // Signature 1: Recibí (Left)
          if (sigs['recibi']) {
            doc.addImage(sigs['recibi'], 'PNG', 20, signatureY - 21, 70, 28);
          }
          doc.line(20, signatureY, 90, signatureY);
          doc.text('RECIBÍ DE CONFORMIDAD', 55, signatureY + 5, { align: 'center' });
          const nombreEmpleado = (asignacion.empleado as any).nombre || '';
          doc.setFontSize(10);
          doc.text(nombreEmpleado, 55, signatureY + 10, { align: 'center' });
          doc.setFontSize(11);

          // Signature 2: Coordinador (Right)
          if (sigs['coordinador']) {
            doc.addImage(sigs['coordinador'], 'PNG', 120, signatureY - 21, 70, 28);
          }
          doc.line(120, signatureY, 190, signatureY);
          doc.text('COORDINADOR DE ALMACÉN', 155, signatureY + 5, { align: 'center' });

          // Row 2
          const signatureY2 = signatureY + 35;

          // Signature 3: Vigilancia (Left)
          if (sigs['vigilancia']) {
            doc.addImage(sigs['vigilancia'], 'PNG', 20, signatureY2 - 21, 70, 28);
          }
          doc.line(20, signatureY2, 90, signatureY2);
          doc.text('VIGILANCIA', 55, signatureY2 + 5, { align: 'center' });

          // Signature 4: Chofer (Right)
          if (sigs['chofer']) {
            doc.addImage(sigs['chofer'], 'PNG', 120, signatureY2 - 21, 70, 28);
          }
          doc.line(120, signatureY2, 190, signatureY2);
          doc.text('CHOFER', 155, signatureY2 + 5, { align: 'center' });

          // Footer
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(11);
          doc.setTextColor(100, 100, 100);
          doc.setFont('times', 'bold');
          doc.text('F-610-7.1', 194, pageHeight - 15, { align: 'right' });
          doc.setFont('times', 'normal');
          const footerText = "ESTE DOCUMENTO CONTIENE INFORMACIÓN PROPIEDAD DE CONSTRUCCIONES J.J. S.A. DE C.V. CONSIDERADA DE USO INTERNO. CUALQUIER DISTRIBUCION O REPRODUCCIÓN SERÁ BAJO AUTORIZACIÓN ESPECÍFICA.";
          const splitFooter = doc.splitTextToSize(footerText, 180);
          doc.text(splitFooter, pageWidth / 2, pageHeight - 10, { align: 'center' });

          doc.save(`Asignacion_${folio}.pdf`);
        };

        if (img.complete) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL('image/png');
            doc.addImage(pngDataUrl, 'PNG', 15, 10, 35, 14);
          }
          buildPDF();
        } else {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const pngDataUrl = canvas.toDataURL('image/png');
              doc.addImage(pngDataUrl, 'PNG', 15, 10, 35, 14);
            }
            buildPDF();
          };
          img.onerror = () => {
            console.error('Error loading logo');
            buildPDF();
          };
        }
      });
    });
  }

  // ===== SIGNATURE METHODS =====

  openSignatureModal(asignacion: Asignacion): void {
    this.currentAsignacionForPDF = asignacion;
    this.signatures = {};
    this.activeSignatureSlot = '';
    this.showSignatureModal = true;
    this.cdr.detectChanges();
  }

  closeSignatureModal(): void {
    this.showSignatureModal = false;
    this.currentAsignacionForPDF = null;
    this.signatures = {};
    this.activeSignatureSlot = '';
    this.currentPreviewImage = null;
    this.isCanvasDirty = false;
    this.isDrawing = false;
    this.canvasCtx = null;
  }

  async selectSignatureSlot(slot: string): Promise<void> {
    if (this.activeSignatureSlot && this.activeSignatureSlot !== slot && this.isCanvasDirty) {
      const result = await Swal.fire({
        title: 'Firma sin guardar',
        text: '¿Deseas guardar la firma actual antes de cambiar de sección?',
        icon: 'warning',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        denyButtonText: 'Descartar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        this.saveCurrentSignature(true);
      } else if (!result.isDenied) {
        // Si no seleccionó descartar (es decir, seleccionó cancelar o clickeó fuera)
        return;
      }
    }

    this.activeSignatureSlot = slot;
    this.cdr.detectChanges();
    setTimeout(() => this.initCanvas(), 50);
  }

  private initCanvas(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    this.canvasCtx = canvas.getContext('2d');
    if (this.canvasCtx) {
      this.canvasCtx.strokeStyle = '#1a1a2e';
      this.canvasCtx.lineWidth = 1.0;
      this.canvasCtx.lineCap = 'round';
      this.canvasCtx.lineJoin = 'round';
      this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      if (this.signatures[this.activeSignatureSlot]) {
        const sigImg = new Image();
        sigImg.src = this.signatures[this.activeSignatureSlot];
        this.currentPreviewImage = this.signatures[this.activeSignatureSlot];
        sigImg.onload = () => {
          this.canvasCtx?.drawImage(sigImg, 0, 0);
          this.isCanvasDirty = false;
        };
      } else {
        this.currentPreviewImage = null;
        this.isCanvasDirty = false;
      }
    }
  }

  startDrawing(event: PointerEvent): void {
    if (!this.canvasCtx) return;
    this.isDrawing = true;
    this.isCanvasDirty = true;
    const canvas = this.signatureCanvas.nativeElement;
    canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(x, y);
    if (event.pressure && event.pressure > 0) {
      this.canvasCtx.lineWidth = Math.max(0.2, event.pressure * 2);
    } else {
      this.canvasCtx.lineWidth = 1.0;
    }
  }

  draw(event: PointerEvent): void {
    if (!this.isDrawing || !this.canvasCtx) return;
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    if (event.pressure && event.pressure > 0) {
      this.canvasCtx.lineWidth = Math.max(0.2, event.pressure * 2);
    } else {
      this.canvasCtx.lineWidth = 1.0;
    }
    this.canvasCtx.lineTo(x, y);
    this.canvasCtx.stroke();
  }

  stopDrawing(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.updatePreview();
  }

  clearSignature(): void {
    if (!this.canvasCtx || !this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    this.isCanvasDirty = false;
    this.updatePreview();
  }

  updatePreview(): void {
    if (!this.signatureCanvas) return;
    this.currentPreviewImage = this.signatureCanvas.nativeElement.toDataURL('image/png');
  }

  saveCurrentSignature(silent: boolean = false): void {
    if (!this.signatureCanvas || !this.activeSignatureSlot) return;
    const canvas = this.signatureCanvas.nativeElement;
    this.signatures[this.activeSignatureSlot] = canvas.toDataURL('image/png');
    this.isCanvasDirty = false;
    if (!silent) {
      Swal.fire({ icon: 'success', title: 'Firma guardada', text: `Firma de "${this.getSlotLabel(this.activeSignatureSlot)}" guardada.`, timer: 1500, showConfirmButton: false });
    }
    this.cdr.detectChanges();
  }

  removeSignature(): void {
    if (!this.activeSignatureSlot) return;
    delete this.signatures[this.activeSignatureSlot];
    this.clearSignature();
    this.cdr.detectChanges();
  }

  getSlotLabel(slot: string): string {
    const labels: { [key: string]: string } = {
      'recibi': 'Recibí de Conformidad',
      'coordinador': 'Coordinador de Almacén',
      'vigilancia': 'Vigilancia',
      'chofer': 'Chofer'
    };
    return labels[slot] || slot;
  }

  generateSignedPDF(): void {
    if (!this.currentAsignacionForPDF) return;
    
    // Auto-guardado de la firma actual antes de generar el PDF
    if (this.isCanvasDirty && this.activeSignatureSlot) {
      this.saveCurrentSignature(true);
    }
    
    const asignacion = this.currentAsignacionForPDF;
    const sigs = { ...this.signatures };
    //this.closeSignatureModal();
    this.generatePDF(asignacion, sigs);
  }
}

