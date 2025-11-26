import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ObraService, Obra } from '../../services/obra.service';
import Swal from 'sweetalert2';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
    selector: 'app-obras',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule
    ],
    templateUrl: './obras.html',
    styleUrl: './obras.scss',
    
})
export class ObrasComponent implements OnInit, AfterViewInit {
    obras: Obra[] = [];
    isLoading = false;
    showModal = false;
    isEditing = false;
    editingId: string | null = null;
    form: FormGroup;
    errorMessage = '';

    generalFilter = '';
    strStatus = '';

    displayedColumns: string[] = ['numero_contrato', 'nombre_obra', 'estatus', 'acciones'];
    dataSource = new MatTableDataSource<Obra>();

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    changeDetection: ChangeDetectionStrategy.OnPush = ChangeDetectionStrategy.OnPush;

    constructor(
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        private obraService: ObraService
    ) {
        this.form = this.fb.group({
            numero_contrato: ['', Validators.required],
            nombre_obra: ['', Validators.required],
            estatus: ['ALTA', Validators.required]
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
        this.obraService.getAll().subscribe({
            next: (data) => {
                this.obras = data;
                this.dataSource.data = data;
                this.isLoading = false;
                console.log(this.obras)
                // Re-asignar paginator y sort si es necesario
                setTimeout(() => {
                    if (this.paginator) this.dataSource.paginator = this.paginator;
                    if (this.sort) this.dataSource.sort = this.sort;
                });

                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading obras', error);
                this.errorMessage = error.message || 'Error al cargar obras';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openCreateModal(): void {
        this.isEditing = false;
        this.editingId = null;
        this.form.reset({
            numero_contrato: '',
            nombre_obra: '',
            estatus: 'ALTA'
        });
        this.showModal = true;
        this.errorMessage = '';
    }

    openEditModal(obra: Obra): void {
        this.isEditing = true;
        this.editingId = obra._id || obra.id || null;
        this.form.reset({
            numero_contrato: obra.numero_contrato,
            nombre_obra: obra.nombre_obra,
            estatus: obra.estatus
        });
        this.showModal = true;
        this.errorMessage = '';
    }

    closeModal(): void {
        this.showModal = false;
        this.form.reset();
        this.errorMessage = '';
    }

    saveObra(): void {
        if (this.form.valid) {
            this.isLoading = true;
            this.errorMessage = '';

            const obraData: Obra = this.form.value;

            if (!this.isEditing) {
                this.obraService.create(obraData).subscribe({
                    next: () => {
                        this.loadData();
                        this.closeModal();
                        Swal.fire('Éxito', 'Obra creada correctamente', 'success');
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.errorMessage = error.error?.message || error.message || 'Error al crear obra';
                        this.cdr.detectChanges();
                    }
                });
            } else {
                if (!this.editingId) return;

                this.obraService.update(this.editingId, obraData).subscribe({
                    next: () => {
                        this.loadData();
                        this.closeModal();
                        Swal.fire('Éxito', 'Obra actualizada correctamente', 'success');
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.errorMessage = error.error?.message || error.message || 'Error al actualizar obra';
                        this.cdr.detectChanges();
                    }
                });
            }
        } else {
            this.form.markAllAsTouched();
            this.errorMessage = 'Por favor, completa todos los campos requeridos.';
        }
    }

    delete(obra: Obra): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas dar de baja la obra ${obra.nombre_obra}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.isLoading = true;
                const id = obra._id || obra.id;
                if (!id) return;

                this.obraService.delete(id).subscribe({
                    next: () => {
                        this.loadData();
                        Swal.fire('Eliminado', 'La obra ha sido dada de baja.', 'success');
                    },
                    error: (error) => {
                        this.isLoading = false;
                        Swal.fire('Error', error.message || 'No se pudo dar de baja la obra', 'error');
                        this.cdr.detectChanges();
                    }
                });
            }
        });
    }

    applyGeneralFilter(event: Event) {
        const value = (event.target as HTMLInputElement).value.toLowerCase();
        this.generalFilter = value;
        this.updateFilter();
    }

    applyStatusFilter(event: Event) {
        const value = (event.target as HTMLSelectElement).value; // No toLowerCase here to match exact values if needed, but predicate handles it
        this.strStatus = value;
        this.updateFilter();
    }

    updateFilter() {
        this.dataSource.filter = JSON.stringify({
            general: this.generalFilter,
            status: this.strStatus
        });
    }

    customFilterPredicate() {
        return (data: Obra, filter: string): boolean => {
            const parsed = JSON.parse(filter);

            const matchesStatus = !parsed.status || (data.estatus === parsed.status);

            const matchesGeneral = !parsed.general ||
                (data.numero_contrato.toLowerCase().includes(parsed.general) ||
                    data.nombre_obra.toLowerCase().includes(parsed.general));

            return matchesStatus && matchesGeneral;
        };
    }
}
