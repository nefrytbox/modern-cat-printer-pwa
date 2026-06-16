import type { ReceiptItem, ReceiptPlDocument } from '../../types';

interface ReceiptEditorProps {
  document: ReceiptPlDocument;
  onChange: (changes: Partial<ReceiptPlDocument>) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, changes: Partial<ReceiptItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function ReceiptEditor({ document, onChange, onAddItem, onUpdateItem, onRemoveItem }: ReceiptEditorProps) {
  return (
    <div className="editor-stack">
      <section className="card editor-card">
        <p className="eyebrow">Receipt template</p>
        <h3>Paragon PL</h3>
        <p className="info-banner">Sample / helper printout only. This is not a certified fiscal receipt.</p>

        <div className="field-grid two-up">
          <label className="field">
            <span>Store / company name</span>
            <input value={document.storeName} onChange={(event) => onChange({ storeName: event.target.value })} />
          </label>
          <label className="field">
            <span>NIP</span>
            <input value={document.nip} onChange={(event) => onChange({ nip: event.target.value })} />
          </label>
        </div>

        <label className="field">
          <span>Address</span>
          <textarea rows={3} value={document.address} onChange={(event) => onChange({ address: event.target.value })} />
        </label>

        <div className="field-grid three-up">
          <label className="field">
            <span>Receipt no.</span>
            <input value={document.receiptNumber} onChange={(event) => onChange({ receiptNumber: event.target.value })} />
          </label>
          <label className="field">
            <span>Date / time</span>
            <input value={document.dateTime} onChange={(event) => onChange({ dateTime: event.target.value })} />
          </label>
          <label className="field">
            <span>Cashier</span>
            <input value={document.cashier} onChange={(event) => onChange({ cashier: event.target.value })} />
          </label>
        </div>

        <div className="field-grid three-up">
          <label className="field">
            <span>Payment method</span>
            <select value={document.paymentMethod} onChange={(event) => onChange({ paymentMethod: event.target.value })}>
              <option>Cash</option>
              <option>Card</option>
              <option>BLIK</option>
              <option>Transfer</option>
              <option>Voucher</option>
            </select>
          </label>
          <label className="field">
            <span>Paid amount</span>
            <input
              type="number"
              step={0.01}
              value={document.paidAmount}
              onChange={(event) => onChange({ paidAmount: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Chars / line</span>
            <select value={document.charsPerLine} onChange={(event) => onChange({ charsPerLine: Number(event.target.value) as 32 | 36 | 42 })}>
              <option value={32}>32</option>
              <option value={36}>36</option>
              <option value={42}>42</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Footer</span>
          <textarea rows={3} value={document.footer} onChange={(event) => onChange({ footer: event.target.value })} />
        </label>
      </section>

      <section className="card editor-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Items</p>
            <h3>Receipt lines</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onAddItem}>
            Add item
          </button>
        </div>

        <div className="item-list">
          {document.items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="field-grid item-grid">
                <label className="field item-grid__name">
                  <span>Name</span>
                  <input value={item.name} onChange={(event) => onUpdateItem(item.id, { name: event.target.value })} />
                </label>
                <label className="field">
                  <span>Qty</span>
                  <input
                    type="number"
                    step={0.01}
                    value={item.quantity}
                    onChange={(event) => onUpdateItem(item.id, { quantity: Number(event.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Unit</span>
                  <input value={item.unit} onChange={(event) => onUpdateItem(item.id, { unit: event.target.value })} />
                </label>
                <label className="field">
                  <span>Unit price</span>
                  <input
                    type="number"
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(event) => onUpdateItem(item.id, { unitPrice: Number(event.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>VAT</span>
                  <select value={item.vatRate} onChange={(event) => onUpdateItem(item.id, { vatRate: event.target.value as ReceiptItem['vatRate'] })}>
                    <option value="A 23%">A 23%</option>
                    <option value="B 8%">B 8%</option>
                    <option value="C 5%">C 5%</option>
                    <option value="ZW">ZW</option>
                  </select>
                </label>
              </div>
              <button type="button" className="ghost-button" onClick={() => onRemoveItem(item.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
