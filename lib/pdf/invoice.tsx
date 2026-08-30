import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

// Formatter Helper
const formatCurrency = (paise: number) => {
  return `INR ${(paise / 100).toFixed(2)}`;
};

// Stylesheet Definition matching brand guidelines in print format
const styles = StyleSheet.create({
  page: {
    padding: 45,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000000',
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444444',
    textAlign: 'right',
  },
  metaText: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'right',
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoText: {
    color: '#444444',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsList: {
    width: 180,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    color: '#666666',
  },
  totalValue: {
    color: '#333333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
    marginTop: 5,
    fontWeight: 'bold',
  },
  grandTotalLabel: {
    fontSize: 10,
    color: '#000000',
  },
  grandTotalValue: {
    fontSize: 10,
    color: '#000000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 45,
    right: 45,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 7,
    color: '#999999',
  }
});

// React PDF Template Component
const InvoiceDocument = ({ order, items }: { order: any; items: any[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>DOLLYSTICART</Text>
          <Text style={{ fontSize: 8, color: '#666666', marginTop: 2 }}>PREMIUM ARTWORK & SCRIBBLE COLLECTION</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE RECEIPT</Text>
          <Text style={styles.metaText}>Invoice #: INV-{order.id.substring(0, 8).toUpperCase()}</Text>
          <Text style={styles.metaText}>Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</Text>
        </View>
      </View>

      {/* Meta billing vs shipping coordinates */}
      <View style={styles.metaContainer}>
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Customer Address</Text>
          <Text style={styles.infoText}>{order.customer_name}</Text>
          <Text style={styles.infoText}>
            {order.shipping_address?.street || ''}, {order.shipping_address?.city || ''}
          </Text>
          <Text style={styles.infoText}>
            {order.shipping_address?.state || ''} - {order.shipping_address?.postal_code || ''}
          </Text>
          <Text style={styles.infoText}>Phone: {order.customer_phone}</Text>
          <Text style={styles.infoText}>Email: {order.customer_email}</Text>
        </View>
        
        <View style={[styles.column, { paddingLeft: 40 }]}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <Text style={styles.infoText}>Gateway: Razorpay</Text>
          <Text style={styles.infoText}>Order ID: {order.razorpay_order_id || 'Mock Order'}</Text>
          <Text style={styles.infoText}>Payment ID: {order.razorpay_payment_id || 'Mock Payment'}</Text>
          <Text style={styles.infoText}>Status: PAID</Text>
        </View>
      </View>

      {/* Product Items Table */}
      <View style={{ marginTop: 10 }}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Item Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {/* Table Row lines */}
        {items.map((item) => {
          const finalItemPrice = item.price_at_purchase - item.discount_at_purchase;
          return (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.products?.name || 'Textured Artwork'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(finalItemPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(finalItemPrice * item.quantity)}</Text>
            </View>
          );
        })}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsList}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount Applied</Text>
              <Text style={styles.totalValue}>-{formatCurrency(order.discount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.total)}</Text>
          </View>
        </View>
      </View>

      {/* Footer copyright */}
      <Text style={styles.footer}>
        Thank you for your purchase! For support questions, contact letsmaildoly@gmail.com. Dollysticart, HMH, Rajasthan (335513).
      </Text>

    </Page>
  </Document>
);

// PDF Buffer compiler entrypoint function
export async function generateInvoicePdf(order: any, items: any[]): Promise<Buffer> {
  return await renderToBuffer(<InvoiceDocument order={order} items={items} />) as Buffer;
}
