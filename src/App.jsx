import { useState } from "react";
import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar/sideBar";
import Dashboard from "./pages/Dashboard/dashboard";
import Login from "./pages/Login/login";
import { ProtectedRoute } from "./router/ProtectedRoute";
import Xodimlar from "./pages/Xodimlar/xodimlar";
import Header from "./components/Header/header";

function AdminLayout({ theme, onToggleTheme }) {
  return (
    <div className="admin-shell flex min-h-screen" data-theme={theme}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header theme={theme} onToggleTheme={onToggleTheme} />
        <main className="admin-content flex-1 p-4">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("admin-theme") === "light" ? "light" : "dark";
  });

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("admin-theme", nextTheme);
      return nextTheme;
    });
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AdminLayout theme={theme} onToggleTheme={toggleTheme} /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/xodimlar" element={<Xodimlar />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;