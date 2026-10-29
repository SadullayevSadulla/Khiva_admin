import { useEffect, useState } from 'react';
import { Newspaper, Megaphone, Briefcase, Layers } from 'lucide-react';
import api, { fileUrl } from '../../api';
import Loader from '../../components/Loader/loader';
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

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat panel">
      <span className="stat-icon">
        <Icon size={22} />
      </span>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [news, setNews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [counts, setCounts] = useState({ employees: null, collections: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboardContent = async () => {
      setLoading(true);
      setLoadError('');

      const [newsResult, announcementsResult, employeesResult, collectionsResult] =
        await Promise.allSettled([
          api.get('/api/news'),
          api.get('/api/announcement'),
          api.get('/api/admin/employee'),
          api.get('/api/admin/collection'),
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

      const nextCounts = { employees: null, collections: null };
      if (employeesResult.status === 'fulfilled') {
        const list = employeesResult.value.data?.data;
        nextCounts.employees = Array.isArray(list) ? list.length : null;
      }
      if (collectionsResult.status === 'fulfilled') {
        const body = collectionsResult.value.data;
        const list = body?.data || body || [];
        nextCounts.collections = body?.total ?? body?.count ?? (Array.isArray(list) ? list.length : null);
      }
      setCounts(nextCounts);

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

  if (loading) return <Loader />;

  return (
    <div className="dash">
      {loadError && <p className="dash-error">{loadError}</p>}
      <div className="feeds">
        <section className="panel feed">
          <h2 className="feed-heading">So'nggi yangiliklar</h2>
          {news.length ? (
            news.slice(0, 3).map((item) => <FeedItem key={item.id} item={item} />)
          ) : (
            <p className="feed-empty">Hozircha yangiliklar yo'q.</p>
          )}
        </section>

        <section className="panel feed">
          <h2 className="feed-heading">So'nggi e'lonlar</h2>
          {announcements.length ? (
            announcements.slice(0, 3).map((item) => <FeedItem key={item.id} item={item} />)
          ) : (
            <p className="feed-empty">Hozircha e'lonlar yo'q.</p>
          )}
        </section>
      </div>
    </div>
  );
}