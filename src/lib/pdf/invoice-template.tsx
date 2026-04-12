import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { styles } from './styles'

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface InvoiceData {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: string
  // Company
  companyName: string
  companyEmail?: string
  companyPhone?: string
  companyAddress?: string
  // Client
  clientName: string
  clientEmail?: string
  clientPhone?: string
  // Line items
  items: LineItem[]
  // Totals
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  currency: string
  // Notes
  notes?: string
  terms?: string
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{data.companyName}</Text>
          </View>
          <View style={styles.companyInfo}>
            {data.companyEmail && <Text>{data.companyEmail}</Text>}
            {data.companyPhone && <Text>{data.companyPhone}</Text>}
            {data.companyAddress && <Text>{data.companyAddress}</Text>}
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.subtitle}>
            {data.invoiceNumber} • Issued: {data.issueDate} • Due: {data.dueDate}
          </Text>
        </View>

        {/* Bill To / Invoice Details */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoValue}>{data.clientName}</Text>
            {data.clientEmail && <Text style={styles.infoValue}>{data.clientEmail}</Text>}
            {data.clientPhone && <Text style={styles.infoValue}>{data.clientPhone}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Invoice Details</Text>
            <Text style={styles.infoValue}>Status: {data.status}</Text>
            <Text style={styles.infoValue}>Currency: {data.currency}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colUnitPrice]}>{formatMoney(item.unitPrice, data.currency)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatMoney(item.totalPrice, data.currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatMoney(data.subtotal, data.currency)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-{formatMoney(data.discountAmount, data.currency)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (5% VAT)</Text>
            <Text style={styles.totalValue}>{formatMoney(data.taxAmount, data.currency)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(data.totalAmount, data.currency)}</Text>
          </View>
          {data.amountPaid > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Paid</Text>
                <Text style={styles.totalValue}>{formatMoney(data.amountPaid, data.currency)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Balance Due</Text>
                <Text style={[styles.totalValue, { fontWeight: 'bold', color: data.balanceDue > 0 ? '#EF4444' : '#22C55E' }]}>
                  {formatMoney(data.balanceDue, data.currency)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionText}>{data.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {data.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.sectionText}>{data.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {data.companyName} • {data.companyEmail} • {data.companyPhone}
        </Text>
      </Page>
    </Document>
  )
}
