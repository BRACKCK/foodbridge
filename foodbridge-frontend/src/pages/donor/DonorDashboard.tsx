import { useState } from "react";

interface Donation {
  id: number;
  food: string;
  quantity: string;
  status: string;
}

const DonorDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([
    {
      id: 1,
      food: "Rice & Beans",
      quantity: "10 kg",
      status: "Pending",
    },
  ]);

  const [formData, setFormData] = useState({
    food: "",
    quantity: "",
    expiry: "",
  });

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.placeholder.toLowerCase().replace(" ", "")]: e.target.value,
    });
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newDonation: Donation = {
      id: donations.length + 1,
      food: formData.food,
      quantity: formData.quantity,
      status: "Pending",
    };

    setDonations([...donations, newDonation]);

    // Clear form
    setFormData({
      food: "",
      quantity: "",
      expiry: "",
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Donor Dashboard</h2>

      {/* 🔹 Stats */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary shadow">
            <div className="card-body">
              <h5>Total Donations</h5>
              <h3>{donations.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Form */}
      <div className="card mb-4 shadow">
        <div className="card-body">
          <h5 className="mb-3">Post a Donation</h5>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Food"
                  value={formData.food}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <input
                  type="datetime-local"
                  className="form-control"
                  placeholder="Expiry"
                  value={formData.expiry}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry: e.target.value })
                  }
                />
              </div>
            </div>

            <button className="btn btn-primary">Submit Donation</button>
          </form>
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="card shadow">
        <div className="card-body">
          <h5 className="mb-3">My Donations</h5>

          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Food</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>{donation.id}</td>
                  <td>{donation.food}</td>
                  <td>{donation.quantity}</td>
                  <td>
                    <span
                      className={`badge ${
                        donation.status === "Collected"
                          ? "bg-success"
                          : "bg-warning"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;