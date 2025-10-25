import { Link } from "react-router-dom";
import "./Confirmacao.css";

export default function Confirmacao() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>✅ Agendamento Concluído!</h1>
      <p style={styles.text}>
        Seu horário foi agendado com sucesso. Nossa equipe entrará em contato
        para confirmar os detalhes.
      </p>

      <Link to="/" style={styles.button}>
        Voltar à página inicial
      </Link>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f8f9fa",
    fontFamily: "sans-serif",
    textAlign: "center" as const,
    padding: "2rem",
  },
  title: {
    fontSize: "2rem",
    color: "#28a745",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.1rem",
    color: "#333",
    marginBottom: "2rem",
    maxWidth: "400px",
  },
  button: {
    padding: "1rem 2rem",
    backgroundColor: "#222",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
  },
};
