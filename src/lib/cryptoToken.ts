import crypto from "crypto";

// Generar una clave de 32 bytes de forma estable usando la clave del rol de servicio como base
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-nerve-health-systems-secret-key";
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(secret)
  .digest(); // 32 bytes para aes-256-cbc

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // 16 bytes para AES

interface UploadTokenPayload {
  clinicId: string;
  patientId: string;
  recordId: string;
  appointmentId?: string | null;
  expiresAt: number; // Timestamp en ms
}

/**
 * Encripta un objeto payload en una cadena de texto hexadecimal segura
 */
export function encryptToken(payload: UploadTokenPayload): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Retornamos iv en hexadecimal concatenado con el texto encriptado, separados por un punto
  return `${iv.toString("hex")}.${encrypted}`;
}

/**
 * Desencripta una cadena de texto en un objeto UploadTokenPayload.
 * Lanza un error si el token es inválido o está corrupto.
 */
export function decryptToken(token: string): UploadTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new Error("Token con formato inválido");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return JSON.parse(decrypted) as UploadTokenPayload;
}
