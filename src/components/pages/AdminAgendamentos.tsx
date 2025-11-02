import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "../../styles/AdminAgendamentos.css";

type Agendamento = {
  id: string;
  nome: string;
  telefone: string;
  data: string; // "YYYY-MM-DD"
  hora: string; // "HH:mm"
};

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminAgendamentos() {
  const [items, setItems] = useState<Agendamento[]>([]);
  const [busca, setBusca] = useState("");

  const start = useMemo(() => todayStr(), []);
  const end = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    const col = collection(db, "agendamentos");
    const q = query(
      col,
      where("data", ">=", start),
      where("data", "<=", end),
      orderBy("data")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Agendamento[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      list.sort((a, b) => {
        const byDate = (a.data || "").localeCompare(b.data || "");
        if (byDate !== 0) return byDate;
        return (a.hora || "").localeCompare(b.hora || "");
      });

      setItems(list);
    });

    return unsub;
  }, [start, end]);

  const filtered = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (it) =>
        it.nome?.toLowerCase().includes(term) ||
        it.telefone?.toLowerCase().includes(term) ||
        it.data?.includes(term) ||
        it.hora?.includes(term)
    );
  }, [items, busca]);

  async function handleDelete(id: string, it: Agendamento) {
    const ok = confirm(
      `Excluir agendamento de ${it.nome || "cliente"} em ${it.data} às ${it.hora}?`
    );
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "agendamentos", id));
    } catch (e) {
      console.error("Erro ao excluir:", e);
      alert("Não foi possível excluir. Tente novamente.");
    }
  }

  return (
    <div className="admin">
      <div className="admin__header">
        <div className="admin__left">
          <Link to="/admin" className="admin__btn-back" aria-label="Voltar ao painel do administrador">
            ← Voltar
          </Link>
          <div className="admin__title">Agendamentos Confirmados</div>
        </div>

        <input
          className="admin__search"
          placeholder="Buscar por nome, telefone, data..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="admin__tablewrap">
        <table className="admin__table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin__empty">Nenhum agendamento encontrado.</td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.id}>
                  <td>{it.data}</td>
                  <td>{it.hora}</td>
                  <td>{it.nome}</td>
                  <td>{it.telefone}</td>
                  <td>
                    <button
                      className="admin__btn-del"
                      onClick={() => handleDelete(it.id, it)}
                      aria-label={`Excluir agendamento de ${it.nome} em ${it.data} às ${it.hora}`}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
