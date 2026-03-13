import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/api-response.interface';
import Swal from 'sweetalert2';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';


@Component({
  selector: 'app-usuarios',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class UsuariosComponent implements OnInit, AfterViewInit {
  users: User[] = [];
  isLoading = false;
  showModal = false;
  showReportModal = false;
  reportErrorMessage = '';
  isEditing = false;
  editingUser: User | null = null;
  userForm: FormGroup;
  errorMessage = '';

  generalFilter = '';
  strRol = '';
  uniqueRoles: string[] = [];

  changeDetection: ChangeDetectionStrategy.OnPush = ChangeDetectionStrategy.OnPush;
  

  displayedColumns: string[] = ['username', 'email', 'rol', 'acciones'];
  dataSource = new MatTableDataSource<User>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      rol: ['usuario', Validators.required]
    });

    this.reportForm = this.fb.group({
      rol: [''],
      search: ['']
    });
  }

  reportForm: FormGroup;

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.customFilterPredicate();
  }


  loadUsers(): void {
    this.isLoading = true;

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.dataSource = new MatTableDataSource(users);
        this.extractUniqueRoles();
        this.dataSource.filterPredicate = this.customFilterPredicate();

        // reasignar paginator y sort DESPUÉS de crear el dataSource
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al cargar usuarios';
        this.isLoading = false;
      }
    });
  }


  openCreateModal(): void {
    this.isEditing = false;
    this.editingUser = null;
    this.userForm.reset({
      username: '',
      email: '',
      password: '',
      rol: 'usuario'
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  openEditModal(user: User): void {
    this.isEditing = true;
    this.editingUser = user;
    this.userForm.reset({
      username: user.username,
      email: user.email,
      password: '',
      rol: user.rol
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.userForm.reset();
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  saveUser(): void {
    if (this.userForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const userData = this.userForm.value;

      if (!this.isEditing) {
        // Crear nuevo usuario
        this.userService.createUser(userData).subscribe({
          next: () => {
            this.loadUsers();
            this.closeModal();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al crear usuario';
            this.cdr.detectChanges();
          }
        });
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

        this.userService.updateUser(this.editingUser!._id || this.editingUser!.id!, updateData).subscribe({
          next: () => {
            this.loadUsers();
            this.closeModal();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Error al actualizar usuario';
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }

  deleteUser(user: User): void {
    Swal.fire({
      title: 'Confirmar eliminación',
      text: `¿Estás seguro de que deseas eliminar al usuario ${user.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.userService.deleteUser(user._id || user.id!).subscribe({
          next: () => {
            this.loadUsers();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false;
            this.cdr.detectChanges();
            alert(error.message || 'Error al eliminar usuario');
          }
        });
      }
    })
  }
  extractUniqueRoles() {
    const roles = new Set<string>();
    this.users.forEach(u => {
      if (u.rol) roles.add(u.rol);
    });
    this.uniqueRoles = Array.from(roles).sort();
  }

  applyGeneralFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.generalFilter = value;
    this.dataSource.filter = JSON.stringify({
      general: value,
      rol: this.strRol || ''
    });
  }

  applyRolFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value.toLowerCase();
    this.strRol = value;
    this.dataSource.filter = JSON.stringify({
      general: this.generalFilter || '',
      rol: value
    });
  }

  customFilterPredicate() {
    return (data: any, filter: string): boolean => {
      const parsed = JSON.parse(filter);

      const matchesRol =
        !parsed.rol || (data.rol && data.rol.toLowerCase().includes(parsed.rol));

      const matchesGeneral =
        !parsed.general ||
        Object.values(data)
          .join(' ')
          .toLowerCase()
          .includes(parsed.general);

      return matchesRol && matchesGeneral;
    };
  }

  openReportModal(): void {
    this.reportForm.reset({ rol: '', search: '' });
    this.showReportModal = true;
    this.reportErrorMessage = '';
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportForm.reset();
    this.reportErrorMessage = '';
  }

  generateReportPDF(): void {
    const filterRol = (this.reportForm.get('rol')?.value || '').toLowerCase();
    const filterSearch = (this.reportForm.get('search')?.value || '').toLowerCase();

    let filteredUsers = [...this.users];

    if (filterRol) {
      filteredUsers = filteredUsers.filter(u => u.rol && u.rol.toLowerCase() === filterRol);
    }

    if (filterSearch) {
      filteredUsers = filteredUsers.filter(u =>
        (u.username || '').toLowerCase().includes(filterSearch) ||
        (u.email || '').toLowerCase().includes(filterSearch) ||
        (u.rol || '').toLowerCase().includes(filterSearch)
      );
    }

    if (filteredUsers.length === 0) {
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

          // Title
          doc.setFontSize(14);
          doc.setFont('times', 'bold');
          doc.text('Reporte de Usuarios', pageWidth / 2, 20, { align: 'center' });

          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          doc.text(`Fecha: ${docDate}`, pageWidth - 15, 20, { align: 'right' });

          // Filters applied info
          let infoY = 28;
          doc.setFontSize(9);
          if (filterRol) {
            doc.text(`Filtro Rol: ${filterRol}`, 15, infoY);
            infoY += 5;
          }
          if (filterSearch) {
            doc.text(`Búsqueda: ${filterSearch}`, 15, infoY);
            infoY += 5;
          }
          doc.text(`Total: ${filteredUsers.length} usuario(s)`, 15, infoY);
          infoY += 5;

          // Table
          const body = filteredUsers.map(u => [
            u.username || '-',
            u.email || '-',
            u.rol || '-'
          ]);

          (autoTable as any).default(doc, {
            startY: infoY + 3,
            head: [['Usuario', 'Email', 'Rol']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69] },
            styles: { fontSize: 10 }
          });

          doc.save(`Reporte_Usuarios_${now.getTime()}.pdf`);
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

