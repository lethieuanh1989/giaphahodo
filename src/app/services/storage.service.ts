import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  async uploadImage(personId: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, `photos/${personId}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async deleteImage(personId: string): Promise<void> {
    const storageRef = ref(this.storage, `photos/${personId}`);
    try {
      await deleteObject(storageRef);
    } catch {
      // File may not exist, ignore
    }
  }
}
