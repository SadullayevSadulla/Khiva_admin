import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  Megaphone,
  Briefcase,
  Layers,
  Image as ImageIcon,
  Users,
  Mail,
  Ticket,
  CheckSquare,
  UserCog,
  ArrowUpRight,
} from 'lucide-react';
import api, { fileUrl } from '../../api';
import Loader from '../../components/Loader/loader';
import { countOf, STAT_SOURCES } from './dashboardApi';
import './dashboard.css';

const getMainImage = (item) =>
  fileUrl(item.images?.find((image) => image.mainImage)?.url || item.images?.[0]?.url);

function FeedItem({ item }) {
  const image = getMainImage(item);

  return (
    <article className="feed-item">
      <div className="feed-thumb">
        {image ? <img src={image} alt={item.title?.uz || ''} /> : <img src="/logo.png" alt="" className="feed-thumb-empty" />}
      </div>
      <div className="feed-body">
        <h3 className="feed-title">{item.title?.uz || 'Nomsiz'}</h3>
        <div
          dangerouslySetInnerHTML={{ __html: item.description?.uz || '' }}
          className="feed-text"
        />
      </div>
    </article>
  );
}

const SOURCE = Object.fromEntries(STAT_SOURCES.map((source) => [source.key, source]));

const CARDS = [
  { key: 'news', icon: Newspaper, tone: 'teal', span: 'wide' },
  { key: 'announcements', icon: Megaphone, tone: 'accent' },
  { key: 'collections', icon: Layers, tone: 'purple', span: 'wide' },
  { key: 'gallery', icon: ImageIcon, tone: 'blue' },
  { key: 'employees', icon: Briefcase, tone: 'ok' },
  { key: 'admins', icon: UserCog, tone: 'teal' },
  { key: 'users', icon: Users, tone: 'blue' },
  { key: 'requests', icon: Mail, tone: 'pink' },
];

const fmt = (value) => (value === undefined ? '…' : value === null ? '—' : value.toLocaleString('en-US'));

function Stat({ icon: Icon, label, value, to, tone, span }) {
  return (
    <Link to={to} className={`stat stat-${tone} ${span ? `stat-${span}` : ''}`} title={`${label} bo'limiga o'tish`}>
      <Icon className="stat-mark" size={104} strokeWidth={1.4} aria-hidden="true" />
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={21} />
        </span>
      </div>
      <div className="stat-bottom">
        <div className="stat-value">{fmt(value)}</div>
        <div className="stat-label">{label}</div>
      </div>
    </Link>
  );
}

function HeroStat({ orders, tickets }) {
  return (
    <div className="stat-hero">
      <Ticket className="stat-hero-mark" size={190} strokeWidth={1.2} aria-hidden="true" />

      <Link to={SOURCE.orders.to} className="stat-hero-main" title="Sotilgan chiptalar bo'limiga o'tish">
        <span className="stat-hero-label">
          <CheckSquare size={18} /> Sotilgan chiptalar
        </span>
        <strong className="stat-hero-value">{fmt(orders)}</strong>
        <span className="stat-hero-note">Barcha tasdiqlangan buyurtmalar</span>
      </Link>

      <Link to={SOURCE.tickets.to} className="stat-hero-sub" title="Chipta tariflari bo'limiga o'tish">
        <Ticket size={16} />
        <span>Chipta tariflari</span>
        <b>{fmt(tickets)}</b>
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const [news, setNews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboardContent = async () => {
      setLoading(true);
      setLoadError('');

      const [newsResult, announcementsResult] = await Promise.allSettled([
        api.get('/api/news'),
        api.get('/api/announcement'),
      ]);

      if (!active) return;

      if (newsResult.status === 'fulfilled') {
        const newsData = newsResult.value.data?.data;
        setNews(Array.isArray(newsData) ? newsData : []);
      }

      if (announcementsResult.status === 'fulfilled') {
        const announcementData = announcementsResult.value.data?.data;
        setAnnouncements(Array.isArray(announcementData) ? announcementData : []);
      }

      if (newsResult.status === 'rejected' && announcementsResult.status === 'rejected') {
        setLoadError('Yangilik va e’lonlarni yuklab bo‘lmadi. API manzilini tekshiring.');
      }

      setLoading(false);
    };

    loadDashboardContent();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    STAT_SOURCES.forEach(({ key, url }) => {
      countOf(url)
        .then((count) => active && setStats((prev) => ({ ...prev, [key]: count })))
        .catch((err) => {
          console.warn(`Statistika (${url}):`, err.response?.status || err.message);
          if (active) setStats((prev) => ({ ...prev, [key]: null }));
        });
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="dash">
      {loadError && <p className="dash-error">{loadError}</p>}

      <div className="stats">
        <HeroStat orders={stats.orders} tickets={stats.tickets} />
        {CARDS.map(({ key, icon, tone, span }) => (
          <Stat
            key={key}
            icon={icon}
            tone={tone}
            span={span}
            label={SOURCE[key].label}
            to={SOURCE[key].to}
            value={stats[key]}
          />
        ))}
      </div>

      <div className="feeds">
        <section className="panel feed">
          <h2 className="feed-heading">So'nggi yangiliklar</h2>
          {news.length ? (
            news.map((item) => <FeedItem key={item.id} item={item} />)
          ) : (
            <p className="feed-empty">Hozircha yangiliklar yo'q.</p>
          )}
        </section>

        <section className="panel feed">
          <h2 className="feed-heading">So'nggi e'lonlar</h2>
          {announcements.length ? (
            announcements.map((item) => <FeedItem key={item.id} item={item} />)
          ) : (
            <p className="feed-empty">Hozircha e'lonlar yo'q.</p>
          )}
        </section>
      </div>
    </div>
  );
}