import React from 'react';
import ProductForm from '@/components/admin/ProductForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminEditProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  return <ProductForm productId={productId} />;
}
