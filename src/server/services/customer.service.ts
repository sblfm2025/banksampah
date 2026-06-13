import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import {
  customerInputSchema,
  type Customer,
  type CustomerInput,
} from '../../shared/schemas/customer.schema';
import { stableIdentifier } from '../../shared/utils/identifiers';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { customerConverter } from '../firebase/converters';

export class CustomerService {
  constructor(private readonly db: Firestore = adminDb) {}

  async upsert(input: CustomerInput): Promise<Customer> {
    const customer = customerInputSchema.parse(input);
    const id = await stableIdentifier('wa', customer.phoneNumber);
    const reference = this.db.collection(COLLECTIONS.customers).doc(id);
    const now = Timestamp.now();

    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);

      transaction.set(
        reference,
        {
          ...customer,
          id,
          createdAt: existing.exists ? existing.get('createdAt') : now,
          updatedAt: now,
        },
        { merge: true },
      );
    });

    const snapshot = await reference.withConverter(customerConverter).get();
    return snapshot.data()!;
  }

  async getByPhoneNumber(phoneNumber: string): Promise<Customer | null> {
    const parsedPhone = customerInputSchema.shape.phoneNumber.parse(phoneNumber);
    const id = await stableIdentifier('wa', parsedPhone);
    const snapshot = await this.db
      .collection(COLLECTIONS.customers)
      .doc(id)
      .withConverter(customerConverter)
      .get();

    return snapshot.data() ?? null;
  }
}
