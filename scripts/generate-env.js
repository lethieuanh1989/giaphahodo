/**
 * Script chạy trước ng build trên Render.
 * Đọc biến môi trường và tạo file environment.ts + environment.prod.ts
 *
 * Render Environment Variables cần set:
 *   FIREBASE_API_KEY
 *   FIREBASE_AUTH_DOMAIN
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_STORAGE_BUCKET
 *   FIREBASE_MESSAGING_SENDER_ID
 *   FIREBASE_APP_ID
 *   FIREBASE_MEASUREMENT_ID
 *   ALLOWED_EMAILS  (comma-separated, ví dụ: "a@gmail.com,b@gmail.com")
 */

const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, '..', 'src', 'environments');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

const apiKey = process.env.FIREBASE_API_KEY || '';
const authDomain = process.env.FIREBASE_AUTH_DOMAIN || '';
const projectId = process.env.FIREBASE_PROJECT_ID || '';
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || '';
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || '';
const appId = process.env.FIREBASE_APP_ID || '';
const measurementId = process.env.FIREBASE_MEASUREMENT_ID || '';
const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

function generateContent(production) {
  return `export const environment = {
  production: ${production},
  firebaseConfig: {
    apiKey: "${apiKey}",
    authDomain: "${authDomain}",
    projectId: "${projectId}",
    storageBucket: "${storageBucket}",
    messagingSenderId: "${messagingSenderId}",
    appId: "${appId}",
    measurementId: "${measurementId}"
  },
  allowedEmails: ${JSON.stringify(allowedEmails)},
};
`;
}

fs.writeFileSync(path.join(envDir, 'environment.ts'), generateContent(false));
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), generateContent(true));

console.log('Environment files generated successfully.');
console.log(`  allowedEmails: ${allowedEmails.length} entries`);
console.log(`  projectId: ${projectId || '(empty)'}`);
