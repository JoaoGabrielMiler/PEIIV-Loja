import { Link, useLocation } from "react-router-dom";
import { buildWhatsAppLink } from "../../utils/whatsapp";
import { buildGoogleCalendarLink } from "../../utils/calendarLinks";
import "../../styles/Confirmacao.css";

const NOME_DA_LOJA = "Minha Loja";
const ENDERECO_LOJA = "Rua Exemplo, 123 - Centro, Cidade/UF";

type NavState = { nome: string; telefone: string; data: string; hora: string };

export default function Confirmacao() {
  const { state } = useLocation() as { state?: NavState };

  // Se chegou sem state (ex.: deu refresh), mantém a tela simples
  const nome = state?.nome ?? "";
  const telefone = state?.telefone ?? "";
  const data = state?.data ?? "";
  const hora = state?.hora ?? "";

  // Formata data "YYYY-MM-DD" -> "DD/MM/YYYY"
  const dataFmt = data ? data.split("-").reverse().join("/") : "";

  // Mensagem do WhatsApp
  const waMsg = state
    ? `Oi ${nome}! Seu agendamento está confirmado para ${dataFmt} às ${hora}.
Endereço: ${ENDERECO_LOJA}. Até breve!`
    : "";

  const waLink = state ? buildWhatsAppLink({ phone: telefone, text: waMsg }) : undefined;

  // Google Calendar (link de adicionar)
  // usamos segundos e indicamos o fuso em tz; aqui somamos 1h para o fim
  let gcalLink: string | undefined = undefined;
  if (state) {
    const [h, m] = hora.split(":").map(Number);
    const endHour = (h + 1) % 24; // simples; se cruzar meia-noite, ajuste conforme sua regra
    const startISO = `${data}T${hora}:00`;
    const endISO = `${data}T${String(endHour).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;

    gcalLink = buildGoogleCalendarLink({
      title: `Prova de roupas – ${NOME_DA_LOJA}`,
      description: `Cliente: ${nome} – Tel: ${telefone}`,
      location: ENDERECO_LOJA,
      startISO,
      endISO,
      tz: "America/Cuiaba",
    });
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>✅ Agendamento Concluído!</h1>

      <p style={styles.text}>
        {state
          ? `Tudo certo, ${nome}! Seu horário ficou para ${dataFmt} às ${hora}.`
          : "Seu horário foi agendado com sucesso. Nossa equipe entrará em contato para confirmar os detalhes."}
      </p>

      {waLink && (
        <a href={waLink} target="_blank" rel="noreferrer" style={styles.button}>
          Enviar no WhatsApp
        </a>
      )}

      {gcalLink && (
        <a
          href={gcalLink}
          target="_blank"
          rel="noreferrer"
          style={{ ...styles.button, backgroundColor: "#1a73e8", marginTop: 12 }}
        >
          Adicionar ao Google Agenda
        </a>
      )}

      <Link to="/" style={{ ...styles.button, backgroundColor: "#666", marginTop: 12 }}>
        Voltar à página inicial
      </Link>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f8f9fa",
    fontFamily: "sans-serif",
    textAlign: "center" as const,
    padding: "2rem",
  },
  title: {
    fontSize: "2rem",
    color: "#28a745",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.1rem",
    color: "#333",
    marginBottom: "1rem",
    maxWidth: "420px",
    whiteSpace: "pre-line" as const,
  },
  button: {
    padding: "1rem 2rem",
    backgroundColor: "#222",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    display: "inline-block",
  },
};
