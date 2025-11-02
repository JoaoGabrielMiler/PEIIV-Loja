// src/utils/calendarLinks.ts

/**
 * Monta o link oficial "Adicionar ao Google Agenda" (eventedit).
 * Passe o início/fim em ISO (com ou sem offset). O fuso é indicado via `stz`/`etz`.
 *
 * Exemplo de uso:
 *  const startISO = "2025-10-30T14:00:00-04:00";
 *  const endISO   = "2025-10-30T15:00:00-04:00";
 *  const url = buildGoogleCalendarLink({
 *    title: "Prova de roupas – Minha Loja",
 *    description: "Cliente: Maria – Tel: (65) 9 9999-9999",
 *    location: "Rua Exemplo, 123 - Centro, Cidade/UF",
 *    startISO,
 *    endISO,
 *    tz: "America/Cuiaba",
 *  });
 */

type Params = {
  title: string;
  description?: string;
  location?: string;
  startISO: string; // "YYYY-MM-DDTHH:mm:ss[±HH:mm|Z]"
  endISO: string;   // "YYYY-MM-DDTHH:mm:ss[±HH:mm|Z]"
  tz?: string;      // ex.: "America/Cuiaba"
};

export function buildGoogleCalendarLink({
  title,
  description,
  location,
  startISO,
  endISO,
  tz = "America/Cuiaba",
}: Params): string {
  const toCompact = (iso: string) => {
    // pega só "YYYY-MM-DDTHH:mm:ss" e remove "-" e ":"
    const m = iso.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    const core = (m ? m[0] : iso).replace(/[-:]/g, "");
    // fica "YYYYMMDDTHHmmss"
    return core;
  };

  const url = new URL("https://calendar.google.com/calendar/r/eventedit");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("details", description ?? "");
  url.searchParams.set("location", location ?? "");
  url.searchParams.set("stz", tz);
  url.searchParams.set("etz", tz);
  url.searchParams.set("dates", `${toCompact(startISO)}/${toCompact(endISO)}`);

  return url.toString();
}
