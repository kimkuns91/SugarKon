import { Device } from '@/stores/deviceStore';
import api from '@/lib/api';

// 사용자의 등록된 기기 목록 조회
export const getUserDevices = async (userId: string): Promise<Device[]> => {
  const response = await api.get<Device[]>(`/devices/user/${userId}`);
  return response.data;
};

// 현재 기기 정보 가져오기
export const getCurrentDevice = async (): Promise<Device> => {
  const response = await api.get<Device>('/devices/current');
  return response.data;
};

// 기기 등록
export const registerDevice = async (userId: string, deviceInfo: Partial<Device>): Promise<Device> => {
  const response = await api.post<Device>('/devices/register', {
    userId,
    ...deviceInfo
  });
  return response.data;
};

// 기기 이름 변경
export const updateDeviceName = async (deviceId: string, name: string): Promise<Device> => {
  const response = await api.patch<Device>(`/devices/${deviceId}/name`, { name });
  return response.data;
};

// 기기 등록 해제
export const deregisterDevice = async (deviceId: string): Promise<void> => {
  await api.delete(`/devices/${deviceId}`);
};

// 사용자의 최대 기기 수 조회
export const getMaxDevices = async (userId: string): Promise<number> => {
  const response = await api.get<{ maxDevices: number }>(`/users/${userId}/max-devices`);
  return response.data.maxDevices;
};

// 기기 제한 확인
export const checkDeviceLimit = async (userId: string): Promise<boolean> => {
  try {
    const response = await api.get<{ limitReached: boolean }>(`/devices/check-limit`, {
      params: { userId }
    });
    return !response.data.limitReached;
  } catch (error) {
    console.error('기기 제한 확인 오류:', error);
    return false;
  }
}; 