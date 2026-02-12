import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingGuard from "./components/OnboardingGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ברירת מחדל */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ציבורי */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* חייב להיות מחובר */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* חייב להיות מחובר + חייב להיות אחרי onboarding */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Dashboard />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
