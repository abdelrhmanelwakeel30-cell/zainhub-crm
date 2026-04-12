import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { styles } from './styles'

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface QuotationData {
  documentType: 'Quotation' | 'Proposal'
  documentNumber: string
  title: string
  issueDate: string
  validUntil?: string
  status: string
  // Company (issuer)
  companyName: string
  companyEmail?: string
  companyPhone?: string
  companyAddress?: string
  // Client
  clientName: string
  clientContact?: string
  clientEmail?: string
  // Content
  executiveSummary?: string
  scopeOfWork?: string
  deliverables?: string
  timeline?: string
  // Line items
  items: LineItem[]
  // Totals
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency: string
  // Terms
  terms?: string
  assumptions?: string
  exclusions?: string
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export function QuotationPDF({ data }: { data: QuotationData }) {
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
          <Text style={styles.title}>{data.documentType.toUpperCase()}</Text>
          <Text style={styles.subtitle}>
            {data.documentNumber} • {data.title}
          </Text>
          <Text style={[styles.subtitle, { marginTop: 4 }]}>
            Issued: {data.issueDate}
            {data.validUntil && ` • Valid Until: ${data.validUntil}`}
          </Text>
        </View>

        {/* Client Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Prepared For</Text>
            <Text style={styles.infoValue}>{data.clientName}</Text>
            {data.clientContact && <Text style={styles.infoValue}>Attn: {data.clientContact}</Text>}
            {data.clientEmail && <Text style={styles.infoValue}>{data.clientEmail}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{data.status}</Text>
          </View>
        </View>

        {/* Executive Summary */}
        {data.executiveSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.sectionText}>{data.executiveSummary}</Text>
          </View>
        )}

        {/* Scope */}
        {data.scopeOfWork && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope of Work</Text>
            <Text style={styles.sectionText}>{data.scopeOfWork}</Text>
          </View>
        )}

        {/* Deliverables */}
        {data.deliverables && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            <Text style={styles.sectionText}>{data.deliverables}</Text>
          </View>
        )}

        {/* Timeline */}
        {data.timeline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <Text style={styles.sectionText}>{data.timeline}</Text>
          </View>
        )}

        {/* Pricing Table */}
        <View style={[styles.section, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Pricing</Text>
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
            <Text style={styles.totalLabel}>Tax (VAT)</Text>
            <Text style={styles.totalValue}>{formatMoney(data.taxAmount, data.currency)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Investment</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(data.totalAmount, data.currency)}</Text>
          </View>
        </View>

        {/* Terms */}
        {data.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.sectionText}>{data.terms}</Text>
          </View>
        )}

        {data.assumptions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assumptions</Text>
            <Text style={styles.sectionText}>{data.assumptions}</Text>
          </View>
        )}

        {data.exclusions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exclusions</Text>
            <Text style={styles.sectionText}>{data.exclusions}</Text>
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
