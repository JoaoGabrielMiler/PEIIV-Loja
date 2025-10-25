import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import "./AdminListar.css";

export default function AdminListar() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);

  const carregarProdutos = async () => {
    const snap = await getDocs(collection(db, "produtos"));
    const lista: any[] = [];
    snap.forEach((docu) => lista.push({ id: docu.id, ...docu.data() }));
    setProdutos(lista);
  };

  const carregarHorarios = async () => {
    const snap = await getDocs(collection(db, "horariosDisponiveis"));
    const lista: any[] = [];
    snap.forEach((docu) => lista.push({ id: docu.id, ...docu.data() }));
    setHorarios(lista);
  };

  const removerProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;
    await deleteDoc(doc(db, "produtos", id));
    alert("Produto removido com sucesso!");
    carregarProdutos();
  };

  const removerHorario = async (id: string) => {
    if (!confirm("Remover horários do dia " + id + "?")) return;
    await deleteDoc(doc(db, "horariosDisponiveis", id));
    alert("Horários removidos com sucesso!");
    carregarHorarios();
  };

  useEffect(() => {
    carregarProdutos();
    carregarHorarios();
  }, []);

  return (
    <div className="adminlist-container min-vh-100 d-flex flex-column">
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1 className="fw-bold text-primary">Painel de Visualização</h1>
          <p className="text-muted mb-0">Gerencie produtos e horários</p>
        </div>
      </header>

      <main className="container py-4 flex-grow-1">
        <section>
          <h2 className="text-center mb-3">🛍️ Produtos Cadastrados</h2>
          <div className="row g-4">
            {produtos.length === 0 ? (
              <p className="text-center">Nenhum produto cadastrado.</p>
            ) : (
              produtos.map((p) => (
                <div className="col-12 col-sm-6 col-md-4" key={p.id}>
                  <div className="card h-100 shadow-sm">
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="card-img-top"
                      style={{ height: "180px", objectFit: "cover" }}
                    />
                    <div className="card-body text-center">
                      <h5>{p.nome}</h5>
                      <p className="text-primary fw-bold">{p.preco}</p>
                      <p className="text-muted small">{p.descricao}</p>
                      <button
                        className="btn btn-sm btn-danger mt-2"
                        onClick={() => removerProduto(p.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <hr className="my-5" />

        <section>
          <h2 className="text-center mb-3">🕒 Horários Disponíveis</h2>
          {horarios.length === 0 ? (
            <p className="text-center">Nenhum horário cadastrado.</p>
          ) : (
            <ul className="list-group">
              {horarios.map((h) => (
                <li
                  key={h.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{h.id}</strong> — {h.horas.join(", ")}
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removerHorario(h.id)}
                  >
                    ✖
                  </button>
                </li>
              ))}
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
