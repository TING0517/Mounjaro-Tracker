import { Outlet, NavLink } from 'react-router-dom';
import { Home, Syringe, User } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  return (
    <div className="flex flex-col h-[100svh] bg-gray-50 pb-safe">
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto min-h-full bg-white shadow-sm">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe-bottom z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
          <NavLink
            to="/"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center w-16 h-full transition-colors",
              isActive ? "text-primary-500" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Home size={24} strokeWidth={2.5} />
            <span className="text-[10px] mt-1 font-medium">總覽</span>
          </NavLink>
          
          <NavLink
            to="/pens"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center w-16 h-full transition-colors",
              isActive ? "text-primary-500" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Syringe size={24} strokeWidth={2.5} />
            <span className="text-[10px] mt-1 font-medium">我的筆</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center w-16 h-full transition-colors",
              isActive ? "text-primary-500" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <User size={24} strokeWidth={2.5} />
            <span className="text-[10px] mt-1 font-medium">設定</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
