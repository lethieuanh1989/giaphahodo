/**
 * Script to seed Firestore with data from JSON files.
 *
 * Usage:
 *   1. npm install firebase-admin
 *   2. Download service account key from Firebase Console:
 *      Project Settings > Service accounts > Generate new private key
 *   3. Save it as "serviceAccountKey.json" in this folder
 *   4. Run: node seed-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load JSON data
const chungData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'src/assets/data/gia-pha-goc-chung.json'), 'utf8')
);
const nganh2Chi2Data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'src/assets/data/gia-pha-nganh-2-chi-2.json'), 'utf8')
);

const branches = [
  { key: 'chung', data: chungData },
  { key: 'nganh2-chi2', data: nganh2Chi2Data },
];

async function seedBranch(branchKey, people) {
  const now = new Date().toISOString();

  // Firestore writeBatch supports max 500 operations per batch
  const BATCH_SIZE = 499;
  let count = 0;

  for (let i = 0; i < people.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = people.slice(i, i + BATCH_SIZE);

    for (const person of chunk) {
      const docRef = db.collection('branches').doc(branchKey).collection('people').doc(person.id);
      batch.set(docRef, {
        ...person,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    await batch.commit();
    console.log(`  [${branchKey}] Committed ${Math.min(i + BATCH_SIZE, people.length)}/${people.length}`);
  }

  return count;
}

async function main() {
  console.log('Starting Firestore seed...\n');

  for (const branch of branches) {
    console.log(`Seeding branch "${branch.key}" (${branch.data.length} people)...`);
    const count = await seedBranch(branch.key, branch.data);
    console.log(`  Done: ${count} documents written.\n`);
  }

  console.log('All branches seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding Firestore:', err);
  process.exit(1);
});
