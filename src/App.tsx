import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home";
import Vitrine from "./components/pages/Vitrine";
import Agendar from "./components/pages/Agendar";
import Confirmacao from "./components/pages/Confirmacao";
import Admin from "./components/pages/Admin";
import AdminListar from "./components/pages/AdminListar";



export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {}
        <Route path="/vitrine" element={<Vitrine />} /> {}
        <Route path="/agendar" element={<Agendar />} />
        {}
        <Route path="/confirmacao" element={<Confirmacao />} /> {}
        <Route path="/admin" element={<Admin />} /> {}
        <Route path="/admin-listar" element={<AdminListar />} /> {}
      </Routes>
    </Router>
  );
}
