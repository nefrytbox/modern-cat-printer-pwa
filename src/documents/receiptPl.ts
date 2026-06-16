import type { ReceiptItem, ReceiptPlDocument, ReceiptVatRate, ThermalLayout } from '../types';
import { formatCurrency, joinLabelValue, padText, safeNumber, wrapWords } from '../utils/format';

const VAT_PERCENT: Record<ReceiptVatRate, number> = {
  'A 23%': 23,
  'B 8%': 8,
  'C 5%': 5,
  ZW: 0
};

export interface ReceiptTotals {
  grossTotal: number;
  totalPaid: number;
  change: number;
  vatSummary: Array<{
    rate: ReceiptVatRate;
    gross: number;
    net: number;
    vat: number;
  }>;
}

export function calculateReceiptItemGross(item: ReceiptItem): number {
  return safeNumber(item.quantity) * safeNumber(item.unitPrice);
}

export function calculateReceiptTotals(document: ReceiptPlDocument): ReceiptTotals {
  const grouped = new Map<ReceiptVatRate, { gross: number; net: number; vat: number }>();
  let grossTotal = 0;

  for (const item of document.items) {
    const gross = calculateReceiptItemGross(item);
    const ratePercent = VAT_PERCENT[item.vatRate];
    const net = ratePercent === 0 ? gross : gross / (1 + ratePercent / 100);
    const vat = gross - net;

    grossTotal += gross;

    const current = grouped.get(item.vatRate) ?? { gross: 0, net: 0, vat: 0 };
    current.gross += gross;
    current.net += net;
    current.vat += vat;
    grouped.set(item.vatRate, current);
  }

  const totalPaid = safeNumber(document.paidAmount);
  return {
    grossTotal,
    totalPaid,
    change: Math.max(0, totalPaid - grossTotal),
    vatSummary: Array.from(grouped.entries()).map(([rate, values]) => ({
      rate,
      gross: values.gross,
      net: values.net,
      vat: values.vat
    }))
  };
}

export function buildReceiptLayout(document: ReceiptPlDocument): ThermalLayout {
  const width = document.charsPerLine;
  const divider = '-'.repeat(width);
  const totals = calculateReceiptTotals(document);
  const lines: ThermalLayout['lines'] = [];

  const pushCenteredBlock = (text: string, bold = false) => {
    text.split('\n').forEach((segment) => {
      lines.push({ text: padText(segment.trim(), width, 'center'), bold });
    });
  };

  pushCenteredBlock(document.storeName, true);
  pushCenteredBlock(document.address);
  pushCenteredBlock(`NIP ${document.nip}`);
  lines.push({ text: divider });
  lines.push({ text: joinLabelValue('PARAGON NR', document.receiptNumber, width), bold: true });
  lines.push({ text: joinLabelValue('DATA', document.dateTime, width) });
  lines.push({ text: joinLabelValue('KASJER', document.cashier, width) });
  lines.push({ text: divider });

  for (const item of document.items) {
    for (const wrappedName of wrapWords(item.name.toUpperCase(), width)) {
      lines.push({ text: wrappedName });
    }

    const left = `${formatQuantity(item.quantity)} ${item.unit} x ${formatCurrency(item.unitPrice)} ${item.vatRate}`;
    const right = formatCurrency(calculateReceiptItemGross(item));
    lines.push({ text: joinLabelValue(left, right, width) });
  }

  lines.push({ text: divider });
  lines.push({ text: joinLabelValue('SUMA BRUTTO', formatCurrency(totals.grossTotal), width), bold: true });
  lines.push({ text: divider });
  lines.push({ text: 'PODSUMOWANIE VAT' });
  for (const row of totals.vatSummary) {
    lines.push({
      text: joinLabelValue(`${row.rate}`, `${formatCurrency(row.gross)} / ${formatCurrency(row.vat)}`, width)
    });
  }
  lines.push({ text: divider });
  lines.push({ text: joinLabelValue(`PLATNOSC ${document.paymentMethod.toUpperCase()}`, formatCurrency(totals.totalPaid), width) });
  lines.push({ text: joinLabelValue('RESZTA', formatCurrency(totals.change), width) });
  lines.push({ text: divider });
  pushCenteredBlock(document.footer);

  return {
    widthChars: width,
    lines
  };
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
}
