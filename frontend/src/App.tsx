import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { MerchantProvider } from './context/MerchantContext';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { PosPage } from './pages/PosPage';
import { ProductsPage } from './pages/ProductsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignInsightsPage } from './pages/CampaignInsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AskMitraPage } from './pages/AskMitraPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MerchantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="pos" element={<PosPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaign-insights" element={<CampaignInsightsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="assistant" element={<AskMitraPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MerchantProvider>
    </LanguageProvider>
  );
};

export default App;
