import { Link } from "@tanstack/react-router";
import type { Curso } from "@/lib/cursos";

export function CartaoCurso({
  curso,
  vagas,
  primeiro = false,
}: {
  curso: Curso;
  vagas: number;
  primeiro?: boolean;
}) {
  return (
    <article
      className="flex flex-col rounded-2xl border bg-card p-7"
      data-lia={primeiro ? "cartao-curso" : undefined}
    >
      <span className="self-start rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
        {curso.categoria}
      </span>
      <span className="mt-2 self-start text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Presencial · material da Prefeitura
      </span>
      <h3 className="mt-4 text-2xl font-semibold">{curso.titulo}</h3>
      <p className="mt-3 text-lg text-muted-foreground">
        📍 {curso.local}
        <br />
        🗓️ {curso.diaHorario}
        <br />
        👤 Com {curso.professor.nome}
      </p>
      <p className={`mt-3 font-bold ${vagas ? "" : "text-highlight"}`}>
        {vagas ? `${vagas} vagas livres` : "Turma cheia"}
      </p>
      <Link
        to="/cursos/$id"
        params={{ id: curso.id }}
        className="mt-auto block w-full rounded-full bg-primary py-3 text-center text-lg font-bold text-primary-foreground"
        style={{ marginTop: "1.5rem" }}
        data-lia={primeiro ? "abrir-curso" : undefined}
      >
        Ver curso e me inscrever
      </Link>
    </article>
  );
}
