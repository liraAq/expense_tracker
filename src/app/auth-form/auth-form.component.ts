import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth-service.service';

@Component({
  selector: 'app-auth-form',
  templateUrl: './auth-form.component.html',
  styleUrls: ['./auth-form.component.scss']
})
export class AuthFormComponent implements OnInit {
  
  loginForm = this.formBuilder.group({
    username: ['', Validators.required], // username = email
    password: ['', Validators.required]
  });

  submitted = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {}

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    const { username, password } = this.loginForm.value;

    this.authService.login(username!, password!).subscribe(
      response => {
        localStorage.setItem('jwt', response.token);
        console.log('Login successful, token:', response.token);
        this.router.navigate(['/dashboard']); // Перехід на головну панель
      },
      error => {
        this.errorMessage = error.error?.message || 'Invalid credentials';
        console.error('Login failed:', this.errorMessage);
      }
    );
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
