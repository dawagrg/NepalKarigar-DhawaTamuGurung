import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";
import Profile        from "./pages/Profile";
import Navbar         from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages with Navbar */}
        <Route path="/"        element={<><Navbar /><Home /></>} />
        <Route path="/profile" element={<><Navbar /><Profile /></>} />

        {/* Full-page auth screens (no Navbar) */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;