import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useLia, useLiaPagina } from "@/components/lia/Lia";
import { semAcento, useCursos, useInscricoes, vagasRestantes } from "@/lib/cursos";
import { CartaoCurso } from "@/components/CartaoCurso";
import { useUsuario } from "@/lib/auth";

export const Route = createFileRoute("/cursos/")({
  head: () => ({
    meta: [
      { title: "Cursos — Viva+Vitória" },
      {
        name: "description",
        content:
          "Encontre cursos presenciais para o público 50+ em Vitória - ES e faça a sua inscrição com a ajuda da Lia.",
      },
      { property: "og:title", content: "Cursos — Viva+Vitória" },
      {
        property: "og:description",
        content: "Cursos presenciais para o público 50+ em Vitória - ES.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cursos,
});

function Cursos() {
  const cursos = useCursos();
  const inscricoes = useInscricoes();
  const { usuario } = useUsuario();
  const lia = useLia();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("Todos");

  const categorias = useMemo(
    () => ["Todos", ...Array.from(new Set(cursos.map((c) => String(c.categoria))))],
    [cursos],
  );
  const filtrados = useMemo(() => {
    const q = semAcento(busca);
    return cursos.filter(
      (c) =>
        (categoria === "Todos" || c.categoria === categoria) &&
        (!q ||
          semAcento(
            [c.titulo, c.categoria, c.local, c.descricao, c.professor.nome].join(" "),
          ).includes(q)),
    );
  }, [cursos, busca, categoria]);
  const meus = usuario
    ? cursos.filter((c) => inscricoes.some((i) => i.cursoId === c.id && i.usuarioId === usuario.id))
    : [];

  useLiaPagina({
    nome: "Cursos",
    papel: "aluno",
    saudacao: `Olá! Eu sou a Lia. Aqui estão ${cursos.length} cursos. Posso ajudar você a achar um curso e a se inscrever.`,
    roteiros: [
      {
        id: "achar",
        tarefa: "Achar um curso para mim",
        passos: [
          {
            alvo: "busca",
            fala: "Escreva aqui o que você quer aprender, por exemplo: dança, celular ou cerâmica. Também pode escrever o seu bairro. Depois toque em Próximo.",
          },
          {
            alvo: "categorias",
            fala: "Ou toque num destes botões para ver só um tipo de curso, como Arte ou Tecnologia. Depois toque em Próximo.",
          },
          {
            alvo: "cartao-curso",
            fala: "Cada quadro é um curso. Ele mostra o bairro, o dia, o horário e quantas vagas ainda tem. Depois toque em Próximo.",
          },
          {
            alvo: "abrir-curso",
            fala: "Gostou? Toque em Ver curso e me inscrever para ver as aulas e se inscrever.",
            esperarClique: true,
          },
        ],
      },
    ],
    acoes: [
      {
        id: "ler-lista",
        titulo: "Ler os cursos para mim",
        detalhe: "Leio o nome, o lugar e o dia de cada curso",
        executar: () =>
          lia.falar(
            filtrados.length
              ? `Achei ${filtrados.length} cursos. ` +
                  filtrados.map((c) => `${c.titulo}, em ${c.local}, ${c.diaHorario}.`).join(" ")
              : "Não achei nenhum curso com essa busca. Tente outra palavra.",
          ),
      },
    ],
    contexto: () =>
      cursos
        .map(
          (c) =>
            `${c.titulo} (${c.categoria}) — ${c.local}, ${c.diaHorario}, professor ${c.professor.nome}. ${c.descricao}`,
        )
        .join("\n"),
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-32 pt-6">
        <h1 className="text-5xl font-semibold md:text-6xl">Cursos</h1>
        <p className="mt-4 max-w-3xl text-xl text-muted-foreground">
          Cursos presenciais, perto de casa, com gente da sua geração. Escolha um curso para ver as
          aulas e se inscrever. Se precisar, chame a Lia no canto da tela.
        </p>

        {meus.length > 0 && (
          <section
            className="mt-10 rounded-2xl bg-accent p-7 text-accent-foreground"
            aria-labelledby="minhas"
          >
            <h2 id="minhas" className="text-3xl font-semibold">
              Minhas inscrições
            </h2>
            <ul className="mt-4 space-y-2 text-lg">
              {meus.map((c) => (
                <li key={c.id}>
                  ✓{" "}
                  <Link
                    to="/cursos/$id"
                    params={{ id: c.id }}
                    className="font-bold underline underline-offset-4"
                  >
                    {c.titulo}
                  </Link>{" "}
                  — {c.local}, {c.diaHorario}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10">
          <label className="block text-xl font-bold" htmlFor="busca">
            O que você quer aprender?
          </label>
          <input
            id="busca"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: dança, celular, Jardim da Penha"
            className="mt-2 w-full max-w-2xl rounded-xl border-2 bg-card px-4 py-4 text-xl outline-none focus:border-primary"
            data-lia="busca"
          />
        </div>
        <div
          className="mt-5 flex flex-wrap gap-3"
          role="group"
          aria-label="Tipo de curso"
          data-lia="categorias"
        >
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
              className={`min-h-12 rounded-full border-2 px-5 text-lg font-bold ${categoria === c ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-8 text-lg" role="status">
          {filtrados.length === 1 ? "1 curso encontrado" : `${filtrados.length} cursos encontrados`}
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c, i) => (
            <CartaoCurso
              key={c.id}
              curso={c}
              vagas={vagasRestantes(c, inscricoes)}
              primeiro={i === 0}
            />
          ))}
        </div>
        {!filtrados.length && (
          <p className="mt-6 rounded-2xl border-2 border-dashed p-8 text-xl">
            Não achei nenhum curso com essa busca. Tente outra palavra ou toque em{" "}
            <strong>Todos</strong>.
          </p>
        )}

        <section className="mt-16 rounded-2xl bg-primary p-10 text-primary-foreground">
          <h2 className="text-4xl font-semibold">Quer ensinar o que você sabe?</h2>
          <p className="mt-4 text-lg">
            A Lia ajuda você a montar o curso e o passo a passo de cada aula.
          </p>
          <Link
            to="/professor"
            className="mt-6 inline-block rounded-full bg-background px-8 py-4 text-lg font-bold text-foreground"
          >
            Ir para a área do professor
          </Link>
        </section>
      </main>
    </>
  );
}
