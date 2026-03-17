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
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },
      updateProfile: (data) =>
        set((s) => ({ profile: { ...s.profile, ...data } })),
    }),
    { name: "amg-profile" }
  )
);
