import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  id: string;
  email: string;
  loyaltyPoints: number;
}

interface AuthStore {
  token: string | null;
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  authTab: "login" | "register";
  isHistoryModalOpen: boolean;

  // Actions
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateLoyaltyPoints: (points: number) => void;
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthModalOpen: false,
      authTab: "login",
      isHistoryModalOpen: false,

      setAuth: (token, user) => set({ token, user, isAuthModalOpen: false }),

      logout: () => set({ token: null, user: null }),

      updateLoyaltyPoints: (points) =>
        set((state) => ({
          user: state.user ? { ...state.user, loyaltyPoints: points } : null,
        })),

      openAuthModal: (tab = "login") => set({ isAuthModalOpen: true, authTab: tab }),

      closeAuthModal: () => set({ isAuthModalOpen: false }),

      openHistoryModal: () => set({ isHistoryModalOpen: true }),

      closeHistoryModal: () => set({ isHistoryModalOpen: false }),
    }),
    {
      name: "brewlite-auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
