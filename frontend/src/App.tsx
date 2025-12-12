import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TestSuites from './pages/TestSuites';
import Executions from './pages/Executions';
import ExecutionDetails from './pages/ExecutionDetails';
import Environments from './pages/Environments';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suites"
            element={
              <ProtectedRoute>
                <TestSuites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/executions"
            element={
              <ProtectedRoute>
                <Executions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/executions/:id"
            element={
              <ProtectedRoute>
                <ExecutionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/environments"
            element={
              <ProtectedRoute>
                <Environments />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
