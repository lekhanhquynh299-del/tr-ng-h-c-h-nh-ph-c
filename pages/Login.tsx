import React, { useState } from 'react';
import { mockApi } from '../services/mockApi';
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [isRegistering, setIsRegistering] = useState(false); // Mode Đăng ký
  
  // Login State
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Thêm số điện thoại giáo viên
  
  // Registration State
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regClass, setRegClass] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Check ID, 2: Set Pass

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Xử lý Đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'STUDENT') {
        const student = await mockApi.verifyStudent(id, password);
        if (student) {
          onLogin({ role: 'STUDENT', student, token: 'mock-token' });
        } else {
          setError('Mã học sinh hoặc mật khẩu không đúng.');
        }
      } else if (role === 'TEACHER') {
        // Cập nhật: Verify cả số điện thoại
        const teacher = await mockApi.verifyTeacher(email, phone, password);
        if (teacher) {
          onLogin({ role: 'TEACHER', teacher, token: 'mock-token' });
        } else {
          setError('Thông tin đăng nhập không đúng (Email/SĐT/Mật khẩu).');
        }
      } else {
        const isAdmin = await mockApi.verifyAdmin(password);
        if (isAdmin) {
          onLogin({ role: 'ADMIN', token: 'mock-token' });
        } else {
          setError('Mật khẩu quản trị không đúng.');
        }
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đăng ký (Bước 1: Kiểm tra mã HS)
  const checkStudentId = async () => {
    setLoading(true);
    setError('');
    const student = await mockApi.findStudentById(regId);
    setLoading(false);
    
    if (student) {
      setRegName(student.name);
      setRegClass(student.class);
      setStep(2);
    } else {
      setError('Không tìm thấy Mã học sinh này trong danh sách nhà trường.');
    }
  };

  // Xử lý Đăng ký (Bước 2: Tạo mật khẩu và Đăng nhập luôn)
  const handleRegister = async () => {
     if (!regPassword) {
         setError('Vui lòng nhập mật khẩu');
         return;
     }
     
     setLoading(true);
     await new Promise(r => setTimeout(r, 800)); // Fake delay
     setLoading(false);

     const student = await mockApi.findStudentById(regId);
     if (student) {
         onLogin({ role: 'STUDENT', student, token: 'mock-register-token' });
     }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-yellow-200 p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl border-2 border-white">
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-full bg-gradient-to-r from-yellow-400 to-pink-400 mb-3 shadow-lg">
             <span className="text-3xl">🏫</span>
          </div>
          <h1 className="text-2xl font-bold text-pink-600 uppercase tracking-tight">Trường Học Hạnh Phúc</h1>
          <p className="text-gray-500 text-sm">Kết nối yêu thương - An toàn đến trường</p>
        </div>

        {/* Role Tabs */}
        {!isRegistering && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
                <button
                key={r}
                onClick={() => { setRole(r); setError(''); setId(''); setPassword(''); setEmail(''); setPhone(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    role === r ? 'bg-white text-pink-500 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
                }`}
                >
                {r === 'STUDENT' ? 'Học sinh' : r === 'TEACHER' ? 'Giáo viên' : 'Quản lý'}
                </button>
            ))}
            </div>
        )}

        {/* Forms */}
        {isRegistering ? (
            // REGISTRATION FORM
            <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center mb-4">
                    <button onClick={() => { setIsRegistering(false); setStep(1); setRegId(''); setError(''); }} className="text-gray-400 hover:text-gray-600 mr-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-lg font-bold text-pink-600">Đăng Ký Tài Khoản</h2>
                </div>

                {step === 1 ? (
                    <>
                         <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Nhập Mã Học Sinh</label>
                            <input
                                type="text"
                                value={regId}
                                onChange={(e) => setRegId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                                placeholder="Ví dụ: 5140821837"
                            />
                        </div>
                        <button
                            onClick={checkStudentId}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-bold py-3 rounded-xl shadow-md hover:opacity-90 transition-all mt-2"
                        >
                            {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
                        </button>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                            <div className="text-sm text-gray-500">Xin chào bạn</div>
                            <div className="text-xl font-bold text-pink-600">{regName}</div>
                            <div className="text-sm font-bold text-gray-600">Lớp: {regClass}</div>
                        </div>
                        <div>
                            <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Tạo Mật Khẩu Mới</label>
                            <input
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                                placeholder="Nhập mật khẩu tự chọn..."
                            />
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white font-bold py-3 rounded-xl shadow-md hover:opacity-90 transition-all"
                        >
                            {loading ? 'Đang tạo...' : 'Hoàn tất & Đăng nhập'}
                        </button>
                    </div>
                )}
            </div>
        ) : (
            // LOGIN FORM
            <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
            {role === 'STUDENT' && (
                <>
                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Mã học sinh</label>
                    <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                    placeholder="Nhập mã số..."
                    required
                    />
                </div>
                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Mật khẩu</label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                    placeholder="Nhập mật khẩu..."
                    required
                    />
                </div>
                <div className="text-center mt-2">
                    <button type="button" onClick={() => setIsRegistering(true)} className="text-sm text-pink-500 font-bold hover:underline">
                        Chưa có mật khẩu? Đăng ký ngay
                    </button>
                </div>
                </>
            )}

            {role === 'TEACHER' && (
                <>
                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Email Nhà Trường</label>
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                    placeholder="Nhập email..."
                    required
                    />
                </div>
                {/* Thêm trường SĐT cho giáo viên */}
                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Số điện thoại</label>
                    <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                    placeholder="Nhập số điện thoại..."
                    required
                    />
                </div>
                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Mật khẩu</label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                    placeholder="Nhập mật khẩu..."
                    required
                    />
                </div>
                <div className="text-center mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-[10px] text-purple-600 italic">
                        💡 Đăng nhập để sử dụng chức năng <b>Nhập vai Robot Nhí Nhố</b> và quản lý báo cáo.
                    </p>
                </div>
                </>
            )}

            {role === 'ADMIN' && (
                <div>
                <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">Mã quản trị</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-yellow-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-gray-300 transition-all"
                    placeholder="Nhập mã bảo mật..."
                    required
                />
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs text-center font-bold">
                {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg hover:opacity-90 transition-all transform active:scale-95"
            >
                {loading ? 'Đang vào lớp...' : 'Đăng Nhập'}
            </button>
            </form>
        )}
      </div>
      <div className="fixed bottom-4 text-xs text-gray-400 font-medium">
         Phiên bản Trường Học Hạnh Phúc 1.0
      </div>
    </div>
  );
};