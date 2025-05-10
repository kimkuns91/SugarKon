import React, { useState } from 'react';

import { RegisterRequest } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';

const RegisterForm: React.FC = () => {
  const { register: registerUser, error, loading, clearError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    getValues,
    formState: { errors } 
  } = useForm<RegisterRequest & { confirmPassword: string }>();
  
  const onSubmit = async (data: RegisterRequest) => {
    setFormError(null);
    clearError();
    
    try {
      await registerUser(data);
    } catch (err) {
      console.error(err);
      setFormError('회원가입 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
        
        {(error || formError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || formError}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            이메일
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.email ? 'border-red-500' : ''
            }`}
            id="email"
            type="email"
            placeholder="이메일"
            {...register('email', { 
              required: '이메일을 입력해주세요',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: '유효한 이메일 주소를 입력해주세요'
              }
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-xs italic">{errors.email.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            사용자명
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.username ? 'border-red-500' : ''
            }`}
            id="username"
            type="text"
            placeholder="사용자명"
            {...register('username', { 
              required: '사용자명을 입력해주세요',
              minLength: {
                value: 4,
                message: '사용자명은 최소 4자 이상이어야 합니다'
              }
            })}
          />
          {errors.username && (
            <p className="text-red-500 text-xs italic">{errors.username.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            비밀번호
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.password ? 'border-red-500' : ''
            }`}
            id="password"
            type="password"
            placeholder="비밀번호"
            {...register('password', { 
              required: '비밀번호를 입력해주세요',
              minLength: {
                value: 6,
                message: '비밀번호는 최소 6자 이상이어야 합니다'
              }
            })}
          />
          {errors.password && (
            <p className="text-red-500 text-xs italic">{errors.password.message}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            비밀번호 확인
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.confirmPassword ? 'border-red-500' : ''
            }`}
            id="confirmPassword"
            type="password"
            placeholder="비밀번호 확인"
            {...register('confirmPassword', { 
              required: '비밀번호 확인을 입력해주세요',
              validate: value => value === getValues('password') || '비밀번호가 일치하지 않습니다'
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs italic">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
          <a
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            href="/login"
          >
            로그인 페이지로
          </a>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm; 