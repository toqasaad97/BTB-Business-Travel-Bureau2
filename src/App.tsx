import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { PopupProvider } from "./context/PopupContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CreateInvoiceForm from "./components/CreateInvoiceForm";
import EditInvoiceForm from "./components/EditInvoiceForm";
import EmailPopup from "./components/EmailForm";
import CreditVoucherPopup from "./components/VoucherPopup";
import InvoiceActivitiesPopup from "./components/InvoiceActivitiesPopup";
import BusinessReservationConfirmation from "./components/BusinessReservationConfirmation";
// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <PopupProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#4CAF50",
                color: "#fff",
              },
              success: {
                style: {
                  background: "#4CAF50",
                },
              },
              error: {
                style: {
                  background: "#F44336",
                },
              },
            }}
          />

          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservation/:id"
              element={
                <ProtectedRoute>
                  <>
                  <BusinessReservationConfirmation />
                  <EmailPopup />
                  <CreditVoucherPopup />
                  <InvoiceActivitiesPopup />
                  </>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateInvoiceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditInvoiceForm />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </PopupProvider>
  );
}

export default App;
