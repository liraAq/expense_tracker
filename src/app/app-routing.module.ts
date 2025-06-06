import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthFormComponent } from './auth-form/auth-form.component';
import { AppComponent } from './app.component';
import { GuestPageComponent } from './guest-page/guest-page.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { IncomeComponent } from './income/income.component';
import { ExpenseComponent } from './expense/expense.component';
import { ReportsComponent } from './reports/reports.component';


const routes: Routes = [
  { path: '', component: GuestPageComponent },     // Головна сторінка
  { path: 'login', component: AuthFormComponent },
  { path: 'register', component: RegisterFormComponent},
  { path: 'dashboard', component: DashboardComponent},
  { path: 'income', component: IncomeComponent },
  { path: 'expense', component: ExpenseComponent },
  { path: 'reports', component: ReportsComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


