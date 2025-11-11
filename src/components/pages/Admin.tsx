import { useState } from "react";
import { Link } from "react-router-dom";
import { db, storage } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../../styles/Admin.css";

export default function Admin() {
  // ===================== CADASTRO DE PRODUTOS =====================
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");

  // ===================== PROMO TEMPORÁRIA =====================
  const [pNome, setPNome] = useState("");
  const [pPrecoOriginal, setPPrecoOriginal] = useState("");
  const [pPrecoPromo, setPPrecoPromo] = useState("");
  const [pDescricao, setPDescricao] = useState("");
  const [pCategoria, setPCategoria] = useState("");
  const [pImagem, setPImagem] = useState<File | null>(null);
  const [pDias, setPDias] = useState<number>(10); // recomendado 10–15
  const [pEnviando, setPEnviando] = useState(false);
  const [pMsg, setPMsg] = useState("");

  // ===================== HORÁRIOS - ABAS E ESTADOS =====================
  type Aba = "dia" | "lote";
  const [aba, setAba] = useState<Aba>("dia");

  // Dia único
  const [dataDia, setDataDia] = useState("");
  const [horasDia, setHorasDia] = useState<string[]>([]);
  const [novaHoraDia, setNovaHoraDia] = useState("");

  // Lote
  const [rangeIni, setRangeIni] = useState("");
  const [rangeFim, setRangeFim] = useState("");
  // 0=Dom, 1=Seg, ..., 6=Sáb  (padrão seg–sex)
  const [diasSemana, setDiasSemana] = useState<boolean[]>(
    [false, true, true, true, true, true, false]
  );
  const [janIni, setJanIni] = useState("14:00");
  const [janFim, setJanFim] = useState("18:00");
  const [step, setStep] = useState<number>(30); // minutos
  const [substituir, setSubstituir] = useState(false);

  // ===================== HELPERS =====================
  const formatBRL = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const n = parseFloat(digits || "0") / 100;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const toDateId = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const genSlots = (ini: string, fim: string, stepMin: number) => {
    if (!ini || !fim) return [];
    const [sh, sm] = ini.split(":").map(Number);
    const [eh, em] = fim.split(":").map(Number);
    const out: string[] = [];
    let m = sh * 60 + sm;
    const end = eh * 60 + em;
    while (m <= end) {
      out.push(`${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`);
      m += stepMin;
    }
    return out;
  };

  const iterateDates = (start: Date, end: Date) => {
    const arr: Date[] = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    end = new Date(end);
    end.setHours(0, 0, 0, 0);
    while (cur.getTime() <= end.getTime()) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  };

  // ===================== AÇÕES: PRODUTOS =====================
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagem) return alert("Por favor, selecione uma imagem.");

    setEnviando(true);
    setMensagem("");

    try {
      const imagemRef = ref(storage, `produtos/${Date.now()}-${imagem.name}`);
      const metadata = { contentType: imagem.type };

      const uploadTask = uploadBytesResumable(imagemRef, imagem, metadata);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on("state_changed", null, (error) => reject(error), () => resolve());
      });

      const urlImagem = await getDownloadURL(imagemRef);

      await addDoc(collection(db, "produtos"), {
        nome,
        preco, // string formatada (exibe ok na vitrine)
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

  // ===================== AÇÕES: PROMO TEMPORÁRIA =====================
  const handleUploadPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pImagem) return alert("Selecione uma imagem para a promoção.");
    if (!pPrecoPromo) return alert("Defina o preço promocional.");

    setPEnviando(true);
    setPMsg("");

    try {
      const imgRef = ref(storage, `promocoes/${Date.now()}-${pImagem.name}`);
      const metadata = { contentType: pImagem.type };
      const up = uploadBytesResumable(imgRef, pImagem, metadata);
      await new Promise<void>((resolve, reject) => {
        up.on("state_changed", undefined, reject, () => resolve());
      });
      const url = await getDownloadURL(imgRef);

      const expiraEm = new Date(Date.now() + pDias * 24 * 60 * 60 * 1000);

      await addDoc(collection(db, "promocoes"), {
        nome: pNome,
        descricao: pDescricao,
        categoria: pCategoria,
        imagem: url,
        precoOriginal: pPrecoOriginal || null,
        precoPromocional: pPrecoPromo,
        criadoEm: new Date(),
        expiraEm,
        ativo: true,
      });

      setPNome("");
      setPDescricao("");
      setPCategoria("");
      setPPrecoOriginal("");
      setPPrecoPromo("");
      setPImagem(null);
      setPDias(10);
      setPMsg("✅ Promoção cadastrada!");
    } catch (err) {
      console.error(err);
      setPMsg("❌ Erro ao salvar promoção.");
    } finally {
      setPEnviando(false);
    }
  };

  // ===================== AÇÕES: HORÁRIOS (DIA ÚNICO) =====================
  const addPresetDia = (ini: string, fim: string, stepMin: number) => {
    const slots = genSlots(ini, fim, stepMin);
    setHorasDia((prev) => Array.from(new Set([...prev, ...slots])).sort());
  };

  const adicionarHoraDia = () => {
    if (!novaHoraDia) return;
    setHorasDia((prev) => Array.from(new Set([...prev, novaHoraDia])).sort());
    setNovaHoraDia("");
  };

  const removerHoraDia = (h: string) => {
    setHorasDia((prev) => prev.filter((x) => x !== h));
  };

  const salvarHorariosDia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataDia || horasDia.length === 0)
      return alert("Escolha uma data e adicione pelo menos um horário.");

    const ref = doc(db, "horariosDisponiveis", dataDia);
    const prev = (await getDoc(ref)).data()?.horas || [];
    const merged = Array.from(new Set<string>([...prev, ...horasDia])).sort();

    await setDoc(ref, { horas: merged });
    alert("✅ Horários do dia salvos!");
    setDataDia("");
    setHorasDia([]);
    setNovaHoraDia("");
  };

  // ===================== AÇÕES: HORÁRIOS (LOTE) =====================
  const toggleDiaSemana = (i: number) =>
    setDiasSemana((d) => d.map((v, idx) => (idx === i ? !v : v)));

  const salvarHorariosLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeIni || !rangeFim) return alert("Defina o período.");
    const di = new Date(rangeIni);
    const df = new Date(rangeFim);
    if (di > df) return alert("Período inválido.");

    const dias = iterateDates(di, df).filter((d) => diasSemana[d.getDay()]);
    if (dias.length === 0) return alert("Nenhum dia da semana selecionado.");

    const novos = genSlots(janIni, janFim, step);
    if (novos.length === 0) return alert("Janela/intervalo inválidos.");

    for (const d of dias) {
      const id = toDateId(d);
      const ref = doc(db, "horariosDisponiveis", id);

      if (substituir) {
        await setDoc(ref, { horas: [...novos] });
      } else {
        const snap = await getDoc(ref);
        const base = (snap.data()?.horas as string[]) || [];
        const merged = Array.from(new Set([...base, ...novos])).sort();
        await setDoc(ref, { horas: merged });
      }
    }
    alert(`✅ Gerado para ${dias.length} dia(s).`);
  };

  const totalSlotsPreview = (() => {
    const qtdPorDia = genSlots(janIni, janFim, step).length;
    if (!rangeIni || !rangeFim) return 0;
    const di = new Date(rangeIni);
    const df = new Date(rangeFim);
    const dias = iterateDates(di, df).filter((d) => diasSemana[d.getDay()]);
    return dias.length * qtdPorDia;
  })();

  // ===================== RENDER =====================
  return (
    <div className="admin-container d-flex flex-column min-vh-100">
      {/* HEADER */}
      <header className="admin-header py-4">
        <div className="container">
          <div className="admin-header__bar">
            <div className="admin-header__left">
              <h1 className="admin-title display-5">Painel do Administrador</h1>
              <p className="admin-subtitle mb-0">Gerencie seus produtos e horários</p>
            </div>

            <div className="admin-header__right">
              <Link to="/admin-listar" className="btn btn-ghost">👁️ Visualizar Itens</Link>
              <Link to="/admin/agendamentos" className="btn btn-ghost">📅 Ver Agendamentos</Link>
              <Link to="/promocoes" className="btn btn-ghost">🏷️ Vitrine de Promoções</Link>
            </div>
          </div>
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
                    onChange={(e) => setPreco(formatBRL(e.target.value))}
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

        {/* PROMO TEMPORÁRIA */}
        <section className="admin-section" aria-labelledby="titulo-promo">
          <h2 id="titulo-promo" className="section-title">
            <span className="emoji" role="img" aria-label="Etiqueta">🏷️</span>
            Cadastrar Promoção Temporária
          </h2>

          <div className="card admin-card">
            <div className="card-body">
              <form className="admin-form mx-auto" onSubmit={handleUploadPromo}>
                <div className="mb-3">
                  <label htmlFor="pNome" className="form-label">Nome do Produto</label>
                  <input id="pNome" className="form-control" value={pNome}
                         onChange={(e)=>setPNome(e.target.value)} required />
                </div>

                <div className="row g-3">
                  <div className="col-sm-6">
                    <label htmlFor="pPrecoOriginal" className="form-label">Preço original (opcional)</label>
                    <input id="pPrecoOriginal" className="form-control" inputMode="decimal"
                           value={pPrecoOriginal}
                           onChange={(e)=>setPPrecoOriginal(formatBRL(e.target.value))}
                           placeholder="Ex.: R$ 299,90" />
                  </div>
                  <div className="col-sm-6">
                    <label htmlFor="pPrecoPromo" className="form-label">Preço promocional</label>
                    <input id="pPrecoPromo" className="form-control" inputMode="decimal"
                           value={pPrecoPromo}
                           onChange={(e)=>setPPrecoPromo(formatBRL(e.target.value))}
                           placeholder="Ex.: R$ 199,90" required />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="pDescricao" className="form-label">Descrição</label>
                  <textarea id="pDescricao" className="form-control" rows={3}
                            value={pDescricao} onChange={(e)=>setPDescricao(e.target.value)} required/>
                </div>

                <div className="row g-3">
                  <div className="col-sm-6">
                    <label htmlFor="pCategoria" className="form-label">Categoria</label>
                    <select id="pCategoria" className="form-select"
                            value={pCategoria} onChange={(e)=>setPCategoria(e.target.value)} required>
                      <option value="">Selecione</option>
                      <option value="Camisetas">Camisetas</option>
                      <option value="Vestidos">Vestidos</option>
                      <option value="Calças">Calças</option>
                      <option value="Acessórios">Acessórios</option>
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label htmlFor="pDias" className="form-label">Duração (dias)</label>
                    <input id="pDias" type="number" min={1} max={60} className="form-control"
                           value={pDias} onChange={(e)=>setPDias(Number(e.target.value || 1))} />
                    <div className="form-text">Recomendado: 10 a 15 dias.</div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="pImagem" className="form-label">Imagem</label>
                  <input id="pImagem" type="file" accept="image/*" className="form-control"
                         onChange={(e)=>setPImagem(e.target.files?.[0] || null)} required/>
                </div>

                <button type="submit" className="btn btn-gradient w-100" disabled={pEnviando}>
                  {pEnviando ? <> <span className="spinner-border spinner-border-sm me-2" /> Salvando... </> : "Salvar Promoção"}
                </button>
                {pMsg && <p className="text-center mt-3" aria-live="polite">{pMsg}</p>}
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
              {/* Abas */}
              <div className="d-flex gap-2 mb-3">
                <button
                  type="button"
                  className={`btn ${aba === "dia" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setAba("dia")}
                >
                  Dia único
                </button>
                <button
                  type="button"
                  className={`btn ${aba === "lote" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setAba("lote")}
                >
                  Gerar em lote
                </button>
              </div>

              {aba === "dia" ? (
                // --------- DIA ÚNICO ---------
                <form className="admin-form mx-auto" onSubmit={salvarHorariosDia}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="data-dia">Data</label>
                    <input
                      id="data-dia"
                      type="date"
                      className="form-control"
                      value={dataDia}
                      onChange={(e) => setDataDia(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-2 d-flex flex-wrap gap-2">
                    <span className="form-text">Presets rápidos:</span>
                    <button type="button" className="btn btn-ghost btn-sm"
                            onClick={() => addPresetDia("09:00", "12:00", 30)}>Manhã</button>
                    <button type="button" className="btn btn-ghost btn-sm"
                            onClick={() => addPresetDia("14:00", "18:00", 30)}>Tarde</button>
                    <button type="button" className="btn btn-ghost btn-sm"
                            onClick={() => addPresetDia("09:00", "18:00", 60)}>Hora cheia</button>
                    <button type="button" className="btn btn-outline-danger btn-sm"
                            onClick={() => setHorasDia([])}>Limpar</button>
                  </div>

                  <div className="mb-3 d-flex gap-2 align-items-end">
                    <div className="flex-grow-1">
                      <label className="form-label" htmlFor="nova-hora-dia">Adicionar horário</label>
                      <input
                        id="nova-hora-dia"
                        type="time"
                        className="form-control"
                        value={novaHoraDia}
                        onChange={(e) => setNovaHoraDia(e.target.value)}
                      />
                    </div>
                    <button type="button" className="btn btn-ghost" onClick={adicionarHoraDia}>
                      ➕
                    </button>
                  </div>

                  {horasDia.length > 0 && (
                    <ul className="list-group mb-3 hours-list" aria-label="Horários adicionados">
                      {horasDia.map((h) => (
                        <li key={h} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{h}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removerHoraDia(h)}
                            aria-label={`Remover horário ${h}`}
                          >
                            ✖
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button type="submit" className="btn btn-gradient w-100">
                    Salvar horários do dia
                  </button>
                </form>
              ) : (
                // --------- LOTE ---------
                <form className="admin-form mx-auto" onSubmit={salvarHorariosLote}>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label" htmlFor="range-ini">De</label>
                      <input id="range-ini" type="date" className="form-control"
                             value={rangeIni} onChange={(e) => setRangeIni(e.target.value)} required />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label" htmlFor="range-fim">Até</label>
                      <input id="range-fim" type="date" className="form-control"
                             value={rangeFim} onChange={(e) => setRangeFim(e.target.value)} required />
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="form-label d-block mb-1">Dias da semana</span>
                    <div className="d-flex flex-wrap gap-2">
                      {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d, i) => (
                        <button type="button" key={d}
                          className={`btn btn-sm ${diasSemana[i] ? "btn-primary" : "btn-ghost"}`}
                          onClick={() => toggleDiaSemana(i)}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-sm-4">
                      <label className="form-label" htmlFor="jan-ini">Início</label>
                      <input id="jan-ini" type="time" className="form-control"
                             value={janIni} onChange={(e) => setJanIni(e.target.value)} required />
                    </div>
                    <div className="col-sm-4">
                      <label className="form-label" htmlFor="jan-fim">Fim</label>
                      <input id="jan-fim" type="time" className="form-control"
                             value={janFim} onChange={(e) => setJanFim(e.target.value)} required />
                    </div>
                    <div className="col-sm-4">
                      <label className="form-label" htmlFor="step">Intervalo (min)</label>
                      <input id="step" type="number" min={5} step={5} className="form-control"
                             value={step} onChange={(e) => setStep(Number(e.target.value || 30))} />
                    </div>
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input className="form-check-input" type="checkbox" id="substituir"
                           checked={substituir} onChange={(e) => setSubstituir(e.target.checked)} />
                    <label className="form-check-label" htmlFor="substituir">
                      Substituir horários existentes (em vez de mesclar)
                    </label>
                  </div>

                  <div className="mt-2 text-muted small">
                    Prévia: {totalSlotsPreview} slots serão gerados (antes da mesclagem).
                  </div>

                  <button type="submit" className="btn btn-gradient w-100 mt-2">
                    Gerar horários em lote
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* AÇÕES FINAIS */}
        <div className="text-center mt-4">
          <Link to="/" className="btn btn-ghost mx-2">← Voltar</Link>
        </div>
      </main>

      <footer className="admin-footer text-center py-3 mt-auto">
        <small>© {new Date().getFullYear()} Minha Loja PWA</small>
      </footer>
    </div>
  );
}
