import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import "../../styles/AdminListar.css";

type Produto = { id: string; nome: string; preco: string; descricao: string; imagem?: string };
type Horario = { id: string; horas: string[] };

export default function AdminListar() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);

  const carregarProdutos = async () => {
    const snap = await getDocs(collection(db, "produtos"));
    const lista: Produto[] = [];
    snap.forEach((docu) => lista.push({ id: docu.id, ...(docu.data() as any) }));
    setProdutos(lista);
  };

  const carregarHorarios = async () => {
    const snap = await getDocs(collection(db, "horariosDisponiveis"));
    const lista: Horario[] = [];
    snap.forEach((docu) => lista.push({ id: docu.id, ...(docu.data() as any) }));
    setHorarios(lista);
  };

  const removerProduto = async (id: string, nome?: string) => {
    if (!confirm(`Tem certeza que deseja remover o produto "${nome ?? ""}"?`)) return;
    await deleteDoc(doc(db, "produtos", id));
    alert("Produto removido com sucesso!");
    carregarProdutos();
  };

  const removerHorario = async (id: string) => {
    if (!confirm(`Remover todos os horários do dia ${id}?`)) return;
    await deleteDoc(doc(db, "horariosDisponiveis", id));
    alert("Horários removidos com sucesso!");
    carregarHorarios();
  };

  useEffect(() => {
    carregarProdutos();
    carregarHorarios();
  }, []);

  return (
    <div className="adminlist-container d-flex flex-column min-vh-100">
      {/* HEADER */}
      <header className="adminlist-header py-4">
        <div className="container text-center">
          <h1 className="adminlist-title display-5">Painel de Visualização</h1>
          <p className="adminlist-subtitle mb-0">Gerencie produtos e horários</p>
        </div>
      </header>

      <main className="container py-4 flex-grow-1">
        {/* PRODUTOS */}
        <section className="adminlist-section" aria-labelledby="titulo-produtos">
          <h2 id="titulo-produtos" className="section-title">
            <span className="emoji" role="img" aria-label="Sacola">🛍️</span>
            Produtos Cadastrados
          </h2>

          {produtos.length === 0 ? (
            <p className="text-center text-muted">Nenhum produto cadastrado.</p>
          ) : (
            <div className="row g-4">
              {produtos.map((p) => (
                <div className="col-12 col-sm-6 col-md-4" key={p.id}>
                  <div className="card product-card h-100 shadow-sm">
                    {p.imagem && (
                      <img
                        src={p.imagem}
                        alt={p.nome}
                        className="product-card__img card-img-top"
                      />
                    )}
                    <div className="card-body text-center">
                      <h5 className="product-card__title">{p.nome}</h5>
                      <p className="product-card__price">{p.preco}</p>
                      <p className="product-card__desc text-muted">{p.descricao}</p>

                      <button
                        className="btn btn-sm btn-outline-danger mt-2"
                        onClick={() => removerProduto(p.id, p.nome)}
                        aria-label={`Remover produto ${p.nome}`}
                        title="Remover produto"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <hr className="section-divider my-5" />

        {/* HORÁRIOS */}
        <section className="adminlist-section" aria-labelledby="titulo-horarios">
          <h2 id="titulo-horarios" className="section-title">
            <span className="emoji" role="img" aria-label="Relógio">🕒</span>
            Horários Disponíveis
          </h2>

          {horarios.length === 0 ? (
            <p className="text-center text-muted">Nenhum horário cadastrado.</p>
          ) : (
            <div className="card admin-card">
              <ul className="list-group list-group-flush hours-list" aria-label="Horários por data">
                {horarios.map((h) => (
                  <li
                    key={h.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div className="hours-list__row">
                      <strong className="hours-list__date">{h.id}</strong>
                      <span className="hours-list__slots">— {h.horas.join(", ")}</span>
                    </div>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removerHorario(h.id)}
                      aria-label={`Remover horários do dia ${h.id}`}
                      title={`Remover horários do dia ${h.id}`}
                    >
                      ✖
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* AÇÕES FINAIS */}
        <div className="text-center mt-4">
          <Link to="/admin" className="btn btn-ghost mx-2">← Voltar ao Painel</Link>
          <Link to="/" className="btn btn-ghost mx-2">Início</Link>
        </div>
      </main>

      <footer className="adminlist-footer text-center py-3 mt-auto">
        <small>© {new Date().getFullYear()} Minha Loja PWA</small>
      </footer>
    </div>
  );
}
