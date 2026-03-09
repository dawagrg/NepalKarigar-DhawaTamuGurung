import { useState } from "react";
import { loginUser } from "../services/api";

function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const res = await loginUser({
        username,
        password
      });

      alert(res.data.message);

    } catch (err) {

      alert("Login failed");

    }

  };

  return (

    <div style={{padding:40}}>

      <h2>Login</h2>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="username"
          onChange={(e)=>setUsername(e.target.value)}
        />

        <br/><br/>

        <input
          type="password"
          placeholder="password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <br/><br/>

        <button type="submit">Login</button>

      </form>

    </div>

  );
}

export default Login;