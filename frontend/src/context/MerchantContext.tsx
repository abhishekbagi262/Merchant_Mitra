import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { MerchantSettings } from '../types/api';

interface MerchantContextType {
  merchant: MerchantSettings | null;
  merchantName: string;
  storeName: string;
  location: string;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<MerchantSettings>) => Promise<MerchantSettings>;
  refreshSettings: () => Promise<void>;
}

const defaultMerchant: MerchantSettings = {
  id: 1,
  name: 'Ramesh',
  business_name: 'Ramesh General Stores',
  location: 'Bengaluru, KA',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  preferred_language: 'en',
  voice_enabled: true,
  auto_login_greeting: true,
  voice_responses: true,
  preferred_speech_lang: 'en-IN',
  notify_purchases: true,
  notify_low_stock: true,
  notify_profit_decline: true,
  profit_decline_threshold_pct: 20.0,
};

const MerchantContext = createContext<MerchantContextType>({
  merchant: defaultMerchant,
  merchantName: 'Ramesh',
  storeName: 'Ramesh General Stores',
  location: 'Bengaluru, KA',
  isLoading: false,
  error: null,
  updateSettings: async () => defaultMerchant,
  refreshSettings: async () => {},
});

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [merchant, setMerchant] = useState<MerchantSettings>(() => {
    // Check localStorage cache for instant zero-flash render
    try {
      const cached = localStorage.getItem('merchant_mitra_profile');
      if (cached) {
        return { ...defaultMerchant, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return defaultMerchant;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getSettings();
      setMerchant(data);
      localStorage.setItem('merchant_mitra_profile', JSON.stringify(data));
    } catch (err: any) {
      console.warn('Could not fetch merchant settings, using active state:', err);
      setError(err?.message || 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = async (updates: Partial<MerchantSettings>): Promise<MerchantSettings> => {
    try {
      setIsLoading(true);
      const updated = await api.updateSettings(updates);
      setMerchant(updated);
      localStorage.setItem('merchant_mitra_profile', JSON.stringify(updated));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MerchantContext.Provider
      value={{
        merchant,
        merchantName: merchant.name || 'Ramesh',
        storeName: merchant.business_name || 'Ramesh General Stores',
        location: merchant.location || 'Bengaluru, KA',
        isLoading,
        error,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = (): MerchantContextType => {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
};
