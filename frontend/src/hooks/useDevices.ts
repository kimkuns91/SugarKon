import { Device, useDeviceStore } from '@/stores/deviceStore';
import { checkDeviceLimit, deregisterDevice, getCurrentDevice, getMaxDevices, getUserDevices, registerDevice, updateDeviceName } from '@/services/device';

import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

// 에러 타입 가드
function isError(error: unknown): error is Error {
  return error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error);
}

/**
 * 기기 관리 관련 기능을 제공하는 커스텀 훅
 */
export function useDevices() {
  const { user } = useAuthStore();
  const { 
    devices, 
    currentDevice,
    maxDevices,
    isLoading, 
    error,
    setDevices,
    setCurrentDevice,
    setMaxDevices,
    setLoading, 
    setError, 
    clearDevices,
    addDevice,
    removeDevice
  } = useDeviceStore();
  
  // 기기 정보 로딩
  useEffect(() => {
    // 사용자가 로그인 상태인 경우에만 기기 정보 로드
    if (user?.id && devices.length === 0) {
      loadDevices();
    }
    
    // 사용자가 로그아웃하면 기기 정보도 초기화
    if (!user) {
      clearDevices();
    }
  }, [user, devices.length]);
  
  // 기기 목록 로딩
  const loadDevices = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 사용자의 등록된 기기 목록 조회
      const deviceList = await getUserDevices(user.id);
      setDevices(deviceList);
      
      // 현재 사용 중인 기기 정보 조회
      const current = await getCurrentDevice();
      setCurrentDevice(current);
      
      // 최대 기기 수 조회
      const max = await getMaxDevices(user.id);
      setMaxDevices(max);
    } catch (error: unknown) {
      console.error('기기 정보 로딩 오류:', error);
      setError(isError(error) ? error.message : '기기 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 현재 기기 등록
  const registerCurrentDevice = async (name: string, type: string) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 기기 제한 확인
      const canRegister = await checkDeviceLimit(user.id);
      if (!canRegister) {
        toast.error('최대 기기 수에 도달했습니다. 다른 기기를 먼저 해제해주세요.');
        return false;
      }
      
      // 기기 등록 요청
      const deviceInfo: Partial<Device> = {
        name,
        type,
        isCurrentDevice: true
      };
      
      const newDevice = await registerDevice(user.id, deviceInfo);
      addDevice(newDevice);
      setCurrentDevice(newDevice);
      
      toast.success('기기가 등록되었습니다.');
      return true;
    } catch (error: unknown) {
      console.error('기기 등록 오류:', error);
      setError(isError(error) ? error.message : '기기 등록 중 오류가 발생했습니다.');
      toast.error('기기 등록에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 기기 이름 변경
  const changeDeviceName = async (deviceId: string, name: string) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedDevice = await updateDeviceName(deviceId, name);
      
      // 기기 목록 업데이트
      setDevices(devices.map(device => 
        device.id === deviceId ? updatedDevice : device
      ));
      
      // 현재 기기인 경우 현재 기기 정보도 업데이트
      if (currentDevice?.id === deviceId) {
        setCurrentDevice(updatedDevice);
      }
      
      toast.success('기기 이름이 변경되었습니다.');
      return true;
    } catch (error: unknown) {
      console.error('기기 이름 변경 오류:', error);
      setError(isError(error) ? error.message : '기기 이름 변경 중 오류가 발생했습니다.');
      toast.error('기기 이름 변경에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 기기 등록 해제
  const unregisterDevice = async (deviceId: string) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await deregisterDevice(deviceId);
      
      // 기기 목록에서 제거
      removeDevice(deviceId);
      
      // 현재 기기인 경우 현재 기기 정보 초기화
      if (currentDevice?.id === deviceId) {
        setCurrentDevice(null);
      }
      
      toast.success('기기 등록이 해제되었습니다.');
      return true;
    } catch (error: unknown) {
      console.error('기기 등록 해제 오류:', error);
      setError(isError(error) ? error.message : '기기 등록 해제 중 오류가 발생했습니다.');
      toast.error('기기 등록 해제에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 기기 제한 확인
  const isDeviceLimitReached = () => {
    return devices.length >= maxDevices;
  };
  
  return {
    devices,
    currentDevice,
    maxDevices,
    isLoading,
    error,
    
    // 기기 정보
    deviceCount: devices.length,
    hasCurrentDevice: !!currentDevice,
    
    // 기기 관리 기능
    loadDevices,
    registerCurrentDevice,
    changeDeviceName,
    unregisterDevice,
    
    // 기기 제한 확인
    isDeviceLimitReached
  };
} 