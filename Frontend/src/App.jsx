import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar           from "./components/Navbar";
import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import ForgotPassword   from "./pages/ForgotPassword";
import ResetPassword    from "./pages/ResetPassword";
import Profile          from "./pages/Profile";
import Services         from "./pages/Services";
import Search           from "./pages/Search";
import KarigarProfile   from "./pages/KarigarProfile";
import KarigarDashboard from "./pages/KarigarDashboard";

const W = ({ children }) => <><Navbar />{children}</>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<W><Home /></W>} />
        <Route path="/profile"           element={<W><Profile /></W>} />
        <Route path="/services"          element={<W><Services /></W>} />
        <Route path="/search"            element={<W><Search /></W>} />
        <Route path="/karigar/:id"       element={<W><KarigarProfile /></W>} />
        <Route path="/karigar-dashboard" element={<W><KarigarDashboard /></W>} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/reset-password"    element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;