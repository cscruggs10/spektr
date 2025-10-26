import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { videoSyncService } from "@/lib/video-sync-service";
import { useEffect } from "react";
import Login from "@/components/auth/login";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Runlists from "@/pages/runlists";
import BuyBox from "@/pages/buy-box";
import InspectionsBento from "@/pages/inspections-bento";
import InspectionResults from "@/pages/inspection-results";
import InspectionTemplates from "@/pages/inspection-templates";
import DealersBento from "@/pages/dealers-bento";
import Inspectors from "@/pages/inspectors";
import Auctions from "@/pages/auctions";
import AuctionDetail from "@/pages/auction-detail";
import VehicleTools from "@/pages/vehicle-tools";
import InspectorDashboardSimple from "@/pages/inspector-dashboard-simple";
import InspectorPortal from "@/pages/inspector-portal";
import InspectionDetail from "@/pages/inspection-detail-new";
import CompletedInspections from "@/pages/completed-inspections";

import TestUpload from "@/pages/test-upload";
import UploadTest from "@/pages/upload-test";
import SimpleDashboard from "@/pages/simple-dashboard";
import AccessManagement from "@/pages/access-management";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Landing page without auth */}
      <Route path="/" component={Landing} />

      {/* Inspector portal with admin authentication */}
      <Route path="/inspector" component={() => (
        <ProtectedRoute>
          <InspectorPortal />
        </ProtectedRoute>
      )} />
      <Route path="/inspector-portal" component={() => (
        <ProtectedRoute>
          <InspectorPortal />
        </ProtectedRoute>
      )} />

      {/* Protected routes with layout */}
      <Route path="/dashboard" component={() => (
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/simple-dashboard" component={() => (
        <ProtectedRoute>
          <Layout><SimpleDashboard /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/runlists" component={() => (
        <ProtectedRoute>
          <Layout><Runlists /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/buy-box" component={() => (
        <ProtectedRoute>
          <Layout><BuyBox /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/inspections" component={() => (
        <ProtectedRoute>
          <Layout><InspectionsBento /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/completed-inspections" component={() => (
        <ProtectedRoute>
          <Layout><CompletedInspections /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/inspection-results" component={() => (
        <ProtectedRoute>
          <Layout><InspectionResults /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/inspection-templates" component={() => (
        <ProtectedRoute>
          <Layout><InspectionTemplates /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/dealers" component={() => (
        <ProtectedRoute>
          <Layout><DealersBento /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/inspectors" component={() => (
        <ProtectedRoute>
          <Layout><Inspectors /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/inspector-dashboard" component={() => (
        <ProtectedRoute>
          <Layout><InspectorDashboardSimple /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/inspection-detail/:id" component={(params) => (
        <ProtectedRoute>
          <Layout><InspectionDetail {...params} /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/auctions" component={() => (
        <ProtectedRoute>
          <Layout><Auctions /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/auctions/:id" component={(params) => (
        <ProtectedRoute>
          <Layout><AuctionDetail {...params} /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/vehicle-tools" component={() => (
        <ProtectedRoute>
          <Layout><VehicleTools /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/access-management" component={() => (
        <ProtectedRoute>
          <Layout><AccessManagement /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/test-upload" component={() => (
        <ProtectedRoute>
          <Layout><TestUpload /></Layout>
        </ProtectedRoute>
      )} />
      <Route path="/upload-test" component={() => (
        <ProtectedRoute>
          <Layout><UploadTest /></Layout>
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize video sync service on app startup
    videoSyncService.start();
    console.log('Video sync service initialized');

    return () => {
      videoSyncService.stop();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
