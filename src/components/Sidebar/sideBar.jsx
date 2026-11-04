import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { fetchProfile, getProfileName, getAvatarUrl } from '../../pages/Profile/profileApi.js';
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
  LogOut,
  X,
} from 'lucide-react';

const MENU = [
  { to: '/dashboard', label: 'Bosh menyu', icon: Home },
  { to: '/xodimlar', label: 'Xodimlar', icon: Briefcase },
  { to: '/collaction', label: 'Kolleksiyalar', icon: Layers },
  { to: '/news', label: 'Yangiliklar', icon: Newspaper },
  { to: '/elonlar', label: "E'lonlar", icon: Megaphone },
  { to: '/galereya', label: 'Galereya', icon: ImageIcon },
  { to: '/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users },
  { to: '/requests', label: 'Sorovlar', icon:Mail  },
  { to: '/chipta-tariflari', label: "Chipta ta'riflari", icon: Ticket },
  { to: '/sotilgan-chiptalar', label: 'Sotilgan chiptalar', icon: CheckSquare },
  { to: '/adminlar', label: 'Adminlar', icon: UserCog },
];

const SideBar = ({ open = false, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetchProfile()
        .then((data) => active && setProfile(data))
        .catch(() => {});
    load();
    window.addEventListener('profile-updated', load);
    return () => {
      active = false;
      window.removeEventListener('profile-updated', load);
    };
  }, []);

  const profileName = profile ? getProfileName(profile) : 'Profil';
  const avatarUrl = profile ? getAvatarUrl(profile) : '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={onClose} aria-label="Menyuni yopish">
          <X size={20} />
        </button>

        <div className="sidebar-header">
          <img className="sidebar-logo" src="/logo.png" alt="Xiva muzeyi logotipi" />
          <div>
            <h1 className="logo-title">Xiva muzeyi</h1>
            <p className="logo-sub">Boshqaruv paneli</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Asosiy menyu">
          <ul className="sidebar-menu">
            {MENU.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profil" onClick={onClose} className="user-profile" title="Profilim">
            <div className="avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : profileName.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{profileName}</span>
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideBar;