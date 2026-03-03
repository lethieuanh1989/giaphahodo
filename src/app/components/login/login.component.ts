import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  @Output() loginSuccess = new EventEmitter<string>();
  @Output() goToRegister = new EventEmitter<void>();

  phone = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  canSubmit(): boolean {
    return this.phone.trim().length > 0 && this.password.length > 0;
  }

  submit(): void {
    if (!this.canSubmit() || this.loading) return;
    this.errorMessage = '';
    this.loading = true;
    this.loginSuccess.emit(`${this.phone.trim()}|||${this.password}`);
  }

  onLoginError(msg: string): void {
    this.loading = false;
    this.errorMessage = msg;
  }

  onLoginDone(): void {
    this.loading = false;
  }

  goRegister(): void {
    this.goToRegister.emit();
  }
}
