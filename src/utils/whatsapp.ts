/** Converte número solto para E.164. Ex.: "(65) 9 9999-9999" -> "5565999999999" */
export function toE164(phone: string, defaultCountry = "55"): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith(defaultCountry) ? digits : `${defaultCountry}${digits}`;
}

/** Monta o link oficial "Click to Chat" do WhatsApp */
export function buildWhatsAppLink({
  phone,
  text,
  defaultCountry = "55",
}: {
  phone: string;
  text: string;
  defaultCountry?: string;
}) {
  const e164 = toE164(phone, defaultCountry);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${e164}?text=${encoded}`;
}