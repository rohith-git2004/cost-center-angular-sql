import { Routes } from '@angular/router';
import { CostCenterComponent } from './cost-center.component';
export const routes: Routes = [{path:'', component:CostCenterComponent}, {path:'**', redirectTo:''}];
