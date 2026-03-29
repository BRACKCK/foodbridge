import { useState, useEffect } from "react";
import axios from "axios";

interface Donation {
  food: string;
  quantity: string;
  expiry: string;
  status?: string;
}

function DonorDashboard() {
  // 🔹 State for form
  const [formData, setFormData] = useState({
    food: "",
    quantity: "",
    expiry: "",
  });

  // 🔹 State for saved donations
  const [donations, setDonations] = useState<Donation[]>([]);

  // 🔹 Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ THIS is where handleSubmit goes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/donations/",
        formData
      );

      setDonations([...donations, response.data]);

      setFormData({
        food: "",
        quantity: "",
        expiry: "",
      });
    } catch (error) {
      console.error("Error saving donation:", error);
    }
  };

  // 🔹 Fetch existing donations
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/donations/")
      .then((res) => setDonations(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="container mt-5">
      <h2>Donor Dashboard</h2>

      {/* 🔹 FORM */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="food"
          placeholder="Food Item"
          aria-label="Food Item"
          className="form-control my-2"
          value={formData.food}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="quantity"
          placeholder="Quantity"
          aria-label="Quantity"
          className="form-control my-2"
          value={formData.quantity}
          onChange={handleChange}
          required
        />

        <input
          type="datetime-local"
          name="expiry"
          placeholder="Expiry Date"
          aria-label="Expiry Date"
          className="form-control my-2"
          value={formData.expiry}
          onChange={handleChange}
          required
        />

        <button className="btn btn-primary">Donate</button>
      </form>

      {/* 🔹 TABLE */}
      <table className="table mt-4">
        <thead>
          <tr>
            <th>Food</th>
            <th>Quantity</th>
            <th>Expiry</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d, index) => (
            <tr key={index}>
              <td>{d.food}</td>
              <td>{d.quantity}</td>
              <td>{d.expiry}</td>
              <td>{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DonorDashboard;