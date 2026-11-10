import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useLia, useLiaPagina, type RoteiroLia } from "@/components/lia/Lia";
import {
  cancelarInscricao,
  inscrever,
  useCursos,
  useInscricoes,
  vagasRestantes,
} from "@/lib/cursos";
import { useUsuario } from "@/lib/auth";

export const Route = createFileRoute("/cursos/$id")({
  head: () => ({
    meta: [
      { title: "Curso — Viva+Vitória" },
      {
        name: "description",
        content:
          "Veja o lugar, o dia e o horário do curso e faça a sua inscrição, com a ajuda da Lia.",
      },
      { property: "og:title", content: "Curso — Viva+Vitória" },
      { property: "og:description", content: "Informações e inscrição no curso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaCurso,
});

function PaginaCurso() {
  const { id } = Route.useParams();
  const cursos = useCursos();
  const inscricoes = useInscricoes();
  const { usuario, carregando } = useUsuario();
  const lia = useLia();
  const [mensagem, setMensagem] = useState("");
  const curso = cursos.find((c) => c.id === id);
  const inscrito = !!(
    curso &&
    usuario &&
    inscricoes.some((i) => i.cursoId === curso.id && i.usuarioId === usuario.id)
  );
  const vagas = curso ? vagasRestantes(curso, inscricoes) : 0;

  const roteiroInscricao: RoteiroLia = {
    id: "inscrever",
    tarefa: "Me inscrever neste curso",
    passos: usuario
      ? [
          {
            alvo: "info-curso",
            fala: "Antes de se inscrever, confira o lugar, o dia e o horário do curso. Depois toque em Próximo.",
          },
          {
            alvo: "botao-inscrever",
            fala: "Se estiver tudo certo, toque no botão azul Quero me inscrever.",
            esperarClique: true,
          },
          {
            alvo: "inscricao-ok",
            fala: "Pronto! Você está inscrito. O professor vai falar com você pelo telefone do cadastro.",
          },
        ]
      : [
          {
            alvo: "info-curso",
            fala: "Primeiro, confira o lugar, o dia e o horário do curso. Depois toque em Próximo.",
          },
          {
            alvo: "precisa-conta",
            fala: "Para se inscrever, você precisa entrar na sua conta. Se ainda não tem, faça o cadastro. Toque em Entrar para continuar.",
            esperarClique: true,
          },
        ],
  };

  useLiaPagina({
    nome: curso ? `Curso ${curso.titulo}` : "Curso",
    papel: "aluno",
    saudacao: curso
      ? `Olá! Este é o curso ${curso.titulo}, com ${curso.professor.nome}, em ${curso.local}, ${curso.diaHorario}. Quer que eu ajude você a se inscrever?`
      : undefined,
    roteiros: curso ? [roteiroInscricao] : [],
    acoes: curso
      ? [
          {
            id: "ler-info",
            titulo: "Ler as informações do curso",
            detalhe: "Lugar, dia, horário e o que levar",
            executar: () => lia.falar(resumoCurso()),
          },
        ]
      : [],
    contexto: () => (curso ? [resumoCurso(), curso.descricao].join("\n") : ""),
  });

  function resumoCurso() {
    if (!curso) return "";
    return `${curso.titulo}. Com ${curso.professor.nome}. Lugar: ${curso.local}${curso.endereco ? ", " + curso.endereco : ""}. Quando: ${curso.diaHorario}. As aulas são presenciais e cada uma dura ${curso.duracaoMin} minutos. O material é fornecido pela Prefeitura. ${vagas ? `Ainda tem ${vagas} vagas.` : "A turma está cheia."} ${curso.oQueLevar.length ? "Leve de casa: " + curso.oQueLevar.join(", ") + "." : ""}`;
  }

  if (!curso)
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-5xl font-semibold">Não achei este curso</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Ele pode ter sido retirado pelo professor.
          </p>
          <Link
            to="/cursos"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground"
          >
            Ver todos os cursos
          </Link>
        </main>
      </>
    );

  function aoInscrever() {
    if (!usuario || !curso) return;
    const r = inscrever(curso.id, usuario.id, usuario.nome);
    const texto =
      r === "ok"
        ? `Pronto, ${usuario.nome.split(" ")[0]}! Você está inscrito em ${curso.titulo}. A primeira aula é ${curso.diaHorario}, em ${curso.local}.`
        : r === "ja"
          ? "Você já está inscrito neste curso."
          : "Que pena, a turma está cheia. Veja outros cursos parecidos.";
    setMensagem(texto);
    lia.falar(texto, r === "lotado" ? "alerta" : "");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-32 pt-6">
        <Link
          to="/cursos"
          className="inline-flex items-center gap-2 rounded-full border-2 border-foreground px-5 py-2 text-lg font-bold"
        >
          ← Todos os cursos
        </Link>
        <p className="mt-8 flex flex-wrap gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            {curso.categoria}
          </span>
          <span className="rounded-full border-2 border-foreground px-3 py-0.5 text-sm font-bold">
            Aula presencial
          </span>
        </p>
        <h1 className="mt-4 text-5xl font-semibold md:text-6xl">{curso.titulo}</h1>
        <p className="mt-6 max-w-3xl text-xl">{curso.descricao}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <dl
            className="grid gap-4 rounded-2xl bg-secondary p-7 text-lg text-secondary-foreground sm:grid-cols-2"
            data-lia="info-curso"
          >
            <div>
              <dt className="font-bold">📍 Onde</dt>
              <dd>
                {curso.local}
                {curso.endereco ? (
                  <>
                    <br />
                    {curso.endereco}
                  </>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="font-bold">🗓️ Quando</dt>
              <dd>{curso.diaHorario}</dd>
            </div>
            <div>
              <dt className="font-bold">⏱️ Duração de cada aula</dt>
              <dd>{curso.duracaoMin} minutos</dd>
            </div>
            <div>
              <dt className="font-bold">👤 Professor</dt>
              <dd>{curso.professor.nome}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-bold">📦 Material das aulas</dt>
              <dd>Fornecido pela Prefeitura de Vitória. Você não paga nada.</dd>
            </div>
            {curso.oQueLevar.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="font-bold">🎒 O que levar de casa</dt>
                <dd>{curso.oQueLevar.join(" · ")}</dd>
              </div>
            )}
          </dl>

          <div className="rounded-2xl border-2 bg-card p-7">
            <p className={`text-2xl font-semibold ${vagas ? "" : "text-highlight"}`}>
              {vagas ? `${vagas} vagas livres` : "Turma cheia"}
            </p>
            {carregando ? (
              <p className="mt-4 text-lg">Um momento…</p>
            ) : inscrito ? (
              <div className="mt-4" data-lia="inscricao-ok">
                <p className="rounded-xl bg-accent p-4 text-lg font-bold text-accent-foreground">
                  ✓ Você está inscrito neste curso.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    cancelarInscricao(curso.id, usuario!.id);
                    setMensagem("");
                    lia.falar(
                      "Cancelei a sua inscrição. Se mudar de ideia, é só se inscrever de novo.",
                    );
                  }}
                  className="mt-4 text-lg font-bold text-primary underline underline-offset-4"
                >
                  Cancelar minha inscrição
                </button>
              </div>
            ) : usuario ? (
              <button
                type="button"
                onClick={aoInscrever}
                disabled={!vagas}
                className="mt-4 w-full rounded-full bg-primary py-4 text-xl font-bold text-primary-foreground disabled:opacity-60"
                data-lia="botao-inscrever"
              >
                Quero me inscrever
              </button>
            ) : (
              <div className="mt-4 space-y-3" data-lia="precisa-conta">
                <p className="text-lg">Para se inscrever, entre na sua conta.</p>
                <Link
                  to="/entrar"
                  search={{ voltar: `/cursos/${curso.id}` }}
                  className="block rounded-full bg-primary py-4 text-center text-xl font-bold text-primary-foreground"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  search={{ tipo: "aprender" }}
                  className="block rounded-full border-2 border-foreground py-3 text-center text-lg font-bold"
                >
                  Ainda não tenho cadastro
                </Link>
              </div>
            )}
            {mensagem && !inscrito && (
              <p role="status" className="mt-4 text-lg font-bold">
                {mensagem}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
