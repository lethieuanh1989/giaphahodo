// Copy file này thành environment.ts và environment.prod.ts, điền giá trị thực
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  },
  allowedEmails: [
    // Thêm email được phép đăng nhập vào đây
  ],
};
