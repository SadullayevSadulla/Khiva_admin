import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar/sideBar";
import Dashboard from "./pages/Dashboard/dashboard";

function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;