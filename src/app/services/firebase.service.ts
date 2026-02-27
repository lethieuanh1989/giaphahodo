import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  limit,
  deleteField,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Person } from '../models/person.model';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private firestore = inject(Firestore);

  private peopleCollection(branchKey: string) {
    return collection(this.firestore, 'branches', branchKey, 'people');
  }

  getPeople(branchKey: string): Observable<Person[]> {
    const col = this.peopleCollection(branchKey);
    return collectionData(col, { idField: 'id' }).pipe(
      map(docs => {
        const people = docs as Person[];
        console.log(`[GP-DEBUG] FirebaseService.getPeople('${branchKey}') emitted ${people.length} docs`, people.map(p => p.id));
        return people;
      })
    );
  }

  async savePerson(branchKey: string, person: Person): Promise<void> {
    const docRef = doc(this.firestore, 'branches', branchKey, 'people', person.id);
    const data: any = {
      ...person,
      updatedAt: new Date().toISOString(),
      // Xóa field cũ (đã migrate sang checkInImages)
      checkInImage: deleteField(),
      checkInDate: deleteField(),
    };
    await setDoc(docRef, data, { merge: true });
  }

  async addPerson(branchKey: string, person: Person): Promise<void> {
    const docRef = doc(this.firestore, 'branches', branchKey, 'people', person.id);
    await setDoc(docRef, {
      ...person,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async isBranchSeeded(branchKey: string): Promise<boolean> {
    const col = this.peopleCollection(branchKey);
    const q = query(col, limit(1));
    const snapshot = await getDocs(q);
    console.log(`[GP-DEBUG] FirebaseService.isBranchSeeded('${branchKey}') = ${!snapshot.empty} (fromCache: ${snapshot.metadata?.fromCache})`);
    return !snapshot.empty;
  }

  async seedBranch(branchKey: string, people: Person[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    const now = new Date().toISOString();
    for (const person of people) {
      const docRef = doc(this.firestore, 'branches', branchKey, 'people', person.id);
      batch.set(docRef, { ...person, createdAt: now, updatedAt: now });
    }
    await batch.commit();
  }

  async deletePerson(branchKey: string, personId: string): Promise<void> {
    const docRef = doc(this.firestore, 'branches', branchKey, 'people', personId);
    await deleteDoc(docRef);
  }

  async updatePersonField(branchKey: string, personId: string, data: Partial<Person>): Promise<void> {
    const docRef = doc(this.firestore, 'branches', branchKey, 'people', personId);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  }

  /**
   * Batch write: ghi nhiều documents cùng lúc (atomic).
   * Tất cả thành công hoặc tất cả thất bại.
   */
  async batchWritePersons(
    branchKey: string,
    operations: { type: 'add' | 'update'; person: Person }[]
  ): Promise<void> {
    const batch = writeBatch(this.firestore);
    const now = new Date().toISOString();

    for (const op of operations) {
      const docRef = doc(this.firestore, 'branches', branchKey, 'people', op.person.id);
      const cleanData = this.stripUndefined({ ...op.person });
      if (op.type === 'add') {
        batch.set(docRef, { ...cleanData, createdAt: now, updatedAt: now });
      } else {
        batch.set(docRef, { ...cleanData, updatedAt: now }, { merge: true });
      }
    }

    console.log(`[GP-DEBUG] FirebaseService.batchWritePersons('${branchKey}') committing ${operations.length} ops:`, operations.map(op => `${op.type}:${op.person.id}`));
    await batch.commit();
    console.log(`[GP-DEBUG] FirebaseService.batchWritePersons('${branchKey}') committed OK`);
  }

  private stripUndefined(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }
}
