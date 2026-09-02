/**
 * Guard rails for chat content. We keep conversations inside Quiko (like OLX /
 * Uber) so support, safety, and the escrow flow stay intact — that means no
 * phone numbers exchanged in the message thread.
 */

/**
 * True if the text looks like it contains a phone number. Collapses the common
 * separators people hide numbers behind ("98765 43210", "987-654-3210",
 * "+91 98765 43210") and flags any run of 7+ digits — long enough to be a
 * phone number, short enough to still allow prices, weights and pincodes.
 */
export function containsPhoneNumber(text: string): boolean {
  const compact = text.replace(/[\s\-().+]/g, "");
  return /\d{7,}/.test(compact);
}
