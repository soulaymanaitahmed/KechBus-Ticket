import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="login">
      <h1>Login</h1>
      <form>
        <input type="text" placeholder="Username" />
        <br />
        <input type="password" placeholder="Password" />
        <br />
        <button type="submit">Login</button>
      </form>
      <br />
      <br />
      <Link to="/signin">Don't have an account? Sign in</Link>
      <br />
      <br />
      <Link to="/dashboard">Go to Dashboard (Dev Option)</Link>
    </div>
  );
}

export default Login;
