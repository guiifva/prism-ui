/**
 * Funções de validação reutilizáveis
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateHTTPSURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateDateRange(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end >= start;
  } catch {
    return false;
  }
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    return file.type === type;
  });
}

export function validateImageFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  if (!validateFileType(file, ['image/png', 'image/jpeg', 'image/jpg'])) {
    return { valid: false, error: 'Formato de imagem inválido. Use PNG ou JPEG.' };
  }

  if (!validateFileSize(file, maxSizeMB)) {
    return { valid: false, error: `Imagem deve ter no máximo ${maxSizeMB}MB.` };
  }

  return { valid: true };
}

export function validateStringLength(str: string, min: number, max: number): boolean {
  const length = str.trim().length;
  return length >= min && length <= max;
}

export function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
