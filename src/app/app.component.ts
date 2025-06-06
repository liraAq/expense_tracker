import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'expenceTrackerWeb';
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cdr.detectChanges(); // Викликаємо вручну для детекції змін
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  
}
