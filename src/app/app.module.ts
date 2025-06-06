import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module'; // Додаємо маршрути
import { HttpClientModule } from '@angular/common/http'; // Для HTTP-запитів
import { AppComponent } from './app.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { DemoNgZorroAntdModule } from './DemoNgZorroAntd.module';
import { AuthFormComponent } from './auth-form/auth-form.component';
import { GuestPageComponent } from './guest-page/guest-page.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { IncomeComponent } from './income/income.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ExpenseComponent } from './expense/expense.component';
import { ReportsComponent } from './reports/reports.component';




registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    AuthFormComponent,
    GuestPageComponent,
    RegisterFormComponent,
    DashboardComponent,
    IncomeComponent,
    SidebarComponent,
    ExpenseComponent,
    ReportsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    DemoNgZorroAntdModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    provideClientHydration(),
    { provide: NZ_I18N, useValue: en_US },
    provideAnimationsAsync(),
    provideHttpClient()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
