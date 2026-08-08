import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Scale, Clock, AlertCircle } from 'lucide-react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';

export default function Dashboard() {
  const { currentUser, userData } = useAuth();
  const [injections, setInjections] = useState([]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'injections'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        if (timeA === timeB) {
          const createA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const createB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return createA - createB;
        }
        return timeA - timeB; // ascending
      });
      setInjections(data);
    });

    return unsubscribe;
  }, [currentUser]);

  if (injections.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-primary-50 text-primary-300 rounded-full flex items-center justify-center mb-6">
          <Activity size={48} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">歡迎使用猛見樂紀錄</h2>
        <p className="text-gray-500 mb-8 text-sm max-w-[260px]">
          您還沒有任何施打紀錄，請先新增您的第一支猛見樂筆並記錄施打。
        </p>
        <Link 
          to="/pens"
          className="bg-primary-500 text-white px-8 py-3.5 rounded-full font-medium shadow-lg shadow-primary-500/30 active:scale-95 transition-all"
        >
          前往我的筆
        </Link>
      </div>
    );
  }

  const latest = injections[injections.length - 1];
  const first = injections[0];
  
  const weightDiff = (latest.weight - first.weight).toFixed(1);
  const bmiDiff = (latest.bmi - first.bmi).toFixed(1);

  // Countdown logic (Default 7 days)
  const nextInjectionDate = addDays(parseISO(latest.date), 7);
  const daysUntilNext = differenceInDays(nextInjectionDate, new Date());
  
  const chartData = injections.map(inj => ({
    date: format(parseISO(inj.date), 'MM/dd'),
    weight: inj.weight,
    bmi: inj.bmi
  }));

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{userData?.displayName || '使用者'} 您好</h1>
        <p className="text-gray-500 text-sm">追蹤您的減重進度</p>
      </header>

      {/* Countdown Card */}
      <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-500/20">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Clock size={24} className="text-white" />
          </div>
          <span className="text-primary-100 text-xs font-medium bg-black/10 px-3 py-1 rounded-full">
            每週一次
          </span>
        </div>
        
        {daysUntilNext < 0 ? (
          <div>
            <h3 className="text-3xl font-bold mb-1">已超時 {Math.abs(daysUntilNext)} 天</h3>
            <p className="text-primary-100 text-sm flex items-center gap-1.5">
              <AlertCircle size={16} /> 建議盡快安排施打
            </p>
          </div>
        ) : daysUntilNext === 0 ? (
          <div>
            <h3 className="text-3xl font-bold mb-1">就是今天！</h3>
            <p className="text-primary-100 text-sm">請記得施打您的猛見樂</p>
          </div>
        ) : (
          <div>
            <p className="text-primary-100 text-sm mb-0.5">距離下次施打還有</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold">{daysUntilNext}</span>
              <span className="text-primary-100">天</span>
            </div>
            <p className="text-xs text-primary-200 mt-2">預計日期: {format(nextInjectionDate, 'yyyy/MM/dd')}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-3">
            <Scale size={18} />
            <span className="text-sm font-medium">目前體重</span>
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-3xl font-bold text-gray-900">{latest.weight}</span>
            <span className="text-gray-500 mb-1">kg</span>
          </div>
          <div className={`text-xs font-medium flex items-center gap-1 ${Number(weightDiff) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Number(weightDiff) > 0 ? '↑' : '↓'} {Math.abs(Number(weightDiff))} kg
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-3">
            <Activity size={18} />
            <span className="text-sm font-medium">目前 BMI</span>
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-3xl font-bold text-gray-900">{latest.bmi}</span>
          </div>
          <div className={`text-xs font-medium flex items-center gap-1 ${Number(bmiDiff) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Number(bmiDiff) > 0 ? '↑' : '↓'} {Math.abs(Number(bmiDiff))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6">體重變化趨勢</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                dy={10}
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#f97316', fontWeight: 600 }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                name="體重"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
