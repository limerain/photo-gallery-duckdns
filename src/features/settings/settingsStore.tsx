import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type SettingsState = {
  cdnBaseUrl: string
  storageZoneName: string
  storageAccessKey: string
  alwaysOriginal: boolean
  setConfig: (config: Partial<SettingsState>) => void
  setAlwaysOriginal: (value: boolean) => void
  reset: () => void
}

const initialState = {
  cdnBaseUrl: '',
  storageZoneName: '',
  storageAccessKey: '',
  alwaysOriginal: false,
}

export const useAppSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setConfig: (config) => set((state) => ({ ...state, ...config })),
      setAlwaysOriginal: (value) => set({ alwaysOriginal: value }),
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
