import type { Firestore } from 'firebase-admin/firestore';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';

export interface DriverRecord {
  id: string;
  name: string;
  isActive: boolean;
}

export class UserService {
  constructor(private readonly db: Firestore = adminDb) {}

  async listActiveDrivers(): Promise<DriverRecord[]> {
    const snapshot = await this.db
      .collection(COLLECTIONS.users)
      .where('role', '==', 'DRIVER')
      .where('isActive', '==', true)
      .get();

    return snapshot.docs
      .map((document) => ({
        id: document.id,
        name: String(document.get('name') ?? 'Tanpa nama'),
        isActive: true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }
}
