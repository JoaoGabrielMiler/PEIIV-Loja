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
  categoria?: string;
  promocao?: boolean;
  expiraEm?: any; // Firestore Timestamp | Date
};

type HorarioDoc = {
  id: string; // yyyy-mm-dd
  horas: string[]; // ["14:10","16:30"]
};

export default function AdminListar() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [horarios, setHorarios] = useState<HorarioDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== edição de produto
  const [editProdId, setEditProdId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState<string>("");
  const [editDescricao, setEditDescricao] = useState<string>("");
  const [editPreco, setEditPreco] = useState<string>("");
  const [editPromo, setEditPromo] = useState<boolean>(false);
  const [editExpiraEm, setEditExpiraEm] = useState<string>(""); // yyyy-mm-dd

  // ===== edição de horários
  const [editHorId, setEditHorId] = useState<string | null>(null);
  const [editHoras, setEditHoras] = useState<string[]>([]);
  const [novoHorario, setNovoHorario] = useState<string>("");

  // ===== helpers
  const toBRL = (v?: number | string) => {
    if (v === undefined || v === null) return "—";
    if (typeof v === "number")
      return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (v.toString().trim().startsWith("R$")) return v.toString();
    const n = parseRealToNumber(v.toString());
    return Number.isFinite(n)
      ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : v.toString();
  };

  const parseRealToNumber = (raw: string) => {
    const s = raw.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const formatDate = (raw?: any) => {
    if (!raw) return "";
    const d: Date =
      raw instanceof Date
        ? raw
        : raw.toDate
        ? raw.toDate()
        : new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  };

  // ===== carregamento
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

  // ===== ações de produto
  const removerProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;
    await deleteDoc(doc(db, "produtos", id));
    await carregarProdutos();
  };

  const iniciarEdicaoProduto = (p: Produto) => {
    setEditProdId(p.id);
    setEditNome(p.nome ?? "");
    setEditDescricao(p.descricao ?? "");
    setEditPreco(
      typeof p.preco === "number" ? p.preco.toString() : (p.preco ?? "")
    );
    setEditPromo(!!p.promocao);

    // converte expiraEm para yyyy-mm-dd (para o input[type=date])
    let dataStr = "";
    if (p.expiraEm) {
      const raw = p.expiraEm as any;
      const d: Date =
        raw instanceof Date
          ? raw
          : raw.toDate
          ? raw.toDate()
          : new Date(raw);
      if (!isNaN(d.getTime())) {
        dataStr = d.toISOString().slice(0, 10); // yyyy-mm-dd
      }
    }
    setEditExpiraEm(dataStr);
  };

  const cancelarEdicaoProduto = () => {
    setEditProdId(null);
    setEditNome("");
    setEditDescricao("");
    setEditPreco("");
    setEditPromo(false);
    setEditExpiraEm("");
  };

  const salvarProduto = async () => {
    if (!editProdId) return;

    const nomeTrim = editNome.trim();
    if (nomeTrim.length === 0) {
      alert("Informe um nome para o produto.");
      return;
    }

    const precoNumber = parseRealToNumber(editPreco);
    if (!Number.isFinite(precoNumber) || precoNumber < 0) {
      alert("Preço inválido.");
      return;
    }

    // se estiver em promoção, exigimos uma data de expiração
    let expiraDate: Date | null = null;
    if (editPromo) {
      if (!editExpiraEm) {
        alert("Informe até quando a promoção é válida.");
        return;
      }
      const d = new Date(editExpiraEm + "T23:59:59");
      if (isNaN(d.getTime())) {
        alert("Data de expiração inválida.");
        return;
      }
      expiraDate = d;
    }

    const payload: any = {
      nome: nomeTrim,
      descricao: editDescricao.trim(),
      preco: precoNumber,
      promocao: editPromo,
    };

    if (expiraDate) {
      payload.expiraEm = expiraDate;
    } else {
      payload.expiraEm = null; // limpa se não for promoção
    }

    await updateDoc(doc(db, "produtos", editProdId), payload);

    cancelarEdicaoProduto();
    await carregarProdutos();
  };

  // ===== toggle rápido de promoção (com dias de duração)
  const togglePromocaoRapida = async (produto: Produto) => {
    if (editProdId === produto.id) {
      // se já estiver em edição, usa o fluxo de salvar/cancelar
      return;
    }

    const novoValor = !produto.promocao;
    const payload: any = { promocao: novoValor };

    if (novoValor) {
      const diasStr = prompt(
        "Por quantos dias essa peça ficará em promoção?",
        "7"
      );
      if (diasStr === null) return; // cancelou

      const diasInt = parseInt(diasStr, 10);
      if (!Number.isFinite(diasInt) || diasInt <= 0) {
        alert("Informe um número de dias válido.");
        return;
      }

      const agora = new Date();
      const expiraEm = new Date(
        agora.getTime() + diasInt * 24 * 60 * 60 * 1000
      );
      payload.expiraEm = expiraEm;
    } else {
      payload.expiraEm = null;
    }

    await updateDoc(doc(db, "produtos", produto.id), payload);
    await carregarProdutos();
  };

  // ===== ações de horários
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

  // separa produtos em promoção x demais
  const produtosEmPromocao = produtos.filter((p) => !!p.promocao);
  const produtosRegulares = produtos.filter((p) => !p.promocao);

  // função para renderizar um card de produto (reaproveitada nas duas listas)
  const renderProdutoCard = (p: Produto) => {
    const emEdicao = editProdId === p.id;
    const expiraInputId = `expira-${p.id}`; // ID único pro input de data

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
            {/* Nome */}
            {!emEdicao ? (
              <h5 className="product-card__title">{p.nome}</h5>
            ) : (
              <div className="inline-edit mb-2 text-start">
                <label className="inline-edit__label">Nome</label>
                <input
                  className="form-control inline-edit__input"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do produto"
                />
              </div>
            )}

            {/* Preço */}
            {!emEdicao ? (
              <p className="product-card__price">{toBRL(p.preco)}</p>
            ) : (
              <div className="inline-edit text-start">
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

            {/* Descrição */}
            {!emEdicao ? (
              p.descricao && (
                <p className="text-muted small product-card__desc">
                  {p.descricao}
                </p>
              )
            ) : (
              <div className="inline-edit text-start mt-2">
                <label className="inline-edit__label">Descrição</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  placeholder="Breve descrição..."
                />
              </div>
            )}

            {/* Promoção + validade */}
            <div className="d-flex flex-column align-items-center gap-1 my-2">
              {!emEdicao ? (
                <>
                  {p.promocao ? (
                    <>
                      <span className="badge bg-success-subtle text-success-emphasis">
                        Em promoção
                      </span>
                      {p.expiraEm && (
                        <small className="text-muted">
                          Até {formatDate(p.expiraEm)}
                        </small>
                      )}
                    </>
                  ) : (
                    <span className="badge bg-secondary-subtle text-secondary-emphasis">
                      Preço normal
                    </span>
                  )}
                </>
              ) : (
                <>
                  <label className="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editPromo}
                      onChange={(e) => setEditPromo(e.target.checked)}
                    />
                    <span>Marcar como promoção</span>
                  </label>

                  {editPromo && (
                    <div className="w-100 text-start mt-1">
                      <label
                        htmlFor={expiraInputId}
                        className="inline-edit__label"
                      >
                        Validade da promoção
                      </label>
                      <input
                        id={expiraInputId}
                        type="date"
                        className="form-control inline-edit__input"
                        value={editExpiraEm}
                        onChange={(e) => setEditExpiraEm(e.target.value)}
                        placeholder="Selecione a data"
                        title="Data em que a promoção termina"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Ações */}
            {!emEdicao ? (
              <div className="d-flex flex-column gap-2">
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

                {/* Botão de transferir para / tirar da promoção */}
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => togglePromocaoRapida(p)}
                >
                  {p.promocao ? "Tirar da promoção" : "Colocar em promoção"}
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
  };

  return (
    <div className="adminlist-container min-vh-100 d-flex flex-column">
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1 className="fw-bold text-primary">Painel de Visualização</h1>
          <p className="text-muted mb-0">Gerencie produtos e horários</p>
        </div>
      </header>

      <main className="container py-4 flex-grow-1">
        {/* ================== PRODUTOS EM PROMOÇÃO ================== */}
        <section className="mb-5">
          <h2 className="text-center mb-3">🔥 Produtos em promoção</h2>
          {produtosEmPromocao.length === 0 ? (
            <p className="text-center text-muted">
              Nenhum produto em promoção no momento.
            </p>
          ) : (
            <div className="row g-4">
              {produtosEmPromocao.map(renderProdutoCard)}
            </div>
          )}
        </section>

        {/* ================== DEMAIS PRODUTOS ================== */}
        <section>
          <h2 className="text-center mb-3">🛍️ Demais produtos</h2>
          {produtosRegulares.length === 0 ? (
            <p className="text-center">
              Nenhum produto cadastrado (ou todos estão em promoção).
            </p>
          ) : (
            <div className="row g-4">
              {produtosRegulares.map(renderProdutoCard)}
            </div>
          )}
        </section>

        <hr className="my-5" />

        {/* ================== HORÁRIOS ================== */}
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

                        <div className="d-flex gap-2 mb-2">
                          <input
                            className="form-control"
                            placeholder="HH:mm"
                            value={novoHorario}
                            onChange={(e) => setNovoHorario(e.target.value)}
                            maxLength={5}
                          />
                          <button
                            className="btn btn-outline-primary"
                            onClick={addHorario}
                          >
                            Adicionar
                          </button>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success"
                            onClick={salvarHorarios}
                          >
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
