import { describe, expect, it } from 'vitest';
import {
  createFirestoreProofReference,
  parseFirestoreProofReference,
} from './firestore-proof-media';

describe('Firestore proof media reference', () => {
  it('membuat dan membaca referensi media', () => {
    const reference = createFirestoreProofReference('ticket_before_hash');

    expect(reference).toBe(
      'firestore://pickupProofMedia/ticket_before_hash',
    );
    expect(parseFirestoreProofReference(reference)).toBe(
      'ticket_before_hash',
    );
  });

  it('mengabaikan URL provider lain', () => {
    expect(
      parseFirestoreProofReference('https://example.com/proof.jpg'),
    ).toBeNull();
  });
});
