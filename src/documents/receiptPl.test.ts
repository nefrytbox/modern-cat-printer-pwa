import { buildReceiptLayout, calculateReceiptTotals } from './receiptPl';
import type { ReceiptPlDocument } from '../types';

function createReceiptFixture(): ReceiptPlDocument {
  return {
    storeName: 'TEST SHOP',
    address: 'ul. Testowa 1',
    nip: '111-222-33-44',
    receiptNumber: 'PAR/001',
    dateTime: '16.06.2026 10:30',
    cashier: 'Jan',
    paymentMethod: 'Card',
    paidAmount: 30,
    footer: 'Dziekujemy',
    disclaimer: 'Not fiscal',
    charsPerLine: 36,
    items: [
      {
        id: 'a',
        name: 'Bardzo dluga nazwa produktu testowego z dodatkowymi slowami',
        quantity: 2,
        unit: 'szt',
        unitPrice: 10,
        vatRate: 'A 23%'
      },
      {
        id: 'b',
        name: 'Bulka',
        quantity: 1,
        unit: 'szt',
        unitPrice: 5,
        vatRate: 'B 8%'
      }
    ]
  };
}

describe('receipt layout', () => {
  it('calculates gross totals and VAT summaries', () => {
    const totals = calculateReceiptTotals(createReceiptFixture());

    expect(totals.grossTotal).toBeCloseTo(25);
    expect(totals.totalPaid).toBe(30);
    expect(totals.change).toBeCloseTo(5);
    expect(totals.vatSummary).toHaveLength(2);
    expect(totals.vatSummary.find((row) => row.rate === 'A 23%')?.gross).toBeCloseTo(20);
    expect(totals.vatSummary.find((row) => row.rate === 'B 8%')?.gross).toBeCloseTo(5);
  });

  it('wraps long item names and keeps summary lines aligned', () => {
    const layout = buildReceiptLayout(createReceiptFixture());
    const itemNameLines = layout.lines.filter(
      (line) => line.text.includes('BARDZO') || line.text.includes('DODATKOWYMI')
    );
    const totalLine = layout.lines.find((line) => line.text.includes('SUMA BRUTTO'));

    expect(itemNameLines.length).toBeGreaterThan(1);
    expect(totalLine?.text.trim()).toContain('SUMA BRUTTO');
    expect(totalLine?.text).toContain('25.00');
  });
});
