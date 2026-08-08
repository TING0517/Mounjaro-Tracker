import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Plus, Syringe, Archive, CalendarDays, MapPin, DollarSign } from 'lucide-react';
import { PEN_TYPES } from '../constants/doseConfig';

export default function Pens() {
  const { currentUser } = useAuth();
  const [pens, setPens] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active | archived

  // Form State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [totalDose, setTotalDose] = useState('5');

  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'pens'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pensData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setPens(pensData);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleAddPen = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'pens'), {
        userId: currentUser.uid,
        startDate,
        location,
        price: Number(price) || 0,
        totalDose,
        status: 'active',
        createdAt: new Date()
      });
      setShowForm(false);
      // Reset form
      setLocation('');
      setPrice('');
      setTotalDose('5');
    } catch (err) {
      console.error(err);
      alert('新增失敗');
    }
  };

  const filteredPens = pens.filter(p => p.status === activeTab);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的筆</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-100 text-primary-600 p-2 rounded-full hover:bg-primary-200 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'active' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('active')}
        >
          使用中
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'archived' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('archived')}
        >
          已歸檔
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAddPen} className="bg-white p-5 rounded-2xl shadow-sm border border-primary-100 mb-6">
          <h2 className="font-bold text-lg mb-4 text-gray-800">新增猛見樂</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">規格</label>
              <select
                value={totalDose}
                onChange={e => setTotalDose(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {PEN_TYPES.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">首次施打日期</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">取得地點</label>
                <input
                  type="text"
                  placeholder="診所/藥局"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">價格</label>
                <input
                  type="number"
                  placeholder="NT$"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl text-sm hover:bg-primary-600 active:bg-primary-700"
            >
              儲存
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-4">
        {filteredPens.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Syringe size={48} className="mx-auto mb-3 opacity-20" />
            <p>尚無{activeTab === 'active' ? '使用中' : '已歸檔'}的筆</p>
          </div>
        ) : (
          filteredPens.map(pen => (
            <Link
              key={pen.id}
              to={`/pens/${pen.id}`}
              className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${pen.status === 'active' ? 'bg-primary-50 text-primary-500' : 'bg-gray-100 text-gray-500'}`}>
                    <Syringe size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{pen.totalDose}mg 規格</h3>
                    <p className="text-xs text-gray-500">
                      {pen.status === 'active' ? '使用中' : '已歸檔'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarDays size={14} />
                  <span>{pen.startDate}</span>
                </div>
                {pen.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={14} />
                    <span>{pen.location}</span>
                  </div>
                )}
                {pen.price > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <DollarSign size={14} />
                    <span>${pen.price.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
