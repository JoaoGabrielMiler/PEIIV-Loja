import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import "../../styles/AdminListar.css";

type Produto = {
  id: string;
  nome?: string;
  preco?: number | string;
  descricao?: string;
  imagem?: string;
  promocao?: boolean;
};

type HorarioDoc = {
  id: string;         // yyyy-mm-dd
  horas: string[];    // ["14:10","16:30"]
};

export default function AdminListar() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [horarios, setHorarios] = useState<HorarioDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // estados de edição (produto)
  const [editProdId, setEditProdId] = useState<string | null>(null);
  const [editPreco, setEditPreco] = useState<string>("");
  const [editPromo, setEditPromo] = useState<boolean>(false);

  // estados de edição (horários)
  const [editHorId, setEditHorId] = useState<string | null>(null);
  const [editHoras, setEditHoras] = useState<string[]>([]);
  const [novoHorario, setNovoHorario] = useState<string>("");

  // helpers
  const toBRL = (v?: number | string) => {
    if (v === undefined || v === null) return "—";
    if (typeof v === "number")
      return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    // string já formatada?
    if (v.toString().trim().startsWith("R$")) return v.toString();
    const n = parseRealToNumber(v.toString());
    if (Number.isFinite(n))
      return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return v.toString();
  };

  const parseRealToNumber = (raw: string) => {
    // remove tudo que não for dígito, vírgula, ponto, ou sinal
    const s = raw.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  // carregamento
  const carregarProdutos = async () => {
    const snap = await getDocs(collection(db, "produtos"));
    const lista: Produto[] = [];
    snap.forEach((docu) => lista.push({ id: docu.id, ...(docu.data() as any) }));
    setProdutos(lista);
  };

  const carregarHorarios = async () => {
    const snap = await getDocs(collection(db, "horariosDisponiveis"));
    const lista: HorarioDoc[] = [];
    snap.forEach((docu) =>
      lista.push({ id: docu.id, ...(docu.data() as any) })
    );
    // ordena por data asc
    lista.sort((a, b) => a.id.localeCompare(b.id));
    setHorarios(lista);
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([carregarProdutos(), carregarHorarios()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, []);

  // ações: produtos
  const removerProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;
    await deleteDoc(doc(db, "produtos", id));
    await carregarProdutos();
  };

  const iniciarEdicaoProduto = (p: Produto) => {
    setEditProdId(p.id);
    setEditPreco(
      typeof p.preco === "number" ? p.preco.toString() : (p.preco ?? "")
    );
    setEditPromo(!!p.promocao);
  };

  const cancelarEdicaoProduto = () => {
    setEditProdId(null);
    setEditPreco("");
    setEditPromo(false);
  };

  const salvarProduto = async () => {
    if (!editProdId) return;
    const precoNumber = parseRealToNumber(editPreco);
    if (!Number.isFinite(precoNumber) || precoNumber < 0) {
      alert("Preço inválido.");
      return;
    }
    await updateDoc(doc(db, "produtos", editProdId), {
      preco: precoNumber,     // salva como number (recomendado)
      promocao: editPromo,
    });
    cancelarEdicaoProduto();
    await carregarProdutos();
  };

  // ações: horários
  const removerHorario = async (id: string) => {
    if (!confirm("Remover horários do dia " + id + "?")) return;
    await deleteDoc(doc(db, "horariosDisponiveis", id));
    await carregarHorarios();
  };

  const iniciarEdicaoHorarios = (h: HorarioDoc) => {
    setEditHorId(h.id);
    setEditHoras([...(h.horas ?? [])]);
    setNovoHorario("");
  };

  const cancelarEdicaoHorarios = () => {
    setEditHorId(null);
    setEditHoras([]);
    setNovoHorario("");
  };

  const addHorario = () => {
    const val = novoHorario.trim();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(val)) {
      alert("Use o formato HH:mm (ex.: 14:30).");
      return;
    }
    if (editHoras.includes(val)) {
      alert("Esse horário já está na lista.");
      return;
    }
    setEditHoras((prev) => [...prev, val].sort());
    setNovoHorario("");
  };

  const removeHorarioChip = (h: string) => {
    setEditHoras((prev) => prev.filter((x) => x !== h));
  };

  const salvarHorarios = async () => {
    if (!editHorId) return;
    await updateDoc(doc(db, "horariosDisponiveis", editHorId), {
      horas: editHoras.sort(),
    });
    cancelarEdicaoHorarios();
    await carregarHorarios();
  };

  if (loading) {
    return (
      <div className="adminlist-container min-vh-100 d-flex flex-column">
        <header className="bg-light shadow-sm py-3">
          <div className="container text-center">
            <h1 className="fw-bold text-primary">Painel de Visualização</h1>
            <p className="text-muted mb-0">Gerencie produtos e horários</p>
          </div>
        </header>
        <main className="container py-5 text-center">Carregando…</main>
      </div>
    );
  }

  return (
    <div className="adminlist-container min-vh-100 d-flex flex-column">
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1 className="fw-bold text-primary">Painel de Visualização</h1>
          <p className="text-muted mb-0">Gerencie produtos e horários</p>
        </div>
      </header>

      <main className="container py-4 flex-grow-1">
        {/* PRODUTOS */}
        <section>
          <h2 className="text-center mb-3">🛍️ Produtos Cadastrados</h2>
          <div className="row g-4">
            {produtos.length === 0 ? (
              <p className="text-center">Nenhum produto cadastrado.</p>
            ) : (
              produtos.map((p) => {
                const emEdicao = editProdId === p.id;
                return (
                  <div className="col-12 col-sm-6 col-md-4" key={p.id}>
                    <div className="card h-100 shadow-sm product-card">
                      {p.imagem && (
                        <img
                          src={p.imagem}
                          alt={p.nome}
                          className="card-img-top product-card__img"
                        />
                      )}
                      <div className="card-body text-center">
                        <h5 className="product-card__title">{p.nome}</h5>

                        {/* PREÇO / EDIÇÃO */}
                        {!emEdicao ? (
                          <p className="product-card__price">{toBRL(p.preco)}</p>
                        ) : (
                          <div className="inline-edit">
                            <label className="inline-edit__label">Preço</label>
                            <input
                              value={editPreco}
                              onChange={(e) => setEditPreco(e.target.value)}
                              placeholder="199,99"
                              className="form-control inline-edit__input"
                              inputMode="decimal"
                            />
                          </div>
                        )}

                        {/* DESCRIÇÃO */}
                        {p.descricao && (
                          <p className="text-muted small product-card__desc">
                            {p.descricao}
                          </p>
                        )}

                        {/* PROMOÇÃO */}
                        <div className="d-flex justify-content-center align-items-center gap-2 my-2">
                          {!emEdicao ? (
                            p.promocao ? (
                              <span className="badge bg-success-subtle text-success-emphasis">
                                Em promoção
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary-emphasis">
                                Preço normal
                              </span>
                            )
                          ) : (
                            <label className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editPromo}
                                onChange={(e) => setEditPromo(e.target.checked)}
                              />
                              <span>Marcar como promoção</span>
                            </label>
                          )}
                        </div>

                        {/* AÇÕES */}
                        {!emEdicao ? (
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => iniciarEdicaoProduto(p)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removerProduto(p.id)}
                            >
                              Remover
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={salvarProduto}
                            >
                              Salvar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={cancelarEdicaoProduto}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <hr className="my-5" />

        {/* HORÁRIOS */}
        <section>
          <h2 className="text-center mb-3">🕒 Horários Disponíveis</h2>
          {horarios.length === 0 ? (
            <p className="text-center">Nenhum horário cadastrado.</p>
          ) : (
            <ul className="list-group hours-list">
              {horarios.map((h) => {
                const emEdicao = editHorId === h.id;
                return (
                  <li
                    key={h.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    {!emEdicao ? (
                      <>
                        <div className="hours-list__row">
                          <span className="hours-list__date">{h.id}</span>
                          <span className="hours-list__slots">
                            — {h.horas.join(", ")}
                          </span>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => iniciarEdicaoHorarios(h)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removerHorario(h.id)}
                          >
                            ✖
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-100">
                        <div className="mb-2">
                          <strong>{h.id}</strong>
                        </div>

                        {/* chips de horários */}
                        <div className="chips mb-2">
                          {editHoras.map((hora) => (
                            <span key={hora} className="chip">
                              {hora}
                              <button
                                className="chip__x"
                                onClick={() => removeHorarioChip(hora)}
                                aria-label={`Remover ${hora}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {editHoras.length === 0 && (
                            <span className="text-muted">Sem horários.</span>
                          )}
                        </div>

                        {/* adicionar novo horário */}
                        <div className="d-flex gap-2 mb-2">
                          <input
                            className="form-control"
                            placeholder="HH:mm"
                            value={novoHorario}
                            onChange={(e) => setNovoHorario(e.target.value)}
                            maxLength={5}
                          />
                          <button className="btn btn-outline-primary" onClick={addHorario}>
                            Adicionar
                          </button>
                        </div>

                        <div className="d-flex gap-2">
                          <button className="btn btn-success" onClick={salvarHorarios}>
                            Salvar
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={cancelarEdicaoHorarios}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="text-center mt-4">
          <Link to="/admin" className="btn btn-outline-secondary mx-2">
            ← Voltar ao Painel
          </Link>
          <Link to="/" className="btn btn-outline-dark mx-2">
            Início
          </Link>
        </div>
      </main>

      <footer className="bg-dark text-light text-center py-3 mt-auto">
        <small>© {new Date().getFullYear()} Minha Loja PWA</small>
      </footer>
    </div>
  );
}
