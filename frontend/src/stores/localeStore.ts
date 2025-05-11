import { createJSONStorage, persist } from 'zustand/middleware';

import { create } from 'zustand';

type Locale = 'ko' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ko', // 기본 언어
      
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
); 