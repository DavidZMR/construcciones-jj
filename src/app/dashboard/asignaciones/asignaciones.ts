import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsignacionService } from '../../services/asignacion.service';
import { EmpleadoService } from '../../services/empleado.service';
import { MaquinariaEquipoService } from '../../services/maquinaria-equipo.service';
import { ObraService, Obra } from '../../services/obra.service';
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
  obras: Obra[] = [];

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
      maquinaria: [[], Validators.required],
      obra: [''],
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

    // Cargar obras activas
    this.obraService.getAll().subscribe({
      next: (data) => {
        this.obras = data.sort((a, b) => a.nombre_obra.localeCompare(b.nombre_obra)).filter(o => o.estatus === 'ALTA');
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
      obra: '',
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
      obra: asignacion.obra ? (asignacion.obra._id || asignacion.obra.id || asignacion.obra) : '',
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
            // Add logo as PNG (Wider to avoid deformation)
            doc.addImage(pngDataUrl, 'PNG', 15, 10, 50, 20);
          }

          // Header
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('CONSTRUCCIONES J.J. S.A. DE C.V.', 70, 20);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('ASIGNACIÓN DE MAQUINARIA Y EQUIPO', 70, 28);


          doc.setFontSize(10);
          doc.setTextColor(220, 53, 69); // Red color for folio
          doc.text(`FOLIO: ${folio}`, 155, 30);
          doc.setTextColor(0, 0, 0); // Reset color

          // Info Section
          doc.setFontSize(10);
          doc.text(`FECHA: ${new Date(asignacion.fechaAsignacion).toLocaleDateString()}`, 155, 38);

          doc.setLineWidth(0.5);
          doc.line(15, 45, 195, 45);

          doc.setFont('helvetica', 'bold');
          doc.text('DATOS DEL EMPLEADO:', 15, 55);
          doc.setFont('helvetica', 'normal');
          doc.text((asignacion.empleado as any).nombre || '', 60, 55);

          doc.setFont('helvetica', 'bold');
          doc.text('OBRA:', 15, 62);
          doc.setFont('helvetica', 'normal');
          doc.text(this.getObraNombre(asignacion), 60, 62);

          // Table
          const machineryData = (asignacion.maquinaria as any[]).map(m => [m.codigo, m.nombre]);

          (autoTable as any).default(doc, {
            startY: 70,
            head: [['CÓDIGO', 'DESCRIPCIÓN']],
            body: machineryData,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80], textColor: 255 },
            styles: { fontSize: 9 }
          });

          const finalY = (doc as any).lastAutoTable.finalY + 10;

          // Legal Text
          doc.setFontSize(8);
          const legalText = "ESTOY DE ACUERDO EN DEVOLVER EL EQUIPO DE PROTECCIÓN PERSONAL, HERRAMIENTA Y MAQUINARIA EN BUENAS CONDICIONES, CONSIDERANDO EL DESGASTE POR USO RAZONABLE AL ALMACÉN DE CONSTRUCCIONES JJ UNA VEZ TERMINADOS MIS TRABAJOS CON DONDE LOS NECESITE. SI NO FUESE DE ESTA MANERA, ES DECIR, QUE DIERA MAL USO, LA EMPRESA DEBERÁ DESCONTAR DE MI SALARIO EL VALOR DE REPARACIÓN O EN SU CASO EL VALOR DE REPOSICIÓN. (ART. 110-1 LFT)";

          const splitText = doc.splitTextToSize(legalText, 180);
          doc.text(splitText, 15, finalY);

          // Signatures
          const signatureY = finalY + 40;

          doc.setLineWidth(0.2);
          // Signature 1
          doc.line(20, signatureY, 70, signatureY);
          doc.text('RECIBÍ DE CONFORMIDAD', 25, signatureY + 5);
          doc.text((asignacion.empleado as any).nombre || '', 25, signatureY + 10);

          // Signature 2
          doc.line(80, signatureY, 130, signatureY);
          doc.text('COORDINADOR DE ALMACÉN', 85, signatureY + 5);

          // Signature 3
          doc.line(140, signatureY, 190, signatureY);
          doc.text('VIGILANCIA', 155, signatureY + 5);

          // Footer
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          const footerText = "ESTE DOCUMENTO CONTIENE INFORMACIÓN PROPIEDAD DE CONSTRUCCIONES J.J. S.A. DE C.V. DE C.V. CONSIDERADA DE USO INTERNO. CUALQUIER DISTRIBUCION O REPRODUCCIÓN SERÁ BAJO AUTORIZACIÓN ESPECÍFICA.";
          const splitFooter = doc.splitTextToSize(footerText, 180);
          doc.text(splitFooter, 15, pageHeight - 10);

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
