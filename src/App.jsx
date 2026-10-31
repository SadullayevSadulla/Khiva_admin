import { useEffect, useState } from "react";
import { Navigate, Route, Routes, Outlet, useLocation } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import Sidebar from "./components/Sidebar/sideBar";
import Dashboard from "./pages/Dashboard/dashboard";
import Login from "./pages/Login/login";
import { ProtectedRoute } from "./router/ProtectedRoute";
import Xodimlar from "./pages/Xodimlar/xodimlar";
import EditEmployee from "./pages/Xodimlar/EditEmployee";
import Header from "./components/Header/header";
import AddEmployee from "./pages/Xodimlar/AddEmployee";
import Collaction from "./pages/Collaction/collaction";
import CollactionAdd from "./pages/Collaction/collactionAdd";
import Soon from "./pages/Soon/soon";
import News from "./pages/News/news";
import NewsAdd from "./pages/News/newsAdd";

const soonPaths = [
  "/elonlar",
  "/galereya",
  "/foydalanuvchilar",
  "/sorovlar",
  "/chipta-tariflari",
  "/sotilgan-chiptalar",
  "/adminlar",
];

const antPalette = {
  light: { primary: "#c4501a", teal: "#137a8e", surface: "#ffffff", line: "#d6e0dd", text: "#14282e" },
  dark: { primary: "#ee7b3e", teal: "#3bb0c4", surface: "#122328", line: "#24404a", text: "#ede8dc" },
};

function AdminLayout({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Sahifa almashganda mobil menyu yopiladi
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="admin-shell" data-theme={theme}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="admin-main">
        <Header theme={theme} onToggleTheme={onToggleTheme} onMenu={() => setMenuOpen(true)} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("admin-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("admin-theme", nextTheme);
      return nextTheme;
    });
  };

  const p = antPalette[theme];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: p.primary,
          colorInfo: p.teal,
          colorBgContainer: p.surface,
          colorBgElevated: p.surface,
          colorBorder: p.line,
          colorBorderSecondary: p.line,
          colorText: p.text,
          borderRadius: 10,
          fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif",
        },
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><AdminLayout theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/xodimlar" element={<Xodimlar />} />
          <Route path="/xodimlar/qoshish" element={<AddEmployee />} />
          <Route path="/xodimlar/tahrirlash/:id" element={<EditEmployee />} />
          <Route path="/collaction" element={<Collaction />} />
          <Route path="/collaction/add" element={<CollactionAdd />} />
          <Route path="/collaction/add/:cid" element={<CollactionAdd />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/add" element={<NewsAdd />} />
          <Route path="/news/add/:id" element={<NewsAdd />} />
          {soonPaths.map((path) => (
            <Route key={path} path={path} element={<Soon />} />
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default App;