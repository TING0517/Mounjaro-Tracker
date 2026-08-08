import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Plus, Settings, Archive } from 'lucide-react';
import { getAvailableDoses, calculateClicks, getPenDetails, INJECTION_SITES } from '../constants/doseConfig';

export default function PenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [pen, setPen] = useState(null);
  const [injections, setInjections] = useState([]);
  const [includeLeftover, setIncludeLeftover] = useState(false);
  
  // Injection Form State
  const [showInjectForm, setShowInjectForm] = useState(false);
  const [injectDate, setInjectDate] = useState(new Date().toISOString().split('T')[0]);
  const [injectDose, setInjectDose] = useState('');
  const [injectSite, setInjectSite] = useState(INJECTION_SITES[0]);
  const [injectWeight, setInjectWeight] = useState(userData?.weight || '');

  useEffect(() => {
    if (!currentUser || !id) return;

    const fetchPen = async () => {
      const docRef = doc(db, 'pens', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPen({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/pens');
      }
    };
    fetchPen();

    const q = query(
      collection(db, 'injections'),
      where('penId', '==', id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const injData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        // if same date, sort by createdAt desc
        if (timeA === timeB) {
          const createA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const createB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return createB - createA;
        }
        return timeB - timeA;
      });
      setInjections(injData);
    });

    return unsubscribe;
  }, [id, currentUser, navigate]);

  if (!pen) return <div className="p-4 flex justify-center text-primary-500">載入中...</div>;

  const totalUsed = injections.reduce((sum, inj) => sum + Number(inj.dose), 0);
  const penConfig = getPenDetails(pen.totalDose);
  const maxAvailable = penConfig.baseTotal + (includeLeftover ? penConfig.leftover : 0);
  const remaining = Math.max(0, maxAvailable - totalUsed);
  const remainingPercent = (remaining / maxAvailable) * 100;

  const availableDoses = getAvailableDoses(pen.totalDose);
  const currentClicks = injectDose ? calculateClicks(pen.totalDose, injectDose) : 0;

  const handleInject = async (e) => {
    e.preventDefault();
    if (!injectDose || !injectWeight) return;

    const weightNum = Number(injectWeight);
    // BMI = weight (kg) / (height (m) * height (m))
    const heightM = userData.height / 100;
    const bmi = weightNum / (heightM * heightM);

    try {
      await addDoc(collection(db, 'injections'), {
        userId: currentUser.uid,
        penId: id,
        date: injectDate,
        dose: Number(injectDose),
        clicks: currentClicks,
        site: injectSite,
        weight: weightNum,
        bmi: Number(bmi.toFixed(2)),
        createdAt: new Date()
      });

      setShowInjectForm(false);
      setInjectDose('');
    } catch (err) {
      console.error(err);
      alert('紀錄失敗');
    }
  };

  const handleArchive = async () => {
    if (confirm('確定要將這支筆歸檔嗎？')) {
      await updateDoc(doc(db, 'pens', id), {
        status: 'archived'
      });
      navigate('/pens');
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-gray-900">{pen.totalDose}mg 猛見樂</h1>
        <button onClick={handleArchive} className="p-2 -mr-2 text-gray-400 hover:text-red-500 transition-colors" title="歸檔">
          <Archive size={20} />
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">剩餘劑量</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">{remaining}</span>
              <span className="text-gray-500 font-medium">mg</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">總劑量 {maxAvailable}mg</p>
            <p className="text-sm font-medium text-primary-500">{Math.round(remainingPercent)}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${remainingPercent}%` }}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-xl">
          <input
            type="checkbox"
            checked={includeLeftover}
            onChange={(e) => setIncludeLeftover(e.target.checked)}
            className="w-4 h-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500 accent-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">包含殘劑 (抽取餘藥 +{penConfig.leftover}mg)</span>
        </label>
      </div>

      {/* Add Injection Button */}
      {pen.status === 'active' && (
        <button
          onClick={() => setShowInjectForm(true)}
          className="w-full bg-primary-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary-500/30 hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-8"
        >
          <Plus size={24} />
          新增施打紀錄
        </button>
      )}

      {/* Inject Form Modal (Simplified inline) */}
      {showInjectForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 pb-safe animate-slide-up h-[85svh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">施打紀錄</h2>
              <button onClick={() => setShowInjectForm(false)} className="text-gray-400 p-2">✕</button>
            </div>
            
            <form onSubmit={handleInject} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
                <input
                  type="date"
                  value={injectDate}
                  onChange={e => setInjectDate(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">本次施打劑量</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableDoses.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setInjectDose(d.toString())}
                      className={`py-3 rounded-xl font-medium border-2 transition-all ${
                        injectDose === d.toString() 
                          ? 'border-primary-500 bg-primary-50 text-primary-700' 
                          : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {d}mg
                    </button>
                  ))}
                </div>
              </div>

              {injectDose && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-primary-800 font-medium text-sm">請將刻度轉至</span>
                  <span className="text-2xl font-bold text-primary-600">{currentClicks} 格</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">施打部位</label>
                <select
                  value={injectSite}
                  onChange={e => setInjectSite(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {INJECTION_SITES.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">本日體重 (公斤)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={injectWeight}
                  onChange={e => setInjectWeight(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="例如: 65.5"
                />
              </div>

              <div className="pt-4 pb-4">
                <button
                  type="submit"
                  disabled={!injectDose || !injectWeight}
                  className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl disabled:opacity-50"
                >
                  確認紀錄
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History List */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4 px-1">歷史施打紀錄</h3>
        <div className="space-y-3">
          {injections.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">尚未有施打紀錄</p>
          ) : (
            injections.map(inj => (
              <div key={inj.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-lg mb-0.5">{inj.dose}mg</p>
                  <p className="text-xs text-gray-500 flex gap-2">
                    <span>{inj.date}</span>
                    <span>•</span>
                    <span>{inj.site}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-700">{inj.weight} kg</p>
                  <p className="text-[10px] text-gray-400">BMI {inj.bmi}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
