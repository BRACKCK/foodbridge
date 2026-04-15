import { useNavigate } from "react-router-dom";
import ProfilePage from "../components/ProfilePage";

const ProfilePageWrapper = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleUsernameChange = (newUsername: string) => {
    localStorage.setItem("username", newUsername);
    // Force a re-render of the Navbar by reloading — or lift state up if preferred
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="container py-5" style={{ maxWidth: 680 }}>
      <div className="mb-4">
        <h2 className="fw-bold">
          <i className="bi bi-person-circle text-primary me-2" />
          My Account
        </h2>
        <p className="text-muted mb-0">View and update your profile information.</p>
      </div>

      <ProfilePage onUsernameChange={handleUsernameChange} />
    </div>
  );
};

export default ProfilePageWrapper;