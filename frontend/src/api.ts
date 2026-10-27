import { AESMode, AuthResponse, CryptoEnvelope, DecryptTextResponse, UserProfile } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ciphervault_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // --- AUTHENTICATION ---
  async register(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registrasi gagal.');
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login gagal.');
    return data;
  },

  async logout(token: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getMe(token: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal memverifikasi sesi.');
    return data;
  },

  // --- CRYPTO: TEXT ---
  async encryptText(
    text: string,
    password: string,
    algorithm: string = 'AES',
    mode: AESMode = 'CBC',
    name: string = 'incident_notes.txt'
  ): Promise<{ success: boolean; envelope: CryptoEnvelope }> {
    const res = await fetch(`${API_BASE_URL}/crypto/encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ text, password, algorithm, mode, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Enkripsi teks gagal.');
    return data;
  },

  async decryptText(
    envelope: CryptoEnvelope,
    password: string
  ): Promise<DecryptTextResponse> {
    const res = await fetch(`${API_BASE_URL}/crypto/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ envelope, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Dekripsi teks gagal.');
    return data;
  },

  // --- CRYPTO: FILE (IMAGE, VIDEO, PDF, ETC) ---
  async encryptFile(
    file: File,
    password: string,
    algorithm: string = 'AES',
    mode: AESMode = 'CBC',
    notes: string = '',
    category: string = ''
  ): Promise<{ blob: Blob; envelopeFilename: string; envelopeJson: CryptoEnvelope }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    formData.append('algorithm', algorithm);
    formData.append('mode', mode);
    formData.append('notes', notes);
    formData.append('category', category);

    const res = await fetch(`${API_BASE_URL}/crypto/encrypt-file`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Gagal mengenkripsi berkas.' }));
      throw new Error(err.detail || 'Gagal mengenkripsi berkas.');
    }

    const blob = await res.blob();
    const textContent = await blob.text();
    const envelopeJson: CryptoEnvelope = JSON.parse(textContent);

    let envelopeFilename = res.headers.get('X-Filename') || '';
    const disposition = res.headers.get('Content-Disposition');
    if (!envelopeFilename && disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) envelopeFilename = match[1];
    }
    if (!envelopeFilename) {
      envelopeFilename = `${file.name}.${algorithm.toLowerCase()}-${mode.toLowerCase()}.json`;
    }

    return { blob, envelopeFilename, envelopeJson };
  },

  async decryptFile(
    file: File,
    password: string
  ): Promise<{ blob: Blob; filename: string; contentType: string; notes?: string; category?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    const res = await fetch(`${API_BASE_URL}/crypto/decrypt-file`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Gagal mendekripsi berkas bukti.' }));
      throw new Error(err.detail || 'Gagal mendekripsi berkas bukti.');
    }

    // 1. Ambil nama dari Header X-Filename atau Content-Disposition
    let filename = res.headers.get('X-Filename') || '';
    const disposition = res.headers.get('Content-Disposition');
    if (!filename && disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    // Ambil notes dan category dari header
    let notes = '';
    const rawNotes = res.headers.get('X-Notes');
    if (rawNotes) {
      try {
        notes = decodeURIComponent(rawNotes);
      } catch {
        notes = rawNotes;
      }
    }
    let category = res.headers.get('X-Category') || '';

    // 2. Fallback: Baca nama, notes, dan category langsung dari file JSON envelope
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!filename && json.name) filename = json.name;
      if (!notes && json.notes) notes = json.notes;
      if (!category && json.category) category = json.category;
    } catch {
      // abaikan error parse
    }

    // 3. Fallback nama file jika masih kosong
    if (!filename) {
      filename = file.name.replace(/\.(json|aes|des|rc4|cbc|ctr|ofb|cfb|-)+$/gi, '');
    }

    const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await res.blob();
    return { blob, filename, contentType, notes, category };
  },

  // --- ADMIN & INVESTIGATION (RBAC) ---
  async getAdminReports(): Promise<{ success: boolean; count: number; reports: any[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/reports`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal mengambil data laporan admin.');
    return data;
  },

  async downloadAdminEnvelope(reportId: number): Promise<{ blob: Blob; filename: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/envelope`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Gagal mengunduh berkas envelope.' }));
      throw new Error(err.detail || 'Gagal mengunduh berkas envelope.');
    }

    let filename = res.headers.get('X-Filename') || `report_${reportId}.json`;
    const disposition = res.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const blob = await res.blob();
    return { blob, filename };
  },

  async getAdminStats(): Promise<{
    success: boolean;
    total_reports: number;
    total_users: number;
    categories: Record<string, number>;
  }> {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal mengambil statistik admin.');
    return data;
  },
};
