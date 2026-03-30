import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Advisory from "@/pages/advisory";
import Disease from "@/pages/disease";
import Weather from "@/pages/weather";
import Market from "@/pages/market";
import Grading from "@/pages/grading";
import Logistics from "@/pages/logistics";
import Forum from "@/pages/forum";
import Traceability from "@/pages/traceability";
import Insurance from "@/pages/insurance";
import Farmers from "@/pages/farmers";
import Architecture from "@/pages/architecture";
import ProjectDesign from "@/pages/project-design";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/advisory" component={Advisory} />
        <Route path="/disease" component={Disease} />
        <Route path="/weather" component={Weather} />
        <Route path="/market" component={Market} />
        <Route path="/grading" component={Grading} />
        <Route path="/logistics" component={Logistics} />
        <Route path="/forum" component={Forum} />
        <Route path="/traceability" component={Traceability} />
        <Route path="/insurance" component={Insurance} />
        <Route path="/farmers" component={Farmers} />
        <Route path="/architecture" component={Architecture} />
        <Route path="/project-design" component={ProjectDesign} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
