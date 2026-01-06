import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { WorkOrdersComponent } from './components/work-orders/work-orders.component';
import { QuotesComponent } from './components/quotes/quotes.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { PurchasingComponent } from './components/purchasing/purchasing.component';
import { EgresoBodegaComponent } from './components/egreso-bodega/egreso-bodega.component';
import { ClientFilesComponent } from './components/client-files/client-files.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { HrComponent } from './components/hr/hr.component';
import { AccountingComponent } from './components/accounting/accounting.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ProveedoresComponent } from './components/proveedores/proveedores.component';
import { WorkersComponent } from './components/workers/workers.component';
import { LoginComponent } from './components/login/login.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'gerente', 'bodeguero', 'contador'] }
    },
    {
        path: 'work-orders',
        component: WorkOrdersComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor'] }
    },
    {
        path: 'quotes',
        component: QuotesComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor'] }
    },
    {
        path: 'inventory',
        component: InventoryComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'bodeguero'] }
    },
    {
        path: 'purchasing',
        component: PurchasingComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor'] }
    },
    {
        path: 'egreso-bodega',
        component: EgresoBodegaComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'bodeguero'] }
    },
    {
        path: 'client-files',
        component: ClientFilesComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor'] }
    },
    {
        path: 'schedule',
        component: ScheduleComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'operativo', 'trabajador', 'operador'] }
    },
    {
        path: 'hr',
        component: HrComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'operativo', 'trabajador', 'operador', 'gerente', 'bodeguero', 'contador'] }
    },
    {
        path: 'accounting',
        component: AccountingComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'contador'] }
    },
    {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'gerente'] }
    },
    {
        path: 'proveedores',
        component: ProveedoresComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor'] }
    },
    {
        path: 'workers',
        component: WorkersComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor'] }
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
