import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Runlists from "@/pages/runlists";
import BuyBox from "@/pages/buy-box";
import Inspections from "@/pages/inspections";
import InspectionResults from "@/pages/inspection-results";
import InspectionTemplates from "@/pages/inspection-templates";
import Dealers from "@/pages/dealers";
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

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={SimpleDashboard} />
        <Route path="/old-dashboard" component={Dashboard} />
        <Route path="/runlists" component={Runlists} />
        <Route path="/buy-box" component={BuyBox} />
        <Route path="/inspections" component={Inspections} />
        <Route path="/completed-inspections" component={CompletedInspections} />

        <Route path="/inspection-results" component={InspectionResults} />
        <Route path="/inspection-templates" component={InspectionTemplates} />
        <Route path="/dealers" component={Dealers} />
        <Route path="/inspectors" component={Inspectors} />
        <Route path="/inspector-dashboard" component={InspectorDashboardSimple} />
        <Route path="/inspector" component={InspectorPortal} />
        <Route path="/inspector-portal" component={InspectorPortal} />
        <Route path="/inspection-detail/:id" component={InspectionDetail} />
        <Route path="/auctions" component={Auctions} />
        <Route path="/auctions/:id" component={AuctionDetail} />
        <Route path="/vehicle-tools" component={VehicleTools} />
        <Route path="/test-upload" component={TestUpload} />
        <Route path="/upload-test" component={UploadTest} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
