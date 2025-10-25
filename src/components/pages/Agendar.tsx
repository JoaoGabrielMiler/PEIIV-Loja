import { useState } from "react";
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
  const navigate = useNavigate();
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

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

      setNome("");
      setTelefone("");
      setData("");
      setHora("");
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
      const docRef = doc(db, "storeSlots", dataSelecionada);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dados = docSnap.data();
        const slots = dados.slots ? Object.entries(dados.slots) : [];
        const horariosLivres = slots
          .filter(([_, valor]: any) => valor.booked < valor.capacity)
          .map(([hora]) => hora);
        setHorariosDisponiveis(horariosLivres);
      } else {
        setHorariosDisponiveis([]);
      }
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    }
  };

  return (
    <div className="agendar-container min-vh-100 d-flex flex-column">
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1 className="fw-bold text-primary">Agendar Horário</h1>
          <p className="text-muted mb-0">Preencha as informações abaixo</p>
        </div>
      </header>

      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        <form
          className="agendar-form p-4 shadow-lg rounded-4 bg-white"
          onSubmit={handleSubmit}
        >
          <div className="mb-3">
            <label className="form-label">Nome completo</label>
            <input
              type="text"
              className="form-control"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Telefone</label>
            <input
              type="tel"
              className="form-control"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Data</label>
              <input
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
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Hora</label>
              <select
                className="form-select"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              >
                <option value="">Selecione um horário</option>
                {horariosDisponiveis.length > 0 ? (
                  horariosDisponiveis.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))
                ) : (
                  <option disabled>Nenhum horário disponível</option>
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mt-3"
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Confirmar Agendamento"}
          </button>

          <Link to="/" className="btn btn-link mt-3 text-decoration-none">
            ← Voltar
          </Link>
        </form>
      </main>

      <footer className="bg-dark text-light text-center py-3">
        <small>© {new Date().getFullYear()} Minha Loja PWA</small>
      </footer>
    </div>
  );
}
