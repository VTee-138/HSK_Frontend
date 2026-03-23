import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, 
  Layout, 
  LogOut, 
  MoreVertical,
  Rocket,
} from 'lucide-react';
import { getUserInfo, logout } from '../services/AuthService';

export default function UserSidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const userInfo = getUserInfo();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  const menuItems = [
    { icon: Layout, label: "Tổng quan", path: "/dashboard" },
    { icon: User, label: "Đề thi", path: "/exam" },
    // { icon: BookOpen, label: "Tin tức", path: "/blog" },
    { icon: Rocket, label: "Lịch sử thi", path: "/exam-history" },
    // { icon: BookOpen, label: "Khóa học của tôi", path: "/my-courses" },
    // { icon: FileText, label: "Tài liệu", path: "/documents" },
    // { icon: Target, label: "Phòng thi", path: "/exam-rooms" },
  ];

  const handleLogout = () => {
    logout();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="p-4">
  <Link
    to="/"
    className="group flex items-center gap-3 px-3 py-2 rounded-2xl transition-all hover:bg-gray-100"
  >
    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-md group-hover:shadow-lg transition-all">
      <img
        src="/logo.png"
        alt="86HSK"
        className="w-14 h-14 object-contain"
      />
    </div>

    <span className="text-lg font-bold text-gray-900 tracking-wide">
    86<span className="text-red-600">HSK</span>
    </span>
  </Link>
</div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium group
                  ${isActive 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon size={20} className={isActive ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-900'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section (Bottom) */}
        <div className="p-4 border-t border-gray-100" ref={userMenuRef}>
          <div className="relative">
            {/* User Info Trigger */}
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center text-red-600 font-bold border border-red-200">
                  {userInfo?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">{userInfo?.username || "Học viên"}</p>
                  <p className="text-xs text-gray-500 truncate">{userInfo?.email || "user@example.com"}</p>
                </div>
              </div>
              <MoreVertical size={18} className="text-gray-400 group-hover:text-gray-600" />
            </button>

            {/* Popover Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                  onClick={() => { setIsUserMenuOpen(false); setIsSidebarOpen(false); }}
                >
                  <User size={18} />
                  Thông tin cá nhân
                </Link>
                <div className="h-px bg-gray-100"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors text-left"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
