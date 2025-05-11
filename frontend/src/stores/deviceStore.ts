import { createJSONStorage, persist } from 'zustand/middleware';

import { create } from 'zustand';

// 기기 인터페이스
export interface Device {
  id: string;
  userId: string;
  name: string;
  type: string;
  lastActive: string;
  isCurrentDevice: boolean;
  // 기타 기기 관련 정보
}

// 기기 스토어 상태 인터페이스
interface DeviceState {
  devices: Device[];
  currentDevice: Device | null;
  maxDevices: number;
  isLoading: boolean;
  error: string | null;
  
  // 상태 설정 함수
  setDevices: (devices: Device[]) => void;
  setCurrentDevice: (device: Device | null) => void;
  setMaxDevices: (maxDevices: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearDevices: () => void;
  
  // 기기 추가/제거
  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
}

// 기기 상태 관리를 위한 Zustand 스토어
export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      devices: [],
      currentDevice: null,
      maxDevices: 0,
      isLoading: false,
      error: null,
      
      setDevices: (devices) => set({ devices }),
      setCurrentDevice: (currentDevice) => set({ currentDevice }),
      setMaxDevices: (maxDevices) => set({ maxDevices }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearDevices: () => set({ devices: [], currentDevice: null }),
      
      addDevice: (device) => set((state) => ({
        devices: [...state.devices, device]
      })),
      
      removeDevice: (deviceId) => set((state) => ({
        devices: state.devices.filter(d => d.id !== deviceId)
      })),
    }),
    {
      name: 'device-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
); 