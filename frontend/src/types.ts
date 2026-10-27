export type EvidenceCategory = 
  | 'screenshot' // Screenshot percakapan / pesan phishing
  | 'document'   // Dokumen pendukung, email header, log
  | 'video'      // Rekaman layar insiden
  | 'identity'   // Identitas pelapor / korban terlindungi
  | 'other';     // Lainnya

export type CryptoAlgorithm = 'AES' | 'DES' | 'RC4';

export type BlockCipherMode = 'CBC' | 'CTR' | 'OFB' | 'CFB';
export type AESMode = BlockCipherMode;

export interface CryptoEnvelope {
  algorithm: string;
  mode?: string;
  name: string;
  salt: string;
  ciphertext: string;
  iv?: string;
  nonce?: string;
  notes?: string;
  category?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  id: number;
  username: string;
  role?: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  username?: string;
  role?: string;
}

export interface DecryptTextResponse {
  success: boolean;
  original_name: string;
  plaintext: string;
}

export interface EvidenceReport {
  id: number;
  reporter: string;
  category: string;
  filename: string;
  algorithm: string;
  mode: string;
  notes: string;
  filesize: number;
  created_at: string;
}
