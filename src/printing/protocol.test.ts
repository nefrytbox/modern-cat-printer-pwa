import { PRINTER_WIDTH, calculateCRC8, createCommand, encode1bppRow } from './protocol';

describe('printer protocol helpers', () => {
  it('calculates the known CRC8 for a simple payload', () => {
    expect(calculateCRC8(Uint8Array.from([0x01, 0x02, 0x03]))).toBe(0x48);
  });

  it('packs bitmap rows into 48 printer bytes', () => {
    const row = new Array(PRINTER_WIDTH).fill(false);
    row[0] = true;
    row[7] = true;
    row[8] = true;

    const bytes = encode1bppRow(row);

    expect(bytes).toHaveLength(48);
    expect(bytes[0]).toBe(0b10000001);
    expect(bytes[1]).toBe(0b00000001);
  });

  it('creates framed commands with preamble and footer', () => {
    const command = createCommand(0xa2, Uint8Array.from([0x5d]));

    expect(Array.from(command.slice(0, 3))).toEqual([0x22, 0x21, 0xa2]);
    expect(command.at(-1)).toBe(0xff);
    expect(command.at(-2)).toBe(0x94);
  });
});
