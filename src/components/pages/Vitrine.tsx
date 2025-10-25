import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import "./Vitrine.css";

interface Produto {
  id: string;
  nome: string;
  preco: string;
  imagem: string;
}

export default function Vitrine() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "produtos"));
        const lista: Produto[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Produto[];
        setProdutos(lista);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

  return (
    <div className="vitrine-container min-vh-100 d-flex flex-column">
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1 className="fw-bold text-primary">Vitrine</h1>
          <p className="text-muted mb-0">Confira nossos produtos disponíveis</p>
        </div>
      </header>

      <main className="container py-4 flex-grow-1">
        {loading ? (
          <p className="text-center my-5">Carregando produtos...</p>
        ) : produtos.length === 0 ? (
          <p className="text-center">Nenhum produto cadastrado ainda.</p>
        ) : (
          <div className="row g-4">
            {produtos.map((p) => (
              <div className="col-12 col-sm-6 col-md-4" key={p.id}>
                <div className="card h-100 shadow-sm">
                  <img src={p.imagem} className="card-img-top" alt={p.nome} />
                  <div className="card-body text-center">
                    <h5 className="card-title">{p.nome}</h5>
                    <p className="card-text text-primary fw-bold">{p.preco}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-dark text-light text-center py-3">
        <div className="container">
          <Link to="/agendar" className="btn btn-outline-light mx-2">
            Agendar horário
          </Link>
          <Link to="/" className="btn btn-outline-light mx-2">
            Voltar
          </Link>
        </div>
      </footer>
    </div>
  );
}
