import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import "../../styles/Agendar.css";
import {
  getSacola,
  removeItem as sacolaRemove,
  clearSacola,
  type ItemProva,
} from "../../utils/sacola";

export default function Agendar() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [itens, setItens] = useState<ItemProva[]>([]);
  const navigate = useNavigate();

  // -------- Admin escondido
  const pressTimer = useRef<number | null>(null);
  const handleAdminClick = () => {
    const senhaCorreta = "12345";
    const senhaDigitada = prompt("Digite a senha de administrador:");
    if (senhaDigitada === senhaCorreta) navigate("/admin");
    else if (senhaDigitada !== null) alert("❌ Senha incorreta!");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") handleAdminClick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const startPress = () => {
    clearTimeout(pressTimer.current!);
    pressTimer.current = window.setTimeout(() => handleAdminClick(), 900);
  };
  const endPress = () => clearTimeout(pressTimer.current!);
  // --------

  // Carrega sacola ao abrir
  useEffect(() => {
    setItens(getSacola());
  }, []);

  // Carrega horários do dia e remove os que já estão ocupados
  const buscarHorarios = async (dataSelecionada: string) => {
    try {
      // 1) base do admin
      const baseRef = doc(db, "horariosDisponiveis", dataSelecionada);
      const baseSnap = await getDoc(baseRef);
      const baseHoras: string[] = baseSnap.exists() ? (baseSnap.data().horas || []) : [];

      // 2) já reservados nessa data
      const q = query(collection(db, "agendamentos"), where("data", "==", dataSelecionada));
      const snap = await getDocs(q);
      const ocupados = new Set(snap.docs.map((d) => (d.data() as any).hora));

      // 3) livres
      const livres = baseHoras.filter((h) => !ocupados.has(h)).sort();
      setHorariosDisponiveis(livres);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      setHorariosDisponiveis([]);
    }
  };

  // Remover item da lista na própria tela
  const removerItemLocal = (produtoId: string) => {
    sacolaRemove(produtoId);
    setItens(getSacola());
  };

  // Submit com transação + ID único por data+hora + itens da sacola
  const confirmarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !telefone || !data || !hora) {
      alert("Preencha nome, telefone, data e hora.");
      return;
    }
    if (itens.length > 5) {
      alert("Você só pode selecionar até 5 peças para provar.");
      return;
    }

    setEnviando(true);
    try {
      const horaSafe = hora.replace(":", ""); // "1300"
      const docId = `ag_${data}_${horaSafe}`; // 1 slot por data+hora
      const ref = doc(db, "agendamentos", docId);

      await runTransaction(db, async (tx) => {
        const current = await tx.get(ref);
        if (current.exists()) {
          throw new Error("Esse horário acabou de ser reservado. Escolha outro.");
        }
        tx.set(ref, {
          nome,
          telefone,
          data,       // "YYYY-MM-DD"
          hora,       // "HH:mm"
          itens,      // <<<<<< guarda a sacola junto no doc
          criadoEm: serverTimestamp(),
        });
      });

      // Limpa sacola e vai para a confirmação
      const payload = { nome, telefone, data, hora };
      clearSacola();
      setItens([]);
      setNome(""); setTelefone(""); setData(""); setHora("");
      navigate("/confirmacao", { state: payload });
    } catch (error: any) {
      alert(error?.message || "❌ Não foi possível reservar este horário.");
    } finally {
      setEnviando(false);
    }
  };

  const dataEscolhida = Boolean(data);

  return (
    <div className="agendar-container d-flex flex-column min-vh-100">
      {/* HEADER */}
      <header className="agendar-header py-4">
        <div className="container text-center">
          <h1
            className="agendar-title display-5"
            onDoubleClick={handleAdminClick}
            onMouseDown={startPress}
            onMouseUp={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            title="Duplo clique ou segure para admin"
          >
            Agendar Horário
          </h1>
          <p className="agendar-subtitle mb-0">Preencha as informações abaixo</p>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="container py-4 flex-grow-1">
        <section className="agendar-section" aria-labelledby="titulo-agendar">
          <h2 id="titulo-agendar" className="section-title">
            <span className="emoji" role="img" aria-label="Calendário">📅</span>
            Dados do Agendamento
          </h2>

          <div className="card agendar-card">
            <div className="card-body">
              <form className="agendar-form mx-auto" onSubmit={confirmarAgendamento}>
                <h3 className="h5 mb-3">Seus dados</h3>

                <div className="mb-3">
                  <label className="form-label" htmlFor="nome">Nome completo</label>
                  <input
                    id="nome"
                    type="text"
                    className="form-control"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Maria Silva"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="tel">Telefone</label>
                  <input
                    id="tel"
                    type="tel"
                    className="form-control"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Ex.: (11) 91234-5678"
                    inputMode="numeric"
                  />
                </div>

                <h3 className="h5 mt-4 mb-3">Data e horário</h3>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="data">Data</label>
                    <input
                      id="data"
                      type="date"
                      className="form-control"
                      required
                      value={data}
                      onChange={(e) => {
                        const novaData = e.target.value;
                        setData(novaData);
                        setHora("");
                        buscarHorarios(novaData);
                      }}
                    />
                    <div className="form-text input-hint">
                      Escolha a data para ver horários disponíveis.
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="hora">Hora</label>
                    <select
                      id="hora"
                      className="form-select"
                      required
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      disabled={!dataEscolhida}
                    >
                      <option value="">
                        {dataEscolhida ? "Selecione um horário" : "Selecione uma data primeiro"}
                      </option>
                      {dataEscolhida && (
                        horariosDisponiveis.length > 0 ? (
                          horariosDisponiveis.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))
                        ) : (
                          <option disabled>Nenhum horário disponível</option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Itens selecionados para provar */}
                <h3 className="h5 mt-4 mb-3">Peças selecionadas para provar</h3>
                {itens.length === 0 ? (
                  <p className="text-muted">Nenhuma peça selecionada na vitrine.</p>
                ) : (
                  <ul className="list-group mb-3">
                    {itens.map((it) => (
                      <li key={it.produtoId} className="list-group-item d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          {it.imagem && (
                            <img src={it.imagem} alt={it.nome} width={48} height={48} style={{ borderRadius: 8, objectFit: "cover" }} />
                          )}
                          <div>
                            <div className="fw-semibold">{it.nome}</div>
                            {it.categoria && <small className="text-muted">{it.categoria}</small>}
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removerItemLocal(it.produtoId)}>
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button type="submit" className="btn btn-gradient w-100 mt-2" disabled={enviando}>
                  {enviando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Enviando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </button>

                <Link to="/" className="btn btn-ghost w-100 mt-2">← Voltar</Link>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="agendar-footer text-light text-center py-3 mt-auto position-relative">
        <small>© {new Date().getFullYear()} Minha Loja PWA</small>
        <button
          className="admin-foot-gear"
          onClick={handleAdminClick}
          aria-label="Admin"
          title="Admin"
        >
          ⚙️
        </button>
      </footer>
    </div>
  );
}
