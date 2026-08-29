'use client';

import React from 'react';
import { useCountry } from '@/context/CountryContext';

interface FormattedPriceProps {
  amountInPaise: number;
  className?: string;
}

export default function FormattedPrice({ amountInPaise, className }: FormattedPriceProps) {
  const { formatPrice } = useCountry();
  return <span className={className}>{formatPrice(amountInPaise)}</span>;
}
