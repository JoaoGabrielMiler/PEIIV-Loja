import { useState } from "react";
import { Link } from "react-router-dom";
import { db, storage } from "../../firebaseConfig";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, uploadBytes,getDownloadURL } from "firebase/storage";
import "./Admin.css";

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
      const imagemRef = ref(storage, `produtos/${Date.now()}-${imagem.name}`);

      // ✅ Define o tipo MIME da imagem
      const metadata = {
        contentType: imagem.type, // ex: "image/jpeg" ou "image/png"
      };

      // ✅ Faz o upload com metadata
      const uploadTask = uploadBytesResumable(imagemRef, imagem, metadata);

      // Aguarda o término do upload
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          () => resolve()
        );
      });

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
      console.error("Erro geral:", error);
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
    <div className="admin-container min-vh-100 d-flex flex-column">
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1 className="fw-bold text-primary">Painel do Administrador</h1>
          <p className="text-muted mb-0">Gerencie seus produtos e horários</p>
        </div>
      </header>

      <main className="container py-4 flex-grow-1">
        {/* Cadastro de Produtos */}
        <section className="admin-section mb-5">
          <h2 className="text-center mb-4">🛍️ Cadastro de Produtos</h2>
          <form
            className="admin-form mx-auto p-4 shadow-lg rounded-4 bg-white"
            onSubmit={handleUpload}
          >
            <div className="mb-3">
              <label className="form-label">Nome do Produto</label>
              <input
                type="text"
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Preço</label>
              <input
                type="text"
                className="form-control"
                value={preco}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, "");
                  const numero = parseFloat(valor) / 100;
                  const formatado = numero.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  });
                  setPreco(formatado);
                }}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Descrição</label>
              <textarea
                className="form-control"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Categoria</label>
              <select
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
              <label className="form-label">Imagem do Produto</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={(e) => setImagem(e.target.files?.[0] || null)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Salvar Produto"}
            </button>

            {mensagem && <p className="text-center mt-3">{mensagem}</p>}
          </form>
        </section>

        {/* Horários */}
        <section className="admin-section">
          <h2 className="text-center mb-4">🕒 Definir Horários Disponíveis</h2>
          <form
            className="admin-form mx-auto p-4 shadow-lg rounded-4 bg-white"
            onSubmit={salvarHorarios}
          >
            <div className="mb-3">
              <label className="form-label">Data</label>
              <input
                type="date"
                className="form-control"
                value={dataHorario}
                onChange={(e) => setDataHorario(e.target.value)}
                required
              />
            </div>

            <div className="mb-3 d-flex gap-2">
              <input
                type="time"
                className="form-control"
                value={novaHora}
                onChange={(e) => setNovaHora(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-success"
                onClick={adicionarHora}
              >
                ➕
              </button>
            </div>

            {horas.length > 0 && (
              <ul className="list-group mb-3">
                {horas.map((h) => (
                  <li
                    key={h}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    {h}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removerHora(h)}
                    >
                      ✖
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button type="submit" className="btn btn-primary w-100">
              Salvar Horários
            </button>
          </form>
        </section>

        <div className="text-center mt-4">
          <Link to="/admin-listar" className="btn btn-outline-secondary mx-2">
            👁️ Visualizar Itens
          </Link>
          <Link to="/" className="btn btn-outline-dark mx-2">
            ← Voltar
          </Link>
        </div>
      </main>

      <footer className="bg-dark text-light text-center py-3 mt-auto">
        <small>© {new Date().getFullYear()} Minha Loja PWA</small>
      </footer>
    </div>
  );
}
