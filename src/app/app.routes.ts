import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { UsuariosComponent } from './dashboard/usuarios/usuarios';
import { authGuard } from './guards/auth.guard';
import { Empleados } from './dashboard/empleados/empleados';
import { MaquinariaEquipoComponent } from './dashboard/maquinaria-equipo/maquinaria-equipo';
import { Asignaciones } from './dashboard/asignaciones/asignaciones';
import { ObrasComponent } from './dashboard/obras/obras';

export const routes: Routes = [
    { path: 'login', component: Login },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
            { path: 'usuarios', component: UsuariosComponent },
            { path: 'empleados', component: Empleados },
            { path: 'maquinaria-equipo', component: MaquinariaEquipoComponent },
            { path: 'asignaciones', component: Asignaciones },
            { path: 'obras', component: ObrasComponent }
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' },
];
