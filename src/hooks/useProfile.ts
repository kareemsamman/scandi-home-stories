import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ProfileStore {
  profile: Profile;
  updateProfile: (data: Partial<Profile>) => void;
}

export const useProfile = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: {
        firstName: "אחמד",
        lastName: "כנעאן",
        email: "ahmad@example.com",
        phone: "0521234567",
      },
      updateProfile: (data) =>
        set((s) => ({ profile: { ...s.profile, ...data } })),
    }),
    { name: "amg-profile" }
  )
);
