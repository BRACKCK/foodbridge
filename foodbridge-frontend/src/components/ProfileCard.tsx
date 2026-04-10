import React from "react";

interface Props {
  username: string;
  role: string;
}

const ProfileCard: React.FC<Props> = ({ username, role }) => {
  // 🔹 Role badge color
  const getBadgeClass = () => {
    switch (role) {
      case "donor":
        return "bg-primary";
      case "ngo":
        return "bg-success";
      case "volunteer":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
    }
  };

  // 🔹 Role display name
  const formatRole = () => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="card shadow-sm mb-4 border-0">
      <div className="card-body d-flex justify-content-between align-items-center">
        
        {/* Left Section */}
        <div>
          <h5 className="mb-1 fw-bold">
            Welcome, {username || "User"} 👋
          </h5>

          <p className="mb-0 text-muted">
            Logged in as <strong>{formatRole()}</strong>
          </p>
        </div>

        {/* Right Section */}
        <div>
          <span className={`badge ${getBadgeClass()} px-3 py-2`}>
            {formatRole()}
          </span>
        </div>

      </div>
    </div>
  );
};

export default ProfileCard;