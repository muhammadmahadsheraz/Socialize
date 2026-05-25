import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY;
const ivLength = 16;

if (!secretKey || secretKey.length !== 32) {
  console.warn('WARNING: ENCRYPTION_KEY is not set or not 32 characters. Falling back to a default insecure key for development.');
}

const key = secretKey && secretKey.length === 32 
  ? Buffer.from(secretKey) 
  : crypto.createHash('sha256').update('insecure-fallback-key').digest();

export const encrypt = (text: string | null | undefined): string | null => {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

export const decrypt = (text: string | null | undefined): string | null => {
  if (!text) return null;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};
