import { useState, useEffect, useCallback } from "react";
import { supabase, isPlaceholderUrl } from "../lib/supabase";
import { encryptPayload, decryptPayload } from "../lib/cryptoUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmergencyContact {
  /** Supabase row UUID (or a temporary optimistic UUID before commit) */
  id: string;
  /** auth.users(id) of the owning resident — matches RLS auth.uid() */
  resident_id: string;
  name: string;
  relationship: string;
  phone: string;
  /** true once the record has been confirmed in Supabase */
  synced: boolean;
}

/** Raw shape of a row from emergency.contacts */
interface ContactRow {
  id: string;
  resident_id: string;
  encrypted_name: string;
  relationship: string | null;
  encrypted_phone: string;
  created_at: string;
}

/** Shape persisted in localStorage, keyed by auth uid */
interface CachedContactEntry {
  id: string;
  resident_id: string;
  name: string;
  relationship: string;
  phone: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Symmetric key used for all PII encryption in this app.
 * Matches the passphrase used everywhere else (cryptoUtils, EnrollmentPage, etc.)
 */
const CONTACT_CRYPTO_KEY = "barangay45key";
const LS_CONTACTS_KEY = "respondaCare_emergencyContacts";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function readLocalCache(authUid: string): EmergencyContact[] {
  try {
    const raw = localStorage.getItem(LS_CONTACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, CachedContactEntry[]>;
    return (parsed[authUid] ?? []).map((e) => ({ ...e, synced: false }));
  } catch {
    return [];
  }
}

function writeLocalCache(authUid: string, contacts: EmergencyContact[]): void {
  try {
    const raw = localStorage.getItem(LS_CONTACTS_KEY);
    const parsed: Record<string, CachedContactEntry[]> = raw
      ? (JSON.parse(raw) as Record<string, CachedContactEntry[]>)
      : {};
    parsed[authUid] = contacts.map(({ id, resident_id, name, relationship, phone }) => ({
      id, resident_id, name, relationship, phone,
    }));
    localStorage.setItem(LS_CONTACTS_KEY, JSON.stringify(parsed));
  } catch {
    // Non-critical — in-memory state is still correct
  }
}

/**
 * Merge Supabase rows (source of truth) with locally-only entries.
 * Deduplicates by decrypted phone number so re-adding from another
 * device doesn't create duplicates.
 */
function mergeContacts(
  remote: EmergencyContact[],
  local: EmergencyContact[],
): EmergencyContact[] {
  const remotePhones = new Set<string>(remote.map((c) => c.phone));
  const localOnly = local.filter((c) => !remotePhones.has(c.phone));
  return [...remote, ...localOnly];
}

// ─── Hook return shape ────────────────────────────────────────────────────────

interface UseEmergencyContactsReturn {
  contacts: EmergencyContact[];
  loading: boolean;
  error: string | null;
  addContact: (input: Pick<EmergencyContact, "name" | "relationship" | "phone">) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEmergencyContacts(): UseEmergencyContactsReturn {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  /**
   * authUid is the auth.users.id value — this is the same UUID stored in
   * emergency.contacts.resident_id and what auth.uid() evaluates to in RLS.
   *
   * We do NOT join to core.residents here because that table's resident_id
   * is a separate UUID from the auth user id.
   */
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Resolve the auth user id on mount ────────────────────────────────────────
  useEffect(() => {
    const resolveUser = async () => {
      if (isPlaceholderUrl) {
        // Offline / demo mode — use the seeded auth UID
        setAuthUid("11111111-1111-1111-1111-111111111111");
        return;
      }
      try {
        const { data, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw new Error(authErr.message);
        const uid = data?.user?.id;
        if (uid) {
          setAuthUid(uid);
        } else {
          setError("No authenticated user found. Please log in.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Could not resolve user identity.");
      }
    };
    resolveUser();
  }, []);

  // ── Fetch contacts ────────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!authUid) return;
    setLoading(true);
    setError(null);

    try {
      // Immediately hydrate from cache so the UI isn't blank
      const cached = readLocalCache(authUid);
      setContacts(cached);

      if (isPlaceholderUrl) {
        // Offline mode: cache is the only source of truth
        return;
      }

      const { data: rows, error: fetchErr } = await supabase
        .schema("emergency")
        .from("contacts")
        .select("id, resident_id, encrypted_name, relationship, encrypted_phone, created_at")
        .eq("resident_id", authUid)
        .order("created_at", { ascending: true });

      if (fetchErr) throw new Error(fetchErr.message);

      const decrypted: EmergencyContact[] = await Promise.all(
        (rows as ContactRow[]).map(async (row) => {
          const name = (await decryptPayload(row.encrypted_name, CONTACT_CRYPTO_KEY)) as string;
          const phone = (await decryptPayload(row.encrypted_phone, CONTACT_CRYPTO_KEY)) as string;
          return {
            id: row.id,
            resident_id: row.resident_id,
            name,
            relationship: row.relationship ?? "",
            phone,
            synced: true,
          };
        })
      );

      const merged = mergeContacts(decrypted, cached);
      setContacts(merged);
      writeLocalCache(authUid, merged);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load emergency contacts.");
    } finally {
      setLoading(false);
    }
  }, [authUid]);

  useEffect(() => {
    if (authUid) {
      fetchContacts();
    }
  }, [authUid, fetchContacts]);

  // ── Add contact ───────────────────────────────────────────────────────────────
  const addContact = useCallback(
    async (input: Pick<EmergencyContact, "name" | "relationship" | "phone">): Promise<void> => {
      if (!authUid) throw new Error("User identity not resolved. Please log in.");

      const optimisticId = crypto.randomUUID();
      const optimistic: EmergencyContact = {
        id: optimisticId,
        resident_id: authUid,
        name: input.name,
        relationship: input.relationship,
        phone: input.phone,
        synced: false,
      };

      // Optimistic update — append to UI immediately
      setContacts((prev) => {
        const updated = [...prev, optimistic];
        writeLocalCache(authUid, updated);
        return updated;
      });

      if (isPlaceholderUrl) {
        // Offline mode: localStorage cache is the final store
        return;
      }

      try {
        const encryptedName = await encryptPayload(input.name, CONTACT_CRYPTO_KEY);
        const encryptedPhone = await encryptPayload(input.phone, CONTACT_CRYPTO_KEY);

        const { data: inserted, error: insertErr } = await supabase
          .schema("emergency")
          .from("contacts")
          .insert({
            resident_id: authUid,
            encrypted_name: encryptedName as string,
            relationship: input.relationship,
            encrypted_phone: encryptedPhone as string,
          })
          .select("id")
          .single();

        if (insertErr) throw new Error(insertErr.message);

        // Swap optimistic id for the real DB-assigned UUID
        const realId = (inserted as { id: string }).id;
        setContacts((prev) => {
          const updated = prev.map((c) =>
            c.id === optimisticId ? { ...c, id: realId, synced: true } : c
          );
          writeLocalCache(authUid, updated);
          return updated;
        });
      } catch (err: unknown) {
        // Rollback optimistic entry on failure
        setContacts((prev) => {
          const rolled = prev.filter((c) => c.id !== optimisticId);
          writeLocalCache(authUid, rolled);
          return rolled;
        });
        throw err;
      }
    },
    [authUid]
  );

  // ── Delete contact ────────────────────────────────────────────────────────────
  const deleteContact = useCallback(
    async (id: string): Promise<void> => {
      if (!authUid) throw new Error("User identity not resolved.");

      // Snapshot for rollback
      const previous = contacts;

      setContacts((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        writeLocalCache(authUid, updated);
        return updated;
      });

      if (isPlaceholderUrl) return;

      try {
        const { error: deleteErr } = await supabase
          .schema("emergency")
          .from("contacts")
          .delete()
          .eq("id", id)
          .eq("resident_id", authUid); // Belt-and-suspenders: enforce ownership

        if (deleteErr) throw new Error(deleteErr.message);
      } catch (err: unknown) {
        // Rollback on failure
        setContacts(previous);
        writeLocalCache(authUid, previous);
        throw err;
      }
    },
    [authUid, contacts]
  );

  return {
    contacts,
    loading,
    error,
    addContact,
    deleteContact,
    refetch: fetchContacts,
  };
}
