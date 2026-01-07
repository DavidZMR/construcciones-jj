import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
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
  isEditing = false;
  editingId: string | null = null;

  form: FormGroup;
  returnForm: FormGroup;
  reportForm: FormGroup;
  errorMessage = '';

  generalFilter = ''
  strStatus = ''

  displayedColumns: string[] = ['fechaAsignacion', 'empleado', 'obra', 'maquinaria', 'estado', 'fechaDevolucion', 'acciones'];
  dataSource = new MatTableDataSource<Asignacion>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
      machineryEquipment: [[], Validators.required]
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
    this.reportForm.reset({ machineryEquipment: [] });
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
      },
      error: (error) => {
        console.error('Error loading assigned machinery', error);
        this.errorMessage = 'Error al cargar maquinaria asignada';
      }
    });
  }

  generateReportPDF(): void {
    if (this.reportForm.valid) {
      const selectedIds = this.reportForm.get('machineryEquipment')?.value;

      if (!selectedIds || selectedIds.length === 0) {
        this.errorMessage = 'Debe seleccionar al menos un equipo';
        return;
      }

      const selectedItems = this.assignedMachinery.filter(item => selectedIds.includes(item.id));

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

            // Table
            const body = selectedItems.map(item => [
              item.code || '-',
              item.name || '-',
              item.assigned_to?.person_name || '-',
              item.project?.project_name || 'Sin obra asignada',
              item.assigned_quantity || 0,
              item.returned_quantity || 0
            ]);

            (autoTable as any).default(doc, {
              startY: 30,
              head: [['Código', 'Nombre', 'Asignado a', 'Obra', 'C. Asig.', 'C. Dev.']],
              body: body,
              theme: 'grid',
              headStyles: { fillColor: [220, 53, 69] }, // Brand color red? Or just standard grey
              styles: { fontSize: 10 }
            });

            doc.save(`Reporte_Maquinaria_Asignada_${now.getTime()}.pdf`);
            this.closeModal();
            Swal.fire('Éxito', 'Reporte generado correctamente', 'success');
          };

          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const pngDataUrl = canvas.toDataURL('image/png');
              doc.addImage(pngDataUrl, 'PNG', 15, 10, 30, 12); // Adjust logo position/size
            }
            drawPDFContent();
          };

          img.onerror = () => {
            // Generated without logo
            drawPDFContent();
          };

          // Trigger image load if not cached, otherwise it might be instant
          if (img.complete) {
            img.onload!(new Event('load'));
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

  generatePDF(asignacion: Asignacion) {
    import('jspdf').then(jsPDF => {
      import('jspdf-autotable').then(autoTable => {
        const doc = new jsPDF.default();

        // Folio
        const now = new Date();
        const folio = `ASG-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

        // Logo
        const logoUrl = 'assets/images/logo.svg';
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => {
          // Create canvas to convert SVG to PNG
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL('image/png');
            // Add logo as PNG (smaller size)
            doc.addImage(pngDataUrl, 'PNG', 15, 10, 35, 14);
          }

          // Header - Calibri Bold
          doc.setFontSize(11);
          doc.setFont('times', 'bold'); // jsPDF no tiene Calibri, usamos Times como alternativa
          const pageWidth = doc.internal.pageSize.width;
          doc.text('CONSTRUCCIONES J.J. S.A. DE C.V.', pageWidth / 2, 16, { align: 'center' });

          doc.setFontSize(11);
          doc.setFont('times', 'normal'); // Calibri Light simulado con Times normal
          doc.text('ASIGNACIÓN DE MAQUINARIA Y EQUIPO', pageWidth / 2, 23, { align: 'center' });

          doc.setFontSize(11);
          doc.setTextColor(220, 53, 69); // Red color for folio
          doc.text(`FOLIO: ${folio}`, 155, 16);
          doc.setTextColor(0, 0, 0); // Reset color

          // Info Section
          doc.setFontSize(11);
          doc.text(`FECHA: ${new Date(asignacion.fechaAsignacion).toLocaleDateString()}`, 155, 23);

          doc.setLineWidth(0.5);
          doc.line(15, 30, 195, 30);

          // Datos del empleado - Calibri Bold para títulos
          doc.setFont('times', 'bold');
          doc.text('DATOS DEL EMPLEADO:', 15, 38);
          doc.setFont('times', 'normal');
          doc.text((asignacion.empleado as any).nombre || '', 64, 38);

          doc.setFont('times', 'bold');
          doc.text('OBRA:', 15, 45);
          doc.setFont('times', 'normal');
          doc.text(this.getObraNombre(asignacion), 64, 45);

          // Table
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
              fillColor: [200, 200, 200], // Gris
              textColor: [0, 0, 0], // Negro
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 11
            },
            styles: {
              fontSize: 11,
              halign: 'center',
              valign: 'middle'
            },
            columnStyles: {
              1: { halign: 'left' }, // Descripción alineada a la izquierda
              3: { halign: 'left' }  // Observaciones alineadas a la izquierda
            }
          });

          const finalY = (doc as any).lastAutoTable.finalY + 10;

          // Legal Text - Justificado
          doc.setFontSize(11);
          doc.setFont('times', 'normal');
          const legalText = "ESTOY DE ACUERDO EN DEVOLVER EL EQUIPO DE PROTECCIÓN PERSONAL, HERRAMIENTA Y MAQUINARIA EN BUENAS CONDICIONES, CONSIDERANDO EL DESGASTE POR USO RAZONABLE AL ALMACÉN DE CONSTRUCCIONES JJ UNA VEZ TERMINADOS MIS TRABAJOS CON DONDE LOS NECESITE. SI NO FUESE DE ESTA MANERA, ES DECIR, QUE DIERA MAL USO, LA EMPRESA DEBERÁ DESCONTAR DE MI SALARIO EL VALOR DE REPARACIÓN O EN SU CASO EL VALOR DE REPOSICIÓN. (ART. 110-1 LFT)";

          const splitText = doc.splitTextToSize(legalText, 180);
          doc.text(splitText, 15, finalY, { align: 'justify', maxWidth: 180 });

          // Signatures
          // Calculate start Y. Ensure we have enough space, otherwise add page?
          // For simplicity, we assume one page for now or autoTable handled breaks.
          // We need about 60-70 units for 2 rows of signatures.

          let signatureY = finalY + 50;

          // Check if we are too close to bottom (A4 is ~297mm)
          if (signatureY + 60 > 280) {
            doc.addPage();
            signatureY = 40;
          }

          doc.setLineWidth(0.2);
          doc.setFont('times', 'normal');
          doc.setFontSize(11);

          // Row 1
          // Signature 1: Recibí (Left)
          doc.line(25, signatureY, 85, signatureY);
          doc.text('RECIBÍ DE CONFORMIDAD', 55, signatureY + 5, { align: 'center' });
          const nombreEmpleado = (asignacion.empleado as any).nombre || '';
          // Truncate or split if too long? For now just print.
          doc.setFontSize(10);
          doc.text(nombreEmpleado, 55, signatureY + 10, { align: 'center' });
          doc.setFontSize(11);

          // Signature 2: Coordinador (Right)
          doc.line(125, signatureY, 185, signatureY);
          doc.text('COORDINADOR DE ALMACÉN', 155, signatureY + 5, { align: 'center' });

          // Row 2
          const signatureY2 = signatureY + 35;

          // Signature 3: Vigilancia (Left)
          doc.line(25, signatureY2, 85, signatureY2);
          doc.text('VIGILANCIA', 55, signatureY2 + 5, { align: 'center' });

          // Signature 4: Chofer (Right)
          doc.line(125, signatureY2, 185, signatureY2);
          doc.text('CHOFER', 155, signatureY2 + 5, { align: 'center' });

          // Footer
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(11);
          doc.setTextColor(100, 100, 100);

          // Número de formato a la derecha
          doc.setFont('times', 'bold');
          doc.text('F-610-7.1', 194, pageHeight - 15, { align: 'right' });

          // Texto legal
          doc.setFont('times', 'normal');
          const footerText = "ESTE DOCUMENTO CONTIENE INFORMACIÓN PROPIEDAD DE CONSTRUCCIONES J.J. S.A. DE C.V. CONSIDERADA DE USO INTERNO. CUALQUIER DISTRIBUCION O REPRODUCCIÓN SERÁ BAJO AUTORIZACIÓN ESPECÍFICA.";
          const splitFooter = doc.splitTextToSize(footerText, 180);
          doc.text(splitFooter, pageWidth / 2, pageHeight - 10, { align: 'center' });

          doc.save(`Asignacion_${folio}.pdf`);
        };
        img.onerror = () => {
          console.error('Error loading logo');
          // Fallback without logo or handle error
          doc.save(`Asignacion_${folio}.pdf`);
        }
      });
    });
  }
}
