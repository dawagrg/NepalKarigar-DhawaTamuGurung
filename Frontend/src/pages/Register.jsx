import { useState } from "react";
import { registerUser } from "../services/api";

function Register() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const res = await registerUser({
        username,
        password
      });

      alert(res.data.message);

    } catch {

      alert("Registration failed");

    }

  };

  return (

    <div style={{padding:40}}>

      <h2>Register</h2>

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

        <button type="submit">Register</button>

      </form>

    </div>

  );
}

export default Register;