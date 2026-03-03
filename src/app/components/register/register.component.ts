import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  @Output() registerSuccess = new EventEmitter<void>();
  @Output() goToLogin = new EventEmitter<void>();
  @Output() doRegister = new EventEmitter<{ hoTen: string; phone: string; password: string }>();

  hoTen = '';
  phone = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  canSubmit(): boolean {
    return this.hoTen.trim().length > 0
      && this.phone.trim().length > 0
      && this.password.length >= 6;
  }

  submit(): void {
    if (!this.canSubmit() || this.loading) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.doRegister.emit({
      hoTen: this.hoTen.trim(),
      phone: this.phone.trim(),
      password: this.password,
    });
  }

  onRegisterError(msg: string): void {
    this.loading = false;
    this.errorMessage = msg;
  }

  onRegisterDone(): void {
    this.loading = false;
    this.successMessage = '\u0110\u0103ng k\u00FD th\u00E0nh c\u00F4ng! Vui l\u00F2ng \u0111\u0103ng nh\u1EADp.';
    // Quay lại login sau 1.5s
    setTimeout(() => {
      this.registerSuccess.emit();
    }, 1500);
  }

  goLogin(): void {
    this.goToLogin.emit();
  }
}
