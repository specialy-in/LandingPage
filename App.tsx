import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './src/hooks/useAuth';
import LandingPage from './src/components/LandingPage';
import DashboardResolver from './src/components/dashboard/DashboardResolver';
import Marketplace from './src/components/marketplace/Marketplace';
import BrowseArchitects from './src/components/architects/BrowseArchitects';
import Workspace from './src/components/workspace/Workspace';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { AuthenticatedLayout } from './src/components/Layout';

import { OnboardingLayout } from './src/components/onboarding/OnboardingLayout';
import { OnboardingFlow } from './src/components/onboarding/OnboardingFlow';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingLayout>
                  <OnboardingFlow />
                </OnboardingLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardResolver />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:projectId"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Marketplace />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/architects"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <BrowseArchitects />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;