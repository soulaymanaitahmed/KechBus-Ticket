import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the Home page!</p>
      <Link to="/dashboard">Go to Dashboard (Dev Option)</Link>
    </div>
  );
}

export default Home;
