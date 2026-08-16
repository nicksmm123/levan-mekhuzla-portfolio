import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { LanguageProvider } from '@/i18n/LanguageContext';
import { Layout } from '@/components/Layout';
import { Gallery } from '@/pages/Gallery';
import { Biography } from '@/pages/Biography';
import { Exhibitions } from '@/pages/Exhibitions';
import { Contact } from '@/pages/Contact';
import { Archive } from '@/pages/Archive';
import { AdminApp } from '@/pages/admin/AdminApp';

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');

  if (isAdmin) {
    // Admin section — no gallery Layout or LanguageProvider needed
    return <AdminApp />;
  }

  return (
    <LanguageProvider>
      <Layout>
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={Gallery} />
            <Route path="/biography" component={Biography} />
            <Route path="/exhibitions" component={Exhibitions} />
            <Route path="/contact" component={Contact} />
            <Route path="/archive" component={Archive} />
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </Layout>
    </LanguageProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
