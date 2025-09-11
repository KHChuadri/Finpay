import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  profileImg: string | null;
  isVerified: boolean;
  isLocked: boolean;
  isAuthenticated: boolean;
  setUserId: (userId: string) => void;
  setEmail: (email: string) => void;
  setToken: (token: string) => void;
  setProfileImg: (img: string) => void;
  setUserStatus: (isVerified: boolean, isLocked: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setAuth: (token: string, userId: string) => void;
  resetAuth: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      profileImg: null,
      isVerified: false,
      isLocked: false,
      isAuthenticated: false,
      setUserId: (userId) => set({ userId }),
      setEmail: (email) => set({ email }),
      setToken: (token) => set({ token }),
      setProfileImg: (img) => set({ profileImg: img }),
      setUserStatus: (isVerified, isLocked) => set({ isVerified, isLocked }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated: isAuthenticated }),
      setAuth: (token, userId) => set({ token, userId }),
      resetAuth: () => set({ token: null, userId: null, email: null, profileImg: null, isVerified: false, isLocked: false, isAuthenticated: false }),
    }),
    {
      name: 'auth-store',
      storage: {
        getItem: (name) => {
          const item = sessionStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);

export default useAuthStore;