import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    const senhaCorreta = "12345";
    const senhaDigitada = prompt("Digite a senha de administrador:");
    if (senhaDigitada === senhaCorreta) navigate("/admin");
    else if (senhaDigitada !== null) alert("❌ Senha incorreta!");
  };

  return (
    <div className="home-container d-flex flex-column min-vh-100 position-relative">
      {/* Header */}
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1
            className="fw-bold text-primary home-title"
            title="Minha Loja"
          >
            Loja de Roupas
          </h1>
          <p className="text-muted mb-0">
            Aqui você recebe um atendimento personalizado
          </p>
        </div>
      </header>

      {/* Banner / Hero */}
      <section className="banner flex-grow-1 d-flex align-items-center justify-content-center text-center text-light">
        <div className="hero-card container-sm px-4 py-5 rounded-4">
          <h2 className="display-6 fw-bold mb-3">Bem-vinda à nossa loja!</h2>
          <p className="lead mb-4">
            Descubra produtos incríveis e agende seu horário com facilidade.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <Link to="/vitrine" className="btn btn-primary btn-lg px-4">
              Ver Vitrine
            </Link>
            <Link to="/agendar" className="btn btn-outline-light btn-lg px-4">
              Agendar Horário
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer bg-dark text-light text-center py-3 mt-auto position-relative">
        <small>
          © {new Date().getFullYear()} Minha Loja PWA. Todos os direitos
          reservados.
        </small>

        {/* Botão Admin discreto no rodapé (canto direito) */}
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
