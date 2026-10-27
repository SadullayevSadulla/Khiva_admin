import { Button } from 'antd';
import { MoonOutlined, SunOutlined, MenuOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import './header.css';

export default function Header({ theme, onToggleTheme }) {
  const { pathname } = useLocation();
  const pageTitles = {
    '/dashboard': 'Bosh Menyu',
    '/xodimlar': 'Xodimlar',
    '/kolleksiyalar': 'Kolleksiyalar',
    '/yangiliklar': 'Yangiliklar',
    '/elonlar': "E'lonlar",
    '/galereya': 'Galereya',
    '/foydalanuvchilar': 'Foydalanuvchilar',
    '/sorovlar': "So'rovlar",
    '/chipta-tariflari': "Chipta Ta'riflari",
    '/sotilgan-chiptalar': 'Sotilgan Chiptalar',
    '/adminlar': 'Adminlar',
  };

  return (
    <header className="khiva-header">
      <div className="header-left">
        <span className="header-page-title">{pageTitles[pathname] || 'Bosh Menyu'}</span>
      </div>
      
      <div className="header-right">
        <Button 
          type="text" 
          icon={theme === 'dark' ? <MoonOutlined style={{ color: '#f59e0b', fontSize: '18px' }} /> : <SunOutlined style={{ color: '#f59e0b', fontSize: '18px' }} />} 
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}
          title={theme === 'dark' ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}
          className="theme-toggle-btn"
        />
      </div>
    </header>
  );
}