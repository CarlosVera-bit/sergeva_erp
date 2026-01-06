import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  authService = inject(AuthService);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private fb = inject(FormBuilder);

  // FIX: Injected FormBuilder as a class property `fb` and used it to create the form group.
  // This resolves the type inference issue where `inject(FormBuilder)` was being treated as `unknown`.
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async login() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email!, password!);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
