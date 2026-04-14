import { useEffect, useState } from "react";
import axios from "../api/axiosInstance";

interface MoneyDonation {
  id: number;
  amount: string;
  currency: string;
  ngo_name: string;
  payment_status: string;
  message: string;
  created_at: string;
}

const MoneyDonationHistory = () => {
  const [donations, setDonations] = useState<MoneyDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get<MoneyDonation[]>("donations/money/mine/");
        setDonations(res.data);
      } catch {
        console.error("Failed to load money donations");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      completed: "bg-success",
      pending: "bg-warning",
      failed: "bg-danger",
      refunded: "bg-secondary",
    };
    return map[s] || "bg-secondary";
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary"></div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm mt-4">
      <div className="card-header bg-white border-bottom">
        <h5 className="mb-0">
          <i className="bi bi-clock-history me-2 text-primary"></i>
          My Money Donations
        </h5>
      </div>
      <div className="card-body p-0">
        {donations.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-wallet2 display-4 opacity-25"></i>
            <p className="mt-3">No money donations yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead className="table-light">
                <tr>
                  <th>NGO</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td className="fw-semibold">{d.ngo_name}</td>
                    <td className="fw-bold text-success">
                      ${d.amount} {d.currency}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(d.payment_status)}`}>
                        {d.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted fst-italic">
                        {d.message || "—"}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyDonationHistory;