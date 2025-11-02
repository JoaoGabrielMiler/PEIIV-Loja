import { Link, useLocation } from "react-router-dom";
import { buildGoogleCalendarLink } from "../../utils/calendarLinks";
import "../../styles/Confirmacao.css";

const NOME_DA_LOJA = "Minha Loja";
const ENDERECO_LOJA = "Rua Exemplo, 123 - Centro, Cidade/UF";

type NavState = { nome: string; telefone: string; data: string; hora: string };

export default function Confirmacao() {
  const { state } = useLocation() as { state?: NavState };

  const nome = state?.nome ?? "";
  const telefone = state?.telefone ?? "";
  const data = state?.data ?? ""; // "YYYY-MM-DD"
  const hora = state?.hora ?? ""; // "HH:mm"
  const dataFmt = data ? data.split("-").reverse().join("/") : "";

  // Google Calendar
  let gcalLink: string | undefined;
  if (state) {
    const [h, m] = hora.split(":").map(Number);
    const endHour = (h + 1) % 24;
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
    <div className="confirmacao">
      <h1 className="confirmacao__title">✅ Agendamento Concluído!</h1>
      <p className="confirmacao__text">
        {state
          ? `Tudo certo, ${nome}! Seu horário ficou agendado para o dia ${dataFmt} às ${hora}.`
          : "Seu horário foi agendado com sucesso. Nossa equipe entrará em contato para confirmar os detalhes."}
      </p>

      <div className="confirmacao__actions">
        {gcalLink && (
          <a href={gcalLink} target="_blank" rel="noreferrer" className="cbtn cbtn--google">
            Adicionar ao Google Agenda
          </a>
        )}
        <Link to="/" className="cbtn cbtn--secondary">Voltar à página inicial</Link>
      </div>
    </div>
  );
}
