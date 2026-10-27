import { useEffect, useState } from 'react';
import api from '../../api';

export default function Dashboard() {
  const [news, setNews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
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

  const getMainImage = (item) =>
    item.images?.find((image) => image.mainImage)?.url || item.images?.[0]?.url;

  return (
    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
      {loadError && <p className="md:col-span-2 text-red-500">{loadError}</p>}
      <section>
        <h1 className="mb-2 text-xl font-bold">So'nggi yangiliklar</h1>
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {loading ? <p>Yangiliklar yuklanmoqda...</p> : news.length ? news.slice(0, 3).map((item) => (
            <article key={item.id} className="w-full min-w-0 rounded-lg bg-light-main shadow dark:bg-dark-main">
              {getMainImage(item) && (
                <div className="group mb-2 aspect-video w-full overflow-hidden rounded-t-lg">
                  <img src={getMainImage(item)} alt={item.title?.uz || ''} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 px-2 pb-2">
                <h2 className="min-h-10 line-clamp-2 text-lg font-medium leading-[110%]">
                  {item.title?.uz}
                </h2>
                <div
                  dangerouslySetInnerHTML={{ __html: item.description?.uz || '' }}
                  className="my-2 line-clamp-3 text-sm leading-[130%]"
                />
              </div>
            </article>
          )) : <p>Hozircha yangiliklar yo'q.</p>}
        </div>
      </section>

      <section>
        <h1 className="mb-2 text-xl font-bold">So'nggi e'lonlar</h1>
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {loading ? <p>E’lonlar yuklanmoqda...</p> : announcements.length ? announcements.slice(0, 2).map((item) => (
            <article key={item.id} className="w-full min-w-0 rounded-lg bg-light-main shadow dark:bg-dark-main">
              {getMainImage(item) && (
                <div className="group mb-2 aspect-video w-full overflow-hidden rounded-t-lg">
                  <img src={getMainImage(item)} alt={item.title?.uz || ''} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 px-2 pb-2">
                <h2 className="min-h-10 line-clamp-2 text-lg font-medium leading-[110%]">
                  {item.title?.uz}
                </h2>
                <div
                  dangerouslySetInnerHTML={{ __html: item.description?.uz || '' }}
                  className="my-2 line-clamp-3 text-sm leading-[130%]"
                />
              </div>
            </article>
          )) : <p>Hozircha e'lonlar yo'q.</p>}
        </div>
      </section>
    </div>
  );
}
