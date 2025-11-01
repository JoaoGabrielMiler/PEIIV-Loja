import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import "./Agendar.css";

export default function Agendar() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const navigate = useNavigate();

  // -------- Admin escondido (mesmo padrão da Home)
  const pressTimer = useRef<number | null>(null);
  const handleAdminClick = () => {
    const senhaCorreta = "12345";
    const senhaDigitada = prompt("Digite a senha de administrador:");
    if (senhaDigitada === senhaCorreta) navigate("/admin");
    else if (senhaDigitada !== null) alert("❌ Senha incorreta!");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        handleAdminClick();
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "agendamentos"), {
        nome,
        telefone,
        data,
        hora,
        criadoEm: new Date(),
      });
      setNome(""); setTelefone(""); setData(""); setHora("");
      navigate("/confirmacao");
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert("❌ Ocorreu um erro ao salvar o agendamento.");
    } finally {
      setEnviando(false);
    }
  };

  const buscarHorarios = async (dataSelecionada: string) => {
  try {
    const docRef = doc(db, "horariosDisponiveis", dataSelecionada);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const horarios = docSnap.data().horas || [];
      setHorariosDisponiveis(horarios);
    } else {
      setHorariosDisponiveis([]);
    }
  } catch (error) {
    console.error("Erro ao buscar horários:", error);
  }
};


  const dataEscolhida = Boolean(data);

  return (
    <div className="agendar-container min-vh-100 d-flex flex-column">
      {/* Header (com duplo clique/long-press para admin) */}
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1
            className="fw-bold text-primary page-title"
            onDoubleClick={handleAdminClick}
            onMouseDown={startPress}
            onMouseUp={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            title="Duplo clique ou segure para admin"
          >
            Agendar Horário
          </h1>
          <p className="text-muted mb-0">Preencha as informações abaixo</p>
        </div>
      </header>

      {/* Seção com o mesmo banner/hero da Home */}
      <section className="banner flex-grow-1 d-flex align-items-center justify-content-center text-center text-light">
        <form
          className="hero-card agendar-form p-4 rounded-4 text-start"
          onSubmit={handleSubmit}
        >
          <h2 className="h4 mb-3">Seus dados</h2>

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

          <h2 className="h4 mt-4 mb-3">Data e horário</h2>
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
                  buscarHorarios(novaData);
                }}
              />
              <div className="form-text text-light-subtle">
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

          <button
            type="submit"
            className="btn btn-primary w-100 mt-2"
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Confirmar Agendamento"}
          </button>

          <Link to="/" className="btn btn-outline-light w-100 mt-2">
            ← Voltar
          </Link>
        </form>
      </section>

      {/* Footer padrão com engrenagem de admin discreta */}
      <footer className="app-footer bg-dark text-light text-center py-3 mt-auto position-relative">
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
