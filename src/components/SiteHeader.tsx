import { Link } from "@tanstack/react-router";
import { sair, useUsuario } from "@/lib/auth";

const link = "rounded-full px-4 py-2 text-lg font-bold hover:bg-muted";
const ativo = { className: "bg-muted underline underline-offset-4" };

export function SiteHeader() {
  const { usuario } = useUsuario();
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
      <Link
        to="/"
        className="font-display text-2xl font-semibold"
        aria-label="Viva+Vitória, página inicial"
      >
        Viva<span className="text-highlight">+</span>Vitória
      </Link>
      <nav aria-label="Menu principal" className="flex flex-wrap items-center gap-1">
        <Link to="/cursos" className={link} activeProps={ativo} data-lia="menu-cursos">
          Cursos
        </Link>
        <Link to="/professor" className={link} activeProps={ativo} data-lia="menu-professor">
          Para professores
        </Link>
        {usuario ? (
          <>
            <span className="px-3 text-lg">
              Olá, <strong>{usuario.nome.split(" ")[0]}</strong>
            </span>
            <button
              type="button"
              onClick={() => void sair()}
              className={`${link} border-2 border-foreground`}
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <Link
              to="/entrar"
              className={`${link} border-2 border-foreground`}
              activeProps={ativo}
              data-lia="menu-entrar"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="ml-1 rounded-full bg-secondary px-6 py-3 font-bold text-secondary-foreground"
              data-lia="menu-cadastro"
            >
              Cadastre-se
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
