import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DonorDashboard from "./pages/donor/DonorDashboard";
import NGODashboard from "./pages/ngo/NGODashboard";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import ProfilePageWrapper from "./pages/ProfilePageWrapper";

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <main className="page-fill">{children}</main>
);

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<PageShell><Home /></PageShell>} />
        <Route path="/login" element={<PageShell><Login /></PageShell>} />
        <Route path="/register" element={<PageShell><Register /></PageShell>} />
        <Route path="/profile" element={<PageShell><ProfilePageWrapper /></PageShell>} />
        <Route path="/donor-dashboard" element={<PageShell><DonorDashboard /></PageShell>} />
        <Route path="/ngo-dashboard" element={<PageShell><NGODashboard /></PageShell>} />
        <Route path="/volunteer-dashboard" element={<PageShell><VolunteerDashboard /></PageShell>} />
        <Route path="/payment/success" element={<PageShell><PaymentSuccess /></PageShell>} />
        <Route path="/payment/cancel" element={<PageShell><PaymentCancel /></PageShell>} />
        <Route path="/admin-dashboard" element={<PageShell><AdminDashboard /></PageShell>} />
      </Routes>
    </Router>
  );
}

export default App;