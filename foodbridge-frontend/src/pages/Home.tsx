import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container text-center mt-5">
      <h1>FoodBridge</h1>
      <p className="lead">Connecting surplus food to those in need</p>

      <div className="mt-4">
        <Link to="/login" className="btn btn-primary m-2">
          Login
        </Link>
        <Link to="/register" className="btn btn-success m-2">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Home;