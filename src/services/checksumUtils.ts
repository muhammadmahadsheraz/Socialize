// Latvian personal codes use a Mod-11 checksum over the first 10 digits.
export function latvianPersonalCode(code: string): boolean {
  if (!/^\d{11}$/.test(code)) return false;

  const digits = code.split('').map(Number);
  const weights = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

  const sum = digits.slice(0, 10).reduce((acc, d, i) => acc + d * weights[i], 0);
  let chk = (1 - (sum % 11) + 11) % 11;
  if (chk === 10) chk = 0;

  if (chk !== digits[10]) return false;

  const day = parseInt(code.substring(0, 2), 10);
  const month = parseInt(code.substring(2, 4), 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return false;

  return true;
}
