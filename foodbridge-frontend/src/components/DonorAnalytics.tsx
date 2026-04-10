import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Donation {
  id: number;
  food: string;
  quantity: string;
  expiry: string;
  status: string;
  match_score: number;
  points: number;
  badge: string;
  co2_saved: number;
  meals_saved: number;
}

interface Props {
  donations: Donation[];
}

const DonorAnalytics = ({ donations }: Props) => {
  const pendingCount = donations.filter((d) => d.status === "Pending").length;
  const acceptedCount = donations.filter((d) => d.status === "Accepted").length;
  const collectedCount = donations.filter((d) => d.status === "Collected").length;
  const deliveredCount = donations.filter((d) => d.status === "Delivered").length;

  const totalMeals = donations.reduce((sum, d) => sum + d.meals_saved, 0);
  const totalCo2 = donations.reduce((sum, d) => sum + d.co2_saved, 0);

  const pieData = {
    labels: ["Pending", "Accepted", "Collected", "Delivered"],
    datasets: [
      {
        label: "Donations by Status",
        data: [pendingCount, acceptedCount, collectedCount, deliveredCount],
        backgroundColor: ["#ffc107", "#198754", "#0dcaf0", "#0d6efd"],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: donations.map((d) => `Donation ${d.id}`),
    datasets: [
      {
        label: "Points Earned",
        data: donations.map((d) => d.points),
        backgroundColor: "#198754",
      },
    ],
  };

  const lineData = {
    labels: donations.map((d) => `Donation ${d.id}`),
    datasets: [
      {
        label: "Match Score",
        data: donations.map((d) => d.match_score),
        borderColor: "#0d6efd",
        backgroundColor: "#0d6efd",
        tension: 0.3,
      },
    ],
  };

  const impactBarData = {
    labels: ["Meals Saved", "CO₂ Saved"],
    datasets: [
      {
        label: "Impact Overview",
        data: [totalMeals, totalCo2],
        backgroundColor: ["#fd7e14", "#6f42c1"],
      },
    ],
  };

  return (
    <div className="mt-5">
      <h3 className="mb-4">Analytics Dashboard</h3>

      <div className="row mb-4">
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3">
            <h5 className="text-center mb-3">Donation Status Distribution</h5>
            <Pie data={pieData} />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3">
            <h5 className="text-center mb-3">Impact Overview</h5>
            <Bar data={impactBarData} />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3">
            <h5 className="text-center mb-3">Points Per Donation</h5>
            <Bar data={barData} />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3">
            <h5 className="text-center mb-3">Match Score Trend</h5>
            <Line data={lineData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorAnalytics;