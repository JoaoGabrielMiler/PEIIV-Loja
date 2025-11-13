import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../../styles/Vitrine.css";
import { toggleItem, isInSacola, countSacola } from "../../utils/sacola";

interface Promocao {
  id: string;
  nome: string;
  imagem?: string;
  categoria?: string;
  descricao?: string;
  precoOriginal?: string | null; // BRL
  precoPromocional: string;      // BRL
  expiraEm?: any;                // Firestore Timestamp | Date
}

/* ========= MOCK PARA TESTE (force com /promocoes?mock=1) ========= */
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
            fill='white' font-size='28' font-family='Poppins,Arial'>
        ${texto}
      </text>
    </svg>`
  )}`;

const dias = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const MOCK_PROMOS: Promocao[] = [
  {
    id: "mp1",
    nome: "Vestido Midi Floral",
    categoria: "Vestidos",
    descricao: "Tecido leve com caimento clássico.",
    imagem: makePlaceholder("Vestido", "#dc3545", "#6f42c1"),
    precoOriginal: "R$ 299,90",
    precoPromocional: "R$ 199,90",
    expiraEm: dias(12),
  },
  {
    id: "mp2",
    nome: "Calça Wide Leg",
    categoria: "Calças",
    descricao: "Modelagem ampla e confortável.",
    imagem: makePlaceholder("Calça", "#198754", "#0ea5e9"),
    precoOriginal: "R$ 229,90",
    precoPromocional: "R$ 159,90",
    expiraEm: dias(7),
  },
  {
    id: "mp3",
    nome: "Blusa Renda Festa",
    categoria: "Blusas",
    descricao: "Detalhes em renda para eventos.",
    imagem: makePlaceholder("Blusa de Festa", "#fd7e14", "#ef4444"),
    precoOriginal: "R$ 249,90",
    precoPromocional: "R$ 179,90",
    expiraEm: dias(3),
  },
  {
    id: "mp4",
    nome: "Conjunto Alfaiataria",
    categoria: "Conjuntos",
    descricao: "Blazer e short com corte moderno.",
    imagem: makePlaceholder("Conjunto", "#0ea5e9", "#7c3aed"),
    precoOriginal: "R$ 479,90",
    precoPromocional: "R$ 349,90",
    expiraEm: dias(1),
  },
  {
    id: "mp5",
    nome: "Saia Plissada",
    categoria: "Saias",
    descricao: "Versátil para looks casuais.",
    imagem: makePlaceholder("Saia", "#a855f7", "#06b6d4"),
    precoOriginal: "R$ 199,90",
    precoPromocional: "R$ 149,90",
    expiraEm: dias(10),
  },
  {
    id: "mp6",
    nome: "Macacão Jeans",
    categoria: "Macacões",
    descricao: "Prático e estiloso para o dia a dia.",
    imagem: makePlaceholder("Macacão", "#22c55e", "#4f46e5"),
    precoOriginal: "R$ 269,90",
    precoPromocional: "R$ 199,90",
    expiraEm: dias(5),
  },
  {
    id: "mp7",
    nome: "Blusa Cropped",
    categoria: "Blusas",
    descricao: "Cropped básico com ótimo caimento.",
    imagem: makePlaceholder("Cropped", "#f59e0b", "#ec4899"),
    precoOriginal: null, // sem preço original -> sem % OFF
    precoPromocional: "R$ 89,90",
    expiraEm: dias(15),
  },
  {
    id: "mp8",
    nome: "Semi Joia",
    categoria: "Acessórios",
    descricao: "Peça clássica para presentear.",
    imagem: makePlaceholder("Semi Joia", "#a4f70b", "#300002"),
    precoOriginal: "R$ 159,90",
    precoPromocional: "R$ 119,90",
    expiraEm: dias(8),
  },
];
/* ================================================================ */

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 750'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23dc3545'/><stop offset='100%' stop-color='%236610f2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='28' font-family='Poppins,Arial'>Promo</text></svg>";

const cents = (s?: string | null) => {
  if (!s) return 0;
  const d = s.replace(/\D/g, "");
  return parseInt(d || "0", 10);
};

export default function VitrinePromocoes() {
  const [itens, setItens] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todos");
  const [sacolaQtd, setSacolaQtd] = useState<number>(0);
  const navigate = useNavigate();

  // Admin oculto
  const pressTimer = useRef<number | null>(null);
  const handleAdminClick = () => {
    const senhaCorreta = "12345";
    const senhaDigitada = prompt("Digite a senha de administrador:");
    if (senhaDigitada === senhaCorreta) navigate("/admin");
    else if (senhaDigitada !== null) alert("❌ Senha incorreta!");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a")
        handleAdminClick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setSacolaQtd(countSacola());

    const fetchPromos = async () => {
      try {
        const usarMock =
          new URLSearchParams(window.location.search).get("mock") === "1";
        if (usarMock) {
          setItens(MOCK_PROMOS);
          return;
        }

        const agora = new Date();
        const q = query(
          collection(db, "promocoes"),
          where("ativo", "==", true),
          where("expiraEm", ">=", agora)
        );
        const snap = await getDocs(q);
        const lista = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Promocao[];

        if (lista.length === 0) {
          setItens(MOCK_PROMOS);
        } else {
          setItens(lista);
        }
      } catch (e) {
        console.error("Erro ao buscar promoções, usando mock:", e);
        setItens(MOCK_PROMOS);
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, []);

  const categoriasDinamicas = useMemo(() => {
    const s = new Set<string>();
    itens.forEach((p) => p.categoria && s.add(p.categoria));
    return ["Todos", ...Array.from(s)];
  }, [itens]);

  const filtrados = useMemo(
    () =>
      itens.filter((p) =>
        categoriaAtiva === "Todos" ? true : p.categoria === categoriaAtiva
      ),
    [itens, categoriaAtiva]
  );

  const diasRestantes = (exp?: any) => {
    const d: Date | null =
      !exp ? null : exp.toDate ? exp.toDate() : exp instanceof Date ? exp : null;
    if (!d) return null;
    const ms = d.getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="vitrine-container min-vh-100 d-flex flex-column">
      {/* HEADER */}
      <header className="bg-light shadow-sm py-3">
        <div className="container position-relative text-center">
          <h1
            className="fw-bold text-danger page-title"
            onDoubleClick={handleAdminClick}
            onMouseDown={() => {
              clearTimeout(pressTimer.current!);
              pressTimer.current = window.setTimeout(
                () => handleAdminClick(),
                900
              );
            }}
            onMouseUp={() => clearTimeout(pressTimer.current!)}
            onTouchStart={() => {
              clearTimeout(pressTimer.current!);
              pressTimer.current = window.setTimeout(
                () => handleAdminClick(),
                900
              );
            }}
            onTouchEnd={() => clearTimeout(pressTimer.current!)}
            title="Duplo clique ou segure para admin"
          >
            Promoções
          </h1>

          <p className="text-muted mb-0">Ofertas por tempo limitado</p>

          <div className="mt-2">
            <Link
              to="/"
              className="btn btn-outline-secondary btn-sm"
            >
              ← Vitrine completa
            </Link>
          </div>

          {/* CTA – à direita no desktop, embaixo no mobile */}
          <Link
            to="/agendar"
            className="btn btn-primary btn-sm header-cta vitrine-cta-mobile"
            aria-label={`Agendar e levar peças (${sacolaQtd})`}
            title="Agendar e levar peças"
          >
            Agendar e levar peças ({sacolaQtd})
          </Link>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="banner flex-grow-1">
        <div className="container-xxl py-5">
          <div className="hero-card p-3 p-sm-4 rounded-4">
            <fieldset className="chip-fieldset">
              <legend className="visually-hidden">Filtrar por categoria</legend>
              <div className="chip-bar" role="group" aria-label="Categorias">
                {categoriasDinamicas.map((cat) => {
                  const id = `chip-${cat.toLowerCase().replace(/\s+/g, "-")}`;
                  const ativo = cat === categoriaAtiva;
                  return (
                    <span key={cat} className="chip-item">
                      <input
                        id={id}
                        type="radio"
                        name="filtro-categoria"
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

            {loading ? (
              <div className="row g-4 mt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    className="col-12 col-sm-6 col-md-6 col-xl-4"
                    key={i}
                  >
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
                <p className="mb-3">Nenhuma promoção ativa no momento.</p>
                <div className="d-flex justify-content-center gap-2">
                  <Link to="/" className="btn btn-outline-light">
                    ← Vitrine completa
                  </Link>
                  <Link to="/agendar" className="btn btn-primary">
                    Agendar horário
                  </Link>
                </div>
              </div>
            ) : (
              <div className="row g-4 mt-2">
                {filtrados.map((p) => {
                  const reservado = isInSacola(p.id);
                  const dRest = diasRestantes(p.expiraEm);
                  const o = cents(p.precoOriginal);
                  const d = cents(p.precoPromocional);
                  const off =
                    o > 0 && d > 0
                      ? Math.max(0, Math.round((1 - d / o) * 100))
                      : null;

                  return (
                    <div
                      className="col-12 col-sm-6 col-md-6 col-xl-4"
                      key={p.id}
                    >
                      <div className="card product-card h-100 shadow-sm position-relative">
                        <span className="promo-badge">Promo</span>
                        {off !== null && (
                          <span className="promo-off">{off}% OFF</span>
                        )}

                        <div className="product-img">
                          <img
                            src={p.imagem || PLACEHOLDER}
                            alt={p.nome}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                PLACEHOLDER;
                            }}
                          />
                        </div>

                        <div className="card-body text-center">
                          <h5 className="card-title mb-1">{p.nome}</h5>
                          {p.categoria && (
                            <p className="card-subtitle text-light-emphasis small">
                              {p.categoria}
                            </p>
                          )}

                          <div className="price-line my-2">
                            {p.precoOriginal && (
                              <del className="me-2">{p.precoOriginal}</del>
                            )}
                            <strong>{p.precoPromocional}</strong>
                          </div>

                          {dRest !== null && (
                            <div className="text-danger small mb-1">
                              {dRest === 0
                                ? "⚠️ Último dia!"
                                : `⏳ Faltam ${dRest} dia(s)`}
                            </div>
                          )}

                          {(() => {
                            const cbId = `res-${p.id}`;
                            return (
                              <>
                                <input
                                  id={cbId}
                                  type="checkbox"
                                  className="reserve-input"
                                  checked={reservado}
                                  onChange={() => {
                                    toggleItem({
                                      produtoId: p.id,
                                      nome: p.nome,
                                      imagem: p.imagem,
                                      categoria: p.categoria,
                                    });
                                    setSacolaQtd(countSacola());
                                  }}
                                />
                                <label
                                  htmlFor={cbId}
                                  className={`reserve-label btn ${
                                    reservado
                                      ? "btn-success"
                                      : "btn-outline-primary"
                                  } btn-sm mt-2`}
                                  title={
                                    reservado
                                      ? "Remover da sacola de prova"
                                      : "Reservar para provar"
                                  }
                                >
                                  {reservado
                                    ? "Reservado ✓"
                                    : "Reservar para provar"}
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

      {/* FOOTER */}
      <footer className="app-footer bg-dark text-light text-center py-3 mt-auto position-relative">
        <div className="container">
          <Link to="/agendar" className="btn btn-outline-light mx-2">
            Agendar horário ({sacolaQtd})
          </Link>
          <Link to="/" className="btn btn-outline-light mx-2">
            Vitrine completa
          </Link>
        </div>
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
