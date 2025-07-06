import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip-system";
import { ThemeProvider } from "@/components/ui/theme-system";
import { SoundProvider } from "@/components/ui/sound-system";
import IDE from "@/pages/ide";
import Home from "@/pages/home";
import About from "@/pages/about";
import Features from "@/pages/features";
import Pricing from "@/pages/pricing";
import Developers from "@/pages/developers";
import Contact from "@/pages/contact";
import Admin from "@/pages/admin";
import BetaAccess from "@/pages/beta";
import NotFound from "@/pages/not-found";
import SplashScreen from "@/components/ui/splash-screen";
import GuestMode from "@/components/guest-mode";
import EnvironmentSetupWizard from "@/components/environment-setup-wizard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ide" component={IDE} />
      <Route path="/trial">
        <GuestMode />
      </Route>
      <Route path="/guest">
        <GuestMode />
      </Route>
      <Route path="/setup">
        <EnvironmentSetupWizard />
      </Route>
      <Route path="/about" component={About} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/developers" component={Developers} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={Admin} />
      <Route path="/beta" component={BetaAccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  // Simulate app initialization
  useEffect(() => {
    // Check if the splash has been shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    
    if (splashShown) {
      // Skip splash if already shown in this session
      setShowSplash(false);
      setIsAppReady(true);
    } else {
      // Show splash screen for new sessions
      setTimeout(() => {
        setIsAppReady(true);
      }, 500); // Small delay to ensure everything is ready
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  if (showSplash && !sessionStorage.getItem('splashShown')) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SoundProvider>
            <TooltipProvider>
              <SplashScreen 
                onComplete={handleSplashComplete}
                duration={3500}
              />
            </TooltipProvider>
          </SoundProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SoundProvider>
          <TooltipProvider>
            <Toaster />
            {isAppReady && <Router />}
          </TooltipProvider>
        </SoundProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
