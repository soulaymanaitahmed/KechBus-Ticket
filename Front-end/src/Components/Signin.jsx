import { Link } from "react-router-dom";

function Signin() {
  return (
    <div className="signin">
      <h1>Sign In</h1>
      <form>
        <input type="text" placeholder="Username" />
        <br />
        <input type="email" placeholder="Email" />
        <br />
        <input type="password" placeholder="Password" />
        <br />
        <button type="submit">Sign In</button>
      </form>
      <br />
      <br />
      <Link to="/login">Already have an account? Login</Link>
      <br />
      <br />
      <Link to="/dashboard">Go to Dashboard (Dev Option)</Link>
    </div>
  );
}

export default Signin;
