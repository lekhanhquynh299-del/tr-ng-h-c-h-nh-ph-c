import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Header } from './components/Header';
import { UserSession } from './types';

const SESSION_KEY = 'safe_school_session_v1';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_KEY);
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession && parsedSession.role && parsedSession.token) {
            setSession(parsedSession);
          }
        }
      } catch (error) {
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    checkExistingSession();
  }, []);

  const handleLogin = (userSession: UserSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
    setSession(userSession);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-500 text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold animate-pulse">SAFE SCHOOL</h2>
        <p className="text-sm opacity-80">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {session && <Header title="SAFE SCHOOL" user={session} onLogout={handleLogout} />}
      <main className="flex-1 overflow-hidden relative bg-gray-50">
        {session ? (
          session.role === 'STUDENT' ? <StudentDashboard user={session} /> : <AdminDashboard userSession={session} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
};

export default App;