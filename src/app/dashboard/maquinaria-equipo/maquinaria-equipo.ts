import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/api-response.interface';
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
export class MaquinariaEquipo {
  users: any[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  editing: any | null = null;
  form: FormGroup;
  errorMessage = '';

  displayedColumns: string[] = ['username', 'email', 'rol', 'acciones'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      rol: ['usuario', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  loadData(): void {
    // this.isLoading = true;

    // this.userService.getUsers().subscribe({
    //   next: (users) => {
    //     this.users = users;
    //     this.dataSource = new MatTableDataSource(users);

    //     // reasignar paginator y sort DESPUÉS de crear el dataSource
    //     setTimeout(() => {
    //       this.dataSource.paginator = this.paginator;
    //       this.dataSource.sort = this.sort;
    //     });

    //     this.isLoading = false;
    //     this.cdr.detectChanges();
    //   },
    //   error: (error) => {
    //     this.errorMessage = error.message || 'Error al cargar usuarios';
    //     this.isLoading = false;
    //   }
    // });
  }


  openCreateModal(): void {
    this.isEditing = false;
    this.editing = null;
    this.form.reset({
      username: '',
      email: '',
      password: '',
      rol: 'usuario'
    });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.showModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  openEditModal(user: any): void {
    this.isEditing = true;
    this.editing = user;
    this.form.reset({
      username: user.username,
      email: user.email,
      password: '',
      rol: user.rol
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
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

  saveUser(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const userData = this.form.value;

      if (!this.isEditing) {
        // Crear nuevo usuario
        // this.userService.createUser(userData).subscribe({
        //   next: () => {
        //     this.loadData();
        //     this.closeModal();
        //     this.isLoading = false;
        //     this.cdr.detectChanges();
        //   },
        //   error: (error) => {
        //     this.isLoading = false;
        //     this.errorMessage = error.message || 'Error al crear usuario';
        //     this.cdr.detectChanges();
        //   }
        // });
      } else {
        // Actualizar usuario
        const updateData: any = {
          username: userData.username,
          email: userData.email,
          rol: userData.rol
        };

        if (userData.password) {
          updateData.password = userData.password;
        }

        // this.userService.updateUser(this.editingUser!._id || this.editingUser!.id!, updateData).subscribe({
        //   next: () => {
        //     this.loadData();
        //     this.closeModal();
        //     this.isLoading = false;
        //     this.cdr.detectChanges();
        //   },
        //   error: (error) => {
        //     this.isLoading = false;
        //     this.errorMessage = error.message || 'Error al actualizar usuario';
        //     this.cdr.detectChanges();
        //   }
        // });
      }
    } else {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }

  delete(user: any): void {
    // Swal.fire({
    //   title: 'Confirmar eliminación',
    //   text: `¿Estás seguro de que deseas eliminar al usuario ${user.username}?`,
    //   icon: 'warning',
    //   showCancelButton: true,
    //   confirmButtonText: 'Sí, eliminar',
    //   cancelButtonText: 'Cancelar'
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     this.isLoading = true;
    //     this.userService.deleteUser(user._id || user.id!).subscribe({
    //       next: () => {
    //         this.loadData();
    //         this.isLoading = false;
    //         this.cdr.detectChanges();
    //       },
    //       error: (error) => {
    //         this.isLoading = false;
    //         this.cdr.detectChanges();
    //         alert(error.message || 'Error al eliminar usuario');
    //       }
    //     });
    //   }
    // })
  }
  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
