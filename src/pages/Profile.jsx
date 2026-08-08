import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { LogOut, User, Ruler } from 'lucide-react';

export default function Profile({ setupMode = false }) {
  const { userData, updateUserData } = useAuth();
  const navigate = useNavigate();
  
  const [height, setHeight] = useState(userData?.height || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!height) return;
    
    setLoading(true);
    await updateUserData({ height: Number(height) });
    setLoading(false);
    
    if (setupMode) {
      navigate('/');
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {setupMode ? '歡迎！請設定基本資料' : '個人設定'}
        </h1>
        <p className="text-gray-500 mt-1">
          {setupMode ? '我們需要您的身高來計算 BMI' : '管理您的個人資料'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <form onSubmit={handleSave}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Ruler size={16} className="text-primary-500" />
              身高 (公分)
            </label>
            <input
              type="number"
              required
              min="100"
              max="250"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="例如: 165"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !height}
            className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? '儲存中...' : '儲存設定'}
          </button>
        </form>
      </div>

      {!setupMode && (
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          <LogOut size={20} />
          登出
        </button>
      )}
    </div>
  );
}
