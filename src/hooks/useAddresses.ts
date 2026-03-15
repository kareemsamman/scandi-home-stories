import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  street: string;
  houseNumber: string;
  apartment: string;
  isDefault: boolean;
}

interface AddressStore {
  addresses: SavedAddress[];
  addAddress: (address: Omit<SavedAddress, "id">) => void;
  updateAddress: (id: string, address: Partial<SavedAddress>) => void;
  removeAddress: (id: string) => void;
  setDefault: (id: string) => void;
  getDefault: () => SavedAddress | undefined;
}

export const useAddresses = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      addAddress: (address) => {
        const id = crypto.randomUUID();
        const isFirst = get().addresses.length === 0;
        set((s) => ({
          addresses: [...s.addresses, { ...address, id, isDefault: isFirst ? true : address.isDefault }],
        }));
      },
      updateAddress: (id, updates) =>
        set((s) => ({
          addresses: s.addresses.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      removeAddress: (id) =>
        set((s) => ({
          addresses: s.addresses.filter((a) => a.id !== id),
        })),
      setDefault: (id) =>
        set((s) => ({
          addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        })),
      getDefault: () => get().addresses.find((a) => a.isDefault) || get().addresses[0],
    }),
    { name: "amg-addresses" }
  )
);
