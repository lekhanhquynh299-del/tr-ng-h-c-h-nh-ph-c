import React from 'react';
import { UserSession } from '../types';

interface HeaderProps {
  title: string;
  user: UserSession | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, onLogout }) => {
  const getRoleName = () => {
    if (!user) return '';
    if (user.role === 'ADMIN') return 'Quản lý';
    if (user.role === 'TEACHER') return `GV: ${user.teacher?.name}`;
    if (user.role === 'STUDENT') return `HS: ${user.student?.name} - ${user.student?.class}`;
    return '';
  };

  return (
    <header className="bg-gradient-to-r from-yellow-400 to-pink-400 shadow-md px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pink-500 font-bold shadow-sm border-2 border-pink-100">
          <span className="text-xl">🏫</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-white leading-tight drop-shadow-sm uppercase">{title}</h1>
          <span className="text-xs text-yellow-50 font-medium">THCS Ba Tơ</span>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-pink-600 font-bold bg-white/90 px-2 py-1 rounded-full hidden sm:block shadow-sm">
            {getRoleName()}
          </span>
          <button 
            onClick={onLogout}
            className="text-xs text-red-500 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full font-bold transition-all shadow-sm border border-red-100"
          >
            Thoát
          </button>
        </div>
      )}
    </header>
  );
};