import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DonorDashboard from "./pages/donor/DonorDashboard";
import NGODashboard from "./pages/ngo/NGODashboard";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

/**
 * PageShell wraps every route's content so it stretches to fill the
 * remaining vertical space below the Navbar. The Navbar itself is
 * always rendered at the top, so the shell only needs flex: 1.
 */
const PageShell = ({ children }: { children: React.ReactNode }) => (
  <main className="page-fill">{children}</main>
);

function App() {
  return (
    <Router>
      {/* Navbar sits outside the scroll area — always visible at top */}
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <PageShell>
              <Home />
            </PageShell>
          }
        />
        <Route
          path="/login"
          element={
            <PageShell>
              <Login />
            </PageShell>
          }
        />
        <Route
          path="/register"
          element={
            <PageShell>
              <Register />
            </PageShell>
          }
        />
        <Route
          path="/donor-dashboard"
          element={
            <PageShell>
              <DonorDashboard />
            </PageShell>
          }
        />
        <Route
          path="/ngo-dashboard"
          element={
            <PageShell>
              <NGODashboard />
            </PageShell>
          }
        />
        <Route
          path="/volunteer-dashboard"
          element={
            <PageShell>
              <VolunteerDashboard />
            </PageShell>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <PageShell>
              <AdminDashboard />
            </PageShell>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;