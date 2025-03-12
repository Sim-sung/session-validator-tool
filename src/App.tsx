
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from '@/components/Layout';
import { AuthProvider } from '@/context/AuthContext';
import { SessionProvider } from '@/context/SessionContext';

import IndexPage from '@/pages/Index';
import SessionsPage from '@/pages/Sessions';
import MetricsPage from '@/pages/Metrics';
import ValidationPage from '@/pages/Validation';
import LogsPage from '@/pages/Logs';
import NotFound from '@/pages/NotFound';

import '@/App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="gamebench-ui-theme">
        <AuthProvider>
          <SessionProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<IndexPage />} />
                  <Route path="/sessions" element={<SessionsPage />} />
                  <Route path="/metrics/:sessionId" element={<MetricsPage />} />
                  <Route path="/validation" element={<ValidationPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </Router>
          </SessionProvider>
        </AuthProvider>
        <Toaster richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
