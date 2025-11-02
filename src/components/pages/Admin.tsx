import { useState } from "react";
import { Link } from "react-router-dom";
import { db, storage } from "../../firebaseConfig";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../../styles/Admin.css";

export default function Admin() {
  // 🔹 Estados para cadastro de produtos
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");

  // 🔹 Estados para horários disponíveis
  const [dataHorario, setDataHorario] = useState("");
  const [horas, setHoras] = useState<string[]>([]);
  const [novaHora, setNovaHora] = useState("");

  // 📦 Cadastrar Produto
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagem) return alert("Por favor, selecione uma imagem.");

    setEnviando(true);
    setMensagem("");

    try {
      const imagemRef = ref(storage, `produtos/${imagem.name}`);
      await uploadBytes(imagemRef, imagem);
      const urlImagem = await getDownloadURL(imagemRef);

      await addDoc(collection(db, "produtos"), {
        nome,
        preco,
        descricao,
        categoria,
        imagem: urlImagem,
        criadoEm: new Date(),
      });

      setNome("");
      setPreco("");
      setDescricao("");
      setCategoria("");
      setImagem(null);
      setMensagem("✅ Produto cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      setMensagem("❌ Erro ao salvar produto.");
    } finally {
      setEnviando(false);
    }
  };

  // 🕒 Horários disponíveis
  const salvarHorarios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataHorario || horas.length === 0)
      return alert("Escolha uma data e adicione pelo menos um horário.");

    try {
      await setDoc(doc(db, "horariosDisponiveis", dataHorario), { horas });
      alert("✅ Horários salvos com sucesso!");
      setDataHorario("");
      setHoras([]);
    } catch (error) {
      console.error("Erro ao salvar horários:", error);
      alert("❌ Erro ao salvar horários disponíveis.");
    }
  };

  const adicionarHora = () => {
    if (!novaHora) return;
    if (horas.includes(novaHora)) return alert("Horário já adicionado!");
    setHoras([...horas, novaHora].sort());
    setNovaHora("");
  };

  const removerHora = (hora: string) => {
    setHoras(horas.filter((h) => h !== hora));
  };

  return (
    <div className="admin-container d-flex flex-column min-vh-100">
      {/* HEADER */}
      <header className="admin-header py-4">
        <div className="container text-center">
          <h1 className="admin-title display-5">Painel do Administrador</h1>
          <p className="admin-subtitle mb-0">Gerencie seus produtos e horários</p>
        </div>
      </header>

      <main className="container py-4 flex-grow-1">
        {/* CADASTRO DE PRODUTOS */}
        <section className="admin-section" aria-labelledby="titulo-produtos">
          <h2 id="titulo-produtos" className="section-title">
            <span className="emoji" role="img" aria-label="Sacola">🛍️</span>
            Cadastro de Produtos
          </h2>

          <div className="card admin-card">
            <div className="card-body">
              <form className="admin-form mx-auto" onSubmit={handleUpload}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="nomeProduto">Nome do Produto</label>
                  <input
                    id="nomeProduto"
                    type="text"
                    className="form-control"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Vestido Floral"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="precoProduto">Preço</label>
                  <input
                    id="precoProduto"
                    type="text"
                    inputMode="decimal"
                    className="form-control"
                    value={preco}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, "");
                      const numero = parseFloat(valor || "0") / 100;
                      const formatado = numero.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                      setPreco(formatado);
                    }}
                    placeholder="Ex.: R$ 199,90"
                    aria-describedby="precoHelp"
                    required
                  />
                  <div id="precoHelp" className="form-text">
                    Digite apenas números; formatamos automaticamente.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="descricaoProduto">Descrição</label>
                  <textarea
                    id="descricaoProduto"
                    className="form-control"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                    placeholder="Ex.: Tecido leve, ideal para eventos..."
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="categoriaProduto">Categoria</label>
                  <select
                    id="categoriaProduto"
                    className="form-select"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="Camisetas">Camisetas</option>
                    <option value="Vestidos">Vestidos</option>
                    <option value="Calças">Calças</option>
                    <option value="Acessórios">Acessórios</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="imagemProduto">Imagem do Produto</label>
                  <input
                    id="imagemProduto"
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => setImagem(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-gradient w-100" disabled={enviando}>
                  {enviando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Enviando...
                    </>
                  ) : (
                    "Salvar Produto"
                  )}
                </button>

                {mensagem && (
                  <p className="text-center mt-3" aria-live="polite">{mensagem}</p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* HORÁRIOS */}
        <section className="admin-section" aria-labelledby="titulo-horarios">
          <h2 id="titulo-horarios" className="section-title">
            <span className="emoji" role="img" aria-label="Relógio">🕒</span>
            Definir Horários Disponíveis
          </h2>

          <div className="card admin-card">
            <div className="card-body">
              <form className="admin-form mx-auto" onSubmit={salvarHorarios}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="dataHorarios">Data</label>
                  <input
                    id="dataHorarios"
                    type="date"
                    className="form-control"
                    value={dataHorario}
                    onChange={(e) => setDataHorario(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3 d-flex gap-2 align-items-end">
                  <div className="flex-grow-1">
                    <label className="form-label" htmlFor="novaHoraInput">Adicionar horário</label>
                    <input
                      id="novaHoraInput"
                      type="time"
                      className="form-control"
                      value={novaHora}
                      onChange={(e) => setNovaHora(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={adicionarHora}
                    aria-label="Adicionar horário"
                    title="Adicionar horário"
                  >
                    ➕
                  </button>
                </div>

                {horas.length > 0 && (
                  <ul className="list-group mb-3 hours-list" aria-label="Horários adicionados">
                    {horas.map((h) => (
                      <li
                        key={h}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <span>{h}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removerHora(h)}
                          aria-label={`Remover horário ${h}`}
                          title={`Remover horário ${h}`}
                        >
                          ✖
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button type="submit" className="btn btn-gradient w-100">
                  Salvar Horários
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* AÇÕES FINAIS */}
        <div className="text-center mt-4">
          <Link to="/admin-listar" className="btn btn-ghost mx-2">
            👁️ Visualizar Itens
          </Link>
          <Link to="/" className="btn btn-ghost mx-2">
            ← Voltar
          </Link>
        </div>
      </main>

      <footer className="admin-footer text-center py-3 mt-auto">
        <small>© {new Date().getFullYear()} Minha Loja PWA</small>
      </footer>
    </div>
  );
}
