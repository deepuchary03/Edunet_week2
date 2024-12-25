import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./Context";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Home from "./components/Home";

function App() {
  const { token } = useContext(AuthContext);
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/" element={token ? <Home /> : <Navigate to="/signup" />} />
    </Routes>
  );
}

// Assign the AuthProvider to a variable
const AppWithProvider = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Export the named variable
export default AppWithProvider;
