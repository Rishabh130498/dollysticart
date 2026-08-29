import React, { Suspense } from 'react';
import AccountPageClient from '@/components/account/AccountPageClient';

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
          <span className="font-display text-xs tracking-widest text-muted uppercase">
            LOADING ACCOUNT...
          </span>
        </div>
      }
    >
      <AccountPageClient />
    </Suspense>
  );
}
