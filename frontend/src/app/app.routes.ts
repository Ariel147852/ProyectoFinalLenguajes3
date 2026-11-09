import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { CatalogComponent } from './features/tools/catalog/catalog';
import { ToolDetailComponent } from './features/tools/tool-detail/tool-detail';
import { ToolFormComponent } from './features/tools/tool-form/tool-form';
import { MapViewComponent } from './features/map/map-view/map-view';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { LoanDashboardComponent } from './features/loans/loan-dashboard/loan-dashboard';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'map', component: MapViewComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'tools/new', component: ToolFormComponent, canActivate: [authGuard] },
  { path: 'tools/:id', component: ToolDetailComponent },
  { path: 'loans', component: LoanDashboardComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: '' }
];
