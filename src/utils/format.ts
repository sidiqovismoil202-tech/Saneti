/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Raqamni o'zbekcha so'm formatida chiqarish (minglik ajratgich bilan)
 * Masalan: 1250000 -> "1 250 000 so'm"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return "0 so'm";
  }
  const num = typeof amount === 'string' ? parseInt(amount.replace(/\D/g, ''), 10) || 0 : Math.round(amount);
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} so'm`;
}

/**
 * Matndan faqat raqamlarni olib, kiritish maydoni uchun oraliqlar bilan formatlaydi
 * Masalan: "1250000" -> "1 250 000"
 */
export function formatNumberWithSpaces(value: string | number): string {
  const cleanDigits = String(value).replace(/\D/g, '');
  if (!cleanDigits) return '';
  return cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Kiritilgan bo'shliqli qiymatdan sof butun sonni qaytaradi
 * Masalan: "1 250 000" -> 1250000
 */
export function parseRawNumber(value: string | number): number {
  if (typeof value === 'number') return Math.max(0, Math.floor(value));
  const digits = String(value).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * O'zbekiston telefon raqamini formatlash: +998 (90) 123-45-67 yoki +998 90 123 45 67
 */
export function formatPhoneNumber(input: string): string {
  // Faqat raqamlarni qoldiramiz
  const numbers = input.replace(/\D/g, '');
  
  if (!numbers) return '';

  // Agar 998 bilan boshlanmasa yoki 9 ta raqam bo'lsa (901234567)
  let clean = numbers;
  if (clean.startsWith('998')) {
    clean = clean.substring(3);
  }
  // Maksimal 9 ta raqam (kod + raqam)
  clean = clean.substring(0, 9);

  let formatted = '+998';
  if (clean.length > 0) {
    formatted += ' ' + clean.substring(0, 2);
  }
  if (clean.length > 2) {
    formatted += ' ' + clean.substring(2, 5);
  }
  if (clean.length > 5) {
    formatted += ' ' + clean.substring(5, 7);
  }
  if (clean.length > 7) {
    formatted += ' ' + clean.substring(7, 9);
  }

  return formatted;
}

/**
 * O'zbekiston telefon raqami to'liq va to'g'ri kiritilganligini tekshirish
 * +998 XX XXX XX XX (jami 12 ta raqam)
 */
export function isValidUzbekPhone(phone: string): boolean {
  if (!phone) return true; // Majburiy emas bo'lsa bo'sh bo'lishi mumkin
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('998');
}
