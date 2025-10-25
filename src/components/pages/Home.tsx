import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    const senhaCorreta = "12345"; // 🔹 Defina aqui a senha temporária
    const senhaDigitada = prompt("Digite a senha de administrador:");

    if (senhaDigitada === senhaCorreta) {
      navigate("/admin");
    } else if (senhaDigitada !== null) {
      alert("❌ Senha incorreta!");
    }
  };

  return (
    <div className="home-container d-flex flex-column min-vh-100 position-relative">
      {/* Botão discreto do Admin */}
      <button className="admin-button btn btn-sm btn-outline-light" onClick={handleAdminClick}>
        ⚙️ Admin
      </button>

      {/* Header */}
      <header className="bg-light shadow-sm py-3">
        <div className="container text-center">
          <h1 className="fw-bold text-primary">Minha Loja PWA</h1>
          <p className="text-muted mb-0">Moda e estilo na palma da sua mão 💅</p>
        </div>
      </header>

      {/* Banner */}
      <section className="banner flex-grow-1 d-flex align-items-center justify-content-center text-center text-light">
        <div>
          <h2 className="display-6 fw-bold">Bem-vindo(a) à nossa loja!</h2>
          <p className="lead mb-4">Descubra produtos incríveis e agende seu horário com facilidade.</p>

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
      <footer className="bg-dark text-light text-center py-3 mt-auto">
        <small>© {new Date().getFullYear()} Minha Loja PWA. Todos os direitos reservados.</small>
      </footer>
    </div>
  );
}
