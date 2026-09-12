import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BookingDetailPage } from '../features/bookings/BookingDetailPage';
import { LoginPage } from '../features/auth/LoginPage';
import { CreateLeadPage } from '../features/leads/CreateLeadPage';
import { LeadDetailPage } from '../features/leads/LeadDetailPage';
import { LeadsPage } from '../features/leads/LeadsPage';
import { QuotationDetailPage } from '../features/quotations/QuotationDetailPage';
import { HomePage } from '../features/home/HomePage';
import { ClientDetailPage } from '../features/clients/ClientDetailPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { SuggestionsPage } from '../features/suggestions/SuggestionsPage';
import { AuthProvider } from '../shared/auth/AuthContext';
import { ToastProvider } from '../shared/ui/Toast';
import { AppShell } from './AppShell';
import { ProtectedRoute } from './ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/new" element={<CreateLeadPage />} />
                <Route path="leads/:id" element={<LeadDetailPage />} />
                <Route path="quotations/:id" element={<QuotationDetailPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="suggestions" element={<SuggestionsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
