'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  lang: string;
  langName: string;
  locale: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', lang: 'en', langName: 'English', locale: 'en-IN' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', lang: 'en', langName: 'English', locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', lang: 'en', langName: 'English', locale: 'en-GB' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', symbol: '€', lang: 'de', langName: 'Deutsch', locale: 'de-DE' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', symbol: '€', lang: 'fr', langName: 'Français', locale: 'fr-FR' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', symbol: '€', lang: 'es', langName: 'Español', locale: 'es-ES' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', symbol: '€', lang: 'it', langName: 'Italiano', locale: 'it-IT' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', symbol: 'AED', lang: 'ar', langName: 'العربية', locale: 'ar-AE' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', symbol: 'SR', lang: 'ar', langName: 'العربية', locale: 'ar-SA' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'CA$', lang: 'en', langName: 'English', locale: 'en-CA' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', lang: 'en', langName: 'English', locale: 'en-AU' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥', lang: 'ja', langName: '日本語', locale: 'ja-JP' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', symbol: 'S$', lang: 'en', langName: 'English', locale: 'en-SG' },
];

const DEFAULT_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.0116,
  EUR: 0.0108,
  GBP: 0.0091,
  AED: 0.0426,
  SAR: 0.0435,
  CAD: 0.0163,
  AUD: 0.0178,
  JPY: 1.82,
  SGD: 0.0157,
};

interface CountryContextType {
  selectedCountry: Country;
  selectCountry: (countryCode: string) => void;
  formatPrice: (paiseAmount: number) => string;
  rates: Record<string, number>;
  loadingRates: boolean;
}

const CountryContext = createContext<CountryContextType>({
  selectedCountry: SUPPORTED_COUNTRIES[0],
  selectCountry: () => {},
  formatPrice: (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`,
  rates: DEFAULT_RATES,
  loadingRates: false,
});

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(SUPPORTED_COUNTRIES[0]);
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);

  // 1. Load saved country & fetch real-time exchange rates
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem('dollysticart_country');
      if (savedCode) {
        const found = SUPPORTED_COUNTRIES.find((c) => c.code === savedCode);
        if (found) {
          setSelectedCountry(found);
        }
      }
    } catch (e) {
      console.error('Error reading saved country preference:', e);
    }

    // Fetch live rates from free Open Exchange Rates API
    const fetchRates = async () => {
      setLoadingRates(true);
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/INR');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            setRates((prev) => ({
              ...prev,
              ...data.rates,
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live exchange rates, falling back to static defaults:', err);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  // 2. Country selection handler + Google Translate cookie trigger
  const selectCountry = (countryCode: string) => {
    const target = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
    if (!target) return;

    setSelectedCountry(target);

    try {
      localStorage.setItem('dollysticart_country', target.code);
    } catch (e) {
      console.error('Error saving country preference:', e);
    }

    // Set Google Translate cookie for client translation
    try {
      const lang = target.lang;
      document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/${lang}; path=/`;

      // Trigger Google Translate reload if element exists
      const gtCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (gtCombo) {
        gtCombo.value = lang;
        gtCombo.dispatchEvent(new Event('change'));
      } else {
        // If combo not loaded yet, refresh window to apply cookie translation
        window.location.reload();
      }
    } catch (e) {
      console.error('Error triggering translation:', e);
    }
  };

  // 3. Dynamic price conversion and formatting function
  const formatPrice = (paiseAmount: number): string => {
    if (typeof paiseAmount !== 'number' || isNaN(paiseAmount)) return '₹0';

    const inrAmount = paiseAmount / 100;
    const rate = rates[selectedCountry.currency] || DEFAULT_RATES[selectedCountry.currency] || 1;
    const convertedAmount = inrAmount * rate;

    try {
      const isWhole = selectedCountry.currency === 'JPY';
      return new Intl.NumberFormat(selectedCountry.locale, {
        style: 'currency',
        currency: selectedCountry.currency,
        maximumFractionDigits: isWhole ? 0 : 2,
        minimumFractionDigits: isWhole ? 0 : 2,
      }).format(convertedAmount);
    } catch (e) {
      return `${selectedCountry.symbol}${convertedAmount.toFixed(2)}`;
    }
  };

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
        selectCountry,
        formatPrice,
        rates,
        loadingRates,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  return useContext(CountryContext);
}
