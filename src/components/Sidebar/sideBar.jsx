import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './sideBar.css';
import { 
  Home, 
  Briefcase, 
  Layers, 
  Newspaper, 
  Megaphone, 
  Image as ImageIcon, 
  Users, 
  Mail, 
  Ticket, 
  CheckSquare, 
  UserCog, 
  LogOut 
} from 'lucide-react';

const SideBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <img src="/logo.png" alt="Logo" onError={(e) => {
            e.target.style.display = 'none';
          }} />
        </div>
        <h1 className="logo-title">Khiva<span>Museum</span></h1>
      </div>

      <ul className="sidebar-menu">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Home size={20} /></span>
            <span className="text">Bosh menyu</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/xodimlar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Briefcase size={20} /></span>
            <span className="text">Xodimlar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/kolleksiyalar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Layers size={20} /></span>
            <span className="text">Kolleksiyalar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/yangiliklar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Newspaper size={20} /></span>
            <span className="text">Yangiliklar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/elonlar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Megaphone size={20} /></span>
            <span className="text">E'lonlar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/galereya" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><ImageIcon size={20} /></span>
            <span className="text">Galereya</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/foydalanuvchilar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Users size={20} /></span>
            <span className="text">Foydalanuvchilar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/sorovlar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Mail size={20} /></span>
            <span className="text">So'rovlar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/chipta-tariflari" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><Ticket size={20} /></span>
            <span className="text">Chipta Ta'riflari</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/sotilgan-chiptalar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><CheckSquare size={20} /></span>
            <span className="text">Sotilgan Chiptalar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/adminlar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="icon"><UserCog size={20} /></span>
            <span className="text">Adminlar</span>
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">SS</div>
          <span className="user-name">Sadulla Sadullayev</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
};

export default SideBar;