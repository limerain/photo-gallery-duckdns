import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemePreset = 'dark' | 'light' | 'midnight' | 'forest' | 'sunset'

export const themePresets: { id: ThemePreset; name: string }[] = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'midnight', name: 'Midnight Blue' },
  { id: 'forest', name: 'Forest' },
  { id: 'sunset', name: 'Sunset' },
]

type SettingsState = {
  cdnBaseUrl: string
  storageZoneName: string
  storageAccessKey: string
  alwaysOriginal: boolean
  theme: ThemePreset
  setConfig: (config: Partial<SettingsState>) => void
  setAlwaysOriginal: (value: boolean) => void
  setTheme: (theme: ThemePreset) => void
  reset: () => void
}

const initialState = {
  cdnBaseUrl: '',
  storageZoneName: '',
  storageAccessKey: '',
  alwaysOriginal: false,
  theme: 'dark' as ThemePreset,
}

export const useAppSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setConfig: (config) => set((state) => ({ ...state, ...config })),
      setAlwaysOriginal: (value) => set({ alwaysOriginal: value }),
      setTheme: (theme) => set({ theme }),
      reset: () => set(initialState),
    }),
    {
      name: 'bunny-photo-settings',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        cdnBaseUrl: state.cdnBaseUrl,
        storageZoneName: state.storageZoneName,
        storageAccessKey: state.storageAccessKey,
        alwaysOriginal: state.alwaysOriginal,
        theme: state.theme,
      }),
    },
  ),
)

export const isSettingsReady = (config: {
  cdnBaseUrl: string
  storageZoneName: string
  storageAccessKey: string
}) =>
  Boolean(config.cdnBaseUrl && config.storageZoneName && config.storageAccessKey)
