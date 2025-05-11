"use client";

import { ReactNode, useEffect, useState } from 'react';

import { NextIntlClientProvider } from 'next-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import messages from '@/messages';
import { queryClient } from '@/lib/queryClient';
import { useLocaleStore } from '@/stores/localeStore';

// 내부적으로 사용할 IntlProvider 컴포넌트
function IntlProviderWithLocale({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((state) => state.locale);
  // 서버 렌더링과 클라이언트 하이드레이션 불일치를 방지하기 위한 상태
  const [mounted, setMounted] = useState(false);
  
  // 클라이언트 측에서만 마운트 상태 설정
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 마운트되기 전에는 'ko' 기본값 사용 (서버 렌더링과 일치)
  const currentLocale = mounted ? locale : 'ko';
  
  return (
    <NextIntlClientProvider locale={currentLocale} messages={messages[currentLocale]}>
      {children}
    </NextIntlClientProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <IntlProviderWithLocale>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </IntlProviderWithLocale>
  );
}