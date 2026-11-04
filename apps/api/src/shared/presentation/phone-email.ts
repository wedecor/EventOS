/** Flattens docs/09 nested phone into a single persistence string. */
export function toPhoneString(phone: {
  countryCode: string;
  number: string;
}): string {
  return `${phone.countryCode}${phone.number}`;
}

/** Normalizes docs/09 nested email to a lowercase persistence string. */
export function toEmailString(email: { value: string }): string {
  return email.value.trim().toLowerCase();
}
