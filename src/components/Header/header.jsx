import { Moon, Sun, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './header.css';

const pageTitles = {
  '/dashboard': 'Bosh menyu',
  '/xodimlar': 'Xodimlar',
  '/kolleksiyalar': 'Kolleksiyalar',
  '/news': 'Yangiliklar',
  '/news/add': "Yangilik qo'shish",
  '/elonlar': "E'lonlar",
  '/galereya': 'Galereya',
  '/foydalanuvchilar': 'Foydalanuvchilar',
  '/sorovlar': "So'rovlar",
  '/chipta-tariflari': "Chipta ta'riflari",
  '/sotilgan-chiptalar': 'Sotilgan chiptalar',
  '/adminlar': 'Adminlar',
  '/collaction': 'Kolleksiyalar',
  '/collaction/add': "Kolleksiya qo'shish",
};

function getTitle(pathname) {
  if (pathname.startsWith('/xodimlar/qoshish')) return "Xodim qo'shish";
  if (pathname.startsWith('/xodimlar/tahrirlash')) return 'Xodimni tahrirlash';
  if (pathname.startsWith('/collaction/add/')) return 'Kolleksiyani tahrirlash';
  if (pathname.startsWith('/news/add/')) return 'Yangilikni tahrirlash';
  return pageTitles[pathname] || 'Bosh menyu';
}

export default function Header({ theme, onToggleTheme, onMenu }) {
  const { pathname } = useLocation();
  const isDark = theme === 'dark';
  const label = isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish';

  return (
    <header className="khiva-header">
      <div className="header-left">
        <button className="icon-btn menu-toggle-btn" onClick={onMenu} aria-label="Menyuni ochish">
          <Menu size={21} />
        </button>
        <h2 className="header-page-title">{getTitle(pathname)}</h2>
      </div>

      <div className="header-right">
        <button className="icon-btn" onClick={onToggleTheme} aria-label={label} title={label}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}