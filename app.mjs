import { readFileSync } from 'node:fs'

function analyze(input) {
  const parityBits = [1, 2, 4], dataSlots = [3, 5, 6, 7];
  const parity = (bits, check) => bits.reduce((value, bit, index) => (check & index) ? value ^ bit : value, 0);
  const asText = bits => bits.slice(1).join('');
  let codeword = null, received;
  const hasData = Object.hasOwn(input, 'dataBits');
  if (hasData === Object.hasOwn(input, 'received')) throw new Error('Supply either dataBits or received');
  if (hasData) {
    const bits = input.dataBits;
    if (typeof bits !== 'string' || !/^[01]{4}$/.test(bits)) throw new Error('dataBits must contain four bits');
    const encoded = Array(8).fill(0);
    dataSlots.forEach((slot, index) => { encoded[slot] = Number(bits[index]); });
    parityBits.forEach(slot => { encoded[slot] = parity(encoded, slot); });
    codeword = asText(encoded);
    if (Object.hasOwn(input, 'flip')) {
      if (!Number.isInteger(input.flip) || input.flip < 1 || input.flip > 7) throw new Error('flip must be 1 through 7');
      encoded[input.flip] ^= 1;
    }
    received = asText(encoded);
  } else {
    received = input.received;
    if (typeof received !== 'string' || !/^[01]{7}$/.test(received) || Object.hasOwn(input, 'flip'))
      throw new Error('received must contain exactly seven bits');
  }
  const restored = [0, ...Array.from(received, Number)];
  const syndrome = parityBits.reduce((sum, slot) => sum + parity(restored, slot) * slot, 0);
  if (syndrome) restored[syndrome] ^= 1;
  return {codeword, received, syndrome, corrected: asText(restored), decoded: dataSlots.map(slot => restored[slot]).join('')};
}

try {
  if (process.argv.length !== 3) throw new Error('Usage: node app.mjs input.json')
  console.log(JSON.stringify(analyze(JSON.parse(readFileSync(process.argv[2], 'utf8')))))
} catch (error) {
  console.error(error.message)
  process.exitCode = 2
}
