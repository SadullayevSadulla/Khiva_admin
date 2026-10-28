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
            <span className="icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
              <path d="M0 0h16v16H0z" fill="none" />
              <path fill="currentColor" d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm1-1.5V4h4V2.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5m-4 7V13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5c-.418.314-.937.5-1.5.5H9v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V10H3.5A2.5 2.5 0 0 1 2 9.5M7 9v-.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V9h3.5A1.5 1.5 0 0 0 14 7.5V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1.5A1.5 1.5 0 0 0 3.5 9z" />
            </svg>
            </span>
            <span className="text">Xodimlar</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/collaction" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
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