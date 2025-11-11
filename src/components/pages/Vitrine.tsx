import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import "../../styles/Vitrine.css";

import { toggleItem, isInSacola, countSacola } from "../../utils/sacola";

interface Produto {
  id: string;
  nome: string;
  imagem?: string;
  categoria?: string;
  preco?: number | string;     // ← agora mostramos o preço
  promocao?: boolean;          // ← e a flag de promoção
}

/* ===== MOCKS PARA TESTE (REMOVA DEPOIS) ===== */
const makePlaceholder = (texto: string, c1: string, c2: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 750'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${c1}'/>
          <stop offset='100%' stop-color='${c2}'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' rx='24' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='white' font-size='28' font-family='Poppins,Arial' >
        ${texto}
      </text>
    </svg>`
  )}`;

const MOCK_PRODUTOS: Produto[] = [
  { id: "m1", nome: "Vestido Midi Floral",  categoria: "Vestido",       imagem: makePlaceholder("Vestido", "#0ea5e9", "#6610f2"), preco: 199.9 },
  { id: "m2", nome: "Blusa Renda Festa",    categoria: "Blusa de festa",imagem: makePlaceholder("Blusa de festa", "#4f46e5", "#14b8a6"), preco: 149.9 },
  { id: "m3", nome: "Conjunto Alfaiataria", categoria: "Conjunto",      imagem: makePlaceholder("Conjunto", "#f97316", "#ef4444"), preco: 259.9 },
  { id: "m4", nome: "Calça Wide Leg",       categoria: "Calça",         imagem: makePlaceholder("Calça", "#10b981", "#0ea5e9"), preco: 179.9 },
  { id: "m5", nome: "Saia Plissada",        categoria: "Saia",          imagem: makePlaceholder("Saia", "#a855f7", "#06b6d4"), preco: 129.9 },
  { id: "m6", nome: "Macacão Jeans",        categoria: "Macacão",       imagem: makePlaceholder("Macacão", "#22c55e", "#4f46e5"), preco: 219.9 },
  { id: "m7", nome: "Vestido Longo Liso",   categoria: "Vestido",       imagem: makePlaceholder("Vestido", "#0ea5e9", "#7c3aed"), preco: 299.0, promocao: true },
  { id: "m8", nome: "Blusa Cropped",        categoria: "Blusa",         imagem: makePlaceholder("Blusa", "#f59e0b", "#ec4899"), preco: 89.9 },
  { id: "m9", nome: "Conjunto Moletom",     categoria: "Conjunto",      imagem: makePlaceholder("Conjunto", "#06b6d4", "#4f46e5"), preco: 239.9 },
  { id: "m10", nome: "Semi Joia",           categoria: "Acessórios",    imagem: makePlaceholder("Semi Joia", "#a4f70bff", "#300002ff"), preco: 79.9 },
];
/* ======================================================= */

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 750'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230ea5e9'/><stop offset='100%' stop-color='%236610f2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='28' font-family='Poppins,Arial'>Sem imagem</text></svg>";

const formatBRL = (v?: number | string) => {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number")
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const n = Number(v.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n)
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : v;
};

export default function Vitrine() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todos");
  const [sacolaQtd, setSacolaQtd] = useState<number>(0);
  const navigate = useNavigate();

  // ---- Admin escondido
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
  // ----

  useEffect(() => {
    setSacolaQtd(countSacola());

    const usarMock = new URLSearchParams(window.location.search).get("mock") === "1";
    if (usarMock) {
      setProdutos(MOCK_PRODUTOS);
      setLoading(false);
      return;
    }

    // 📡 Tempo real: se o preço for alterado no Admin, a vitrine atualiza sozinha
    const q = query(collection(db, "produtos"), orderBy("nome"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Produto[];
        // se não houver docs, mantemos vazio (ou use MOCK_PRODUTOS se preferir)
        setProdutos(lista.length ? lista : []);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao escutar produtos:", err);
        setProdutos(MOCK_PRODUTOS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // CATEGORIAS FIXAS
  const CATEGORIAS_FIXAS = [
    "Todos",
    "Vestido",
    "Blusa",
    "Blusa de festa",
    "Conjunto",
    "Calça",
    "Saia",
    "Macacão",
  ];

  const categoriasDinamicas = useMemo(() => {
    const s = new Set<string>();
    produtos.forEach((p) => p.categoria && s.add(p.categoria));
    return Array.from(s);
  }, [produtos]);

  const categorias = useMemo(() => {
    const set = new Set<string>(CATEGORIAS_FIXAS);
    categoriasDinamicas.forEach((c) => set.add(c));
    return Array.from(set);
  }, [CATEGORIAS_FIXAS, categoriasDinamicas]);

  const filtrados = useMemo(
    () => produtos.filter((p) => (categoriaAtiva === "Todos" ? true : p.categoria === categoriaAtiva)),
    [produtos, categoriaAtiva]
  );

  // Toggle na sacola
  const handleToggleReserva = (p: Produto) => {
    toggleItem({
      produtoId: p.id,
      nome: p.nome,
      imagem: p.imagem,
      categoria: p.categoria,
    });
    setSacolaQtd(countSacola());
  };

  return (
    <div className="vitrine-container min-vh-100 d-flex flex-column">
      <header className="bg-light shadow-sm py-3">
        <div className="container position-relative text-center">
          <Link
            to="/agendar"
            className="btn btn-primary btn-sm header-cta"
            aria-label={`Agendar e levar peças (${sacolaQtd})`}
            title="Agendar e levar peças"
          >
            Agendar e levar peças ({sacolaQtd})
          </Link>

          <h1
            className="fw-bold text-primary page-title"
            onDoubleClick={handleAdminClick}
            onMouseDown={() => {
              clearTimeout(pressTimer.current!);
              pressTimer.current = window.setTimeout(() => handleAdminClick(), 900);
            }}
            onMouseUp={() => clearTimeout(pressTimer.current!)}
            onTouchStart={() => {
              clearTimeout(pressTimer.current!);
              pressTimer.current = window.setTimeout(() => handleAdminClick(), 900);
            }}
            onTouchEnd={() => clearTimeout(pressTimer.current!)}
            title="Duplo clique ou segure para admin"
          >
            Vitrine
          </h1>
          <p className="text-muted mb-0">Confira nossos produtos disponíveis</p>

          <div className="mt-2">
            <Link to="/promocoes" className="btn btn-outline-primary btn-sm">
              Ver promoções
            </Link>
          </div>
        </div>
      </header>

      {/* Área central */}
      <section className="banner flex-grow-1">
        <div className="container-xxl py-5">
          <div className="hero-card p-3 p-sm-4 rounded-4">
            {/* Barra seletora (chips) */}
            <fieldset className="chip-fieldset">
              <legend className="visualmente-hidden">Filtrar por estilo</legend>
              <div className="chip-bar" role="group" aria-label="Opções de estilo">
                {categorias.map((cat) => {
                  const id = `chip-${cat.toLowerCase().replace(/\s+/g, "-")}`;
                  const ativo = cat === categoriaAtiva;
                  return (
                    <span key={cat} className="chip-item">
                      <input
                        id={id}
                        type="radio"
                        name="filtro-estilo"
                        className="chip-input"
                        checked={ativo}
                        onChange={() => setCategoriaAtiva(cat)}
                      />
                      <label htmlFor={id} className="filter-chip">
                        {cat}
                      </label>
                    </span>
                  );
                })}
              </div>
            </fieldset>

            {/* Grid */}
            {loading ? (
              <div className="row g-4 mt-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div className="col-12 col-sm-6 col-md-6 col-xl-4" key={i}>
                    <div className="card product-card h-100 shadow-sm">
                      <div className="product-img skeleton" />
                      <div className="card-body text-center">
                        <div className="skeleton skeleton-text mb-2" />
                        <div className="skeleton skeleton-text w-50 mx-auto" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="text-center py-5">
                <p className="mb-3">Nenhum produto encontrado.</p>
                <div className="d-flex justify-content-center gap-2">
                  <Link to="/" className="btn btn-outline-light">← Voltar</Link>
                  <Link to="/agendar" className="btn btn-primary">Agendar horário</Link>
                </div>
              </div>
            ) : (
              <div className="row g-4 mt-2">
                {filtrados.map((p) => {
                  const reservado = isInSacola(p.id);
                  return (
                    <div className="col-12 col-sm-6 col-md-6 col-xl-4" key={p.id}>
                      <div className="card product-card h-100 shadow-sm">
                        <div className="product-img">
                          <img
                            src={p.imagem || PLACEHOLDER}
                            alt={p.nome}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                            }}
                          />
                        </div>
                        <div className="card-body text-center">
                          <h5 className="card-title mb-1">{p.nome}</h5>
                          <p className="card-subtitle text-light-emphasis small">
                            {p.categoria || " "}
                          </p>

                          {/* Preço + Promoção */}
                          <div className="d-flex justify-content-center align-items-center gap-2 mt-1">
                            <span className="fw-bold text-primary">
                              {formatBRL(p.preco)}
                            </span>
                            {p.promocao && (
                              <span className="badge bg-success-subtle text-success-emphasis">
                                Promoção
                              </span>
                            )}
                          </div>

                          {/* Reservar */}
                          {(() => {
                            const cbId = `res-${p.id}`;
                            return (
                              <>
                                <input
                                  id={cbId}
                                  type="checkbox"
                                  className="reserve-input"
                                  checked={reservado}
                                  onChange={() => handleToggleReserva(p)}
                                />
                                <label
                                  htmlFor={cbId}
                                  className={`reserve-label btn ${reservado ? "btn-success" : "btn-outline-primary"} btn-sm mt-2`}
                                  title={reservado ? "Remover da sacola de prova" : "Reservar para provar"}
                                >
                                  {reservado ? "Reservado ✓" : "Reservar para provar"}
                                </label>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer bg-dark text-light text-center py-3 mt-auto position-relative">
        <div className="container">
          <Link to="/agendar" className="btn btn-outline-light mx-2">
            Agendar horário ({sacolaQtd})
          </Link>
          <Link to="/" className="btn btn-outline-light mx-2">Voltar</Link>
        </div>
        <button className="admin-foot-gear" onClick={handleAdminClick} aria-label="Admin" title="Admin">⚙️</button>
      </footer>
    </div>
  );
}
