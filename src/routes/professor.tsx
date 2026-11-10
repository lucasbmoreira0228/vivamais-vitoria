import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { MontarAula, type AulaMontada } from "@/components/professor/MontarAula";
import { useLia, useLiaPagina } from "@/components/lia/Lia";
import { useUsuario } from "@/lib/auth";
import {
  adicionarAula,
  novoId,
  removerCurso,
  salvarCurso,
  useCursos,
  useInscricoes,
  type Curso,
} from "@/lib/cursos";
import {
  CATEGORIAS,
  passoAPassoOrganizar,
  perfilDa,
  revisarCurso,
  sugerirDescricao,
  type DadosCurso,
} from "@/lib/lia-professora";

export const Route = createFileRoute("/professor")({
  head: () => ({
    meta: [
      { title: "Área do professor — Viva+Vitória" },
      {
        name: "description",
        content:
          "Monte o seu curso e o passo a passo de cada aula com a ajuda da Lia, a assistente da Viva+Vitória.",
      },
      { property: "og:title", content: "Área do professor — Viva+Vitória" },
      {
        property: "og:description",
        content: "Ensine o que você sabe: a Lia ajuda a montar o curso e as aulas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Professor,
});

const caixa =
  "mt-2 w-full rounded-xl border-2 bg-card px-4 py-3 text-lg font-normal outline-none focus:border-primary";
const ETAPAS = ["Sobre o curso", "Onde e quando", "Primeira aula", "Revisar e publicar"];

type Rascunho = {
  titulo: string;
  categoria: string;
  descricao: string;
  local: string;
  endereco: string;
  diaHorario: string;
  duracaoMin: number;
  vagas: number;
  oQueLevar: string;
};
const VAZIO: Rascunho = {
  titulo: "",
  categoria: "",
  descricao: "",
  local: "",
  endereco: "",
  diaHorario: "",
  duracaoMin: 0,
  vagas: 0,
  oQueLevar: "",
};

const paraDados = (r: Rascunho): DadosCurso => ({
  titulo: r.titulo,
  categoria: r.categoria || "Outro",
  descricao: r.descricao,
  local: r.local,
  endereco: r.endereco,
  diaHorario: r.diaHorario,
  duracaoMin: r.duracaoMin,
  vagas: r.vagas,
  oQueLevar: r.oQueLevar
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean),
});

function Professor() {
  const { usuario } = useUsuario();
  const cursos = useCursos();
  const inscricoes = useInscricoes();
  const lia = useLia();
  const [etapa, setEtapa] = useState(0);
  const [r, setR] = useState<Rascunho>(VAZIO);
  const [aula, setAula] = useState<AulaMontada>(null);
  const [publicado, setPublicado] = useState<Curso | null>(null);
  const mudar = (p: Partial<Rascunho>) => setR((x) => ({ ...x, ...p }));
  const dados = paraDados(r);
  const meus = usuario ? cursos.filter((c) => c.professor.id === usuario.id) : [];
  const sugestoes = useMemo(() => revisarCurso(paraDados(r)), [r]);
  const organizar = passoAPassoOrganizar(dados);

  useLiaPagina({
    nome: "Área do professor",
    papel: "professor",
    saudacao:
      "Olá, professor! Eu sou a Lia. Vou ajudar você a montar o seu curso e o passo a passo de cada aula. O que você não souber, eu completo, e você confere. Toque em Criar meu curso com a Lia.",
    roteiros: [
      {
        id: "criar-curso",
        tarefa: "Criar meu curso com a Lia",
        passos: [
          {
            alvo: "campo-titulo",
            fala: "Vamos começar. Escreva o nome do seu curso. Por exemplo: Crochê para iniciantes. Depois toque em Próximo.",
          },
          {
            alvo: "escolha-categoria",
            fala: "Agora toque no tipo do seu curso. Assim eu sei qual material pedir à Prefeitura e quais cuidados sugerir. Depois toque em Próximo.",
          },
          {
            alvo: "campo-descricao",
            fala: "Conte em poucas palavras o que a turma vai aprender. Se não souber o que escrever, toque em Lia, escreva para mim. Depois toque em Próximo.",
          },
          {
            alvo: "proxima-etapa",
            fala: "Muito bem! Toque em Continuar para ir para a próxima etapa.",
            esperarClique: true,
          },
          {
            alvo: "campo-local",
            fala: "Escreva o bairro ou o lugar da aula, como Centro ou Jardim da Penha. Depois toque em Próximo.",
          },
          {
            alvo: "campo-dia",
            fala: "Escreva o dia e o horário. Por exemplo: Terças, 14 horas. Depois toque em Próximo.",
          },
          {
            alvo: "campo-duracao",
            fala: "Escolha quanto tempo dura cada aula e quantos alunos cabem na turma. Se deixar em branco, eu sugiro. Depois toque em Próximo.",
          },
          { alvo: "proxima-etapa", fala: "Agora toque em Continuar.", esperarClique: true },
          {
            alvo: "campo-tema",
            fala: "Hora da primeira aula! Escreva o tema dela. Pode ser bem curto. Depois toque em Próximo.",
          },
          {
            alvo: "campo-observacoes",
            fala: "Se quiser, conte do seu jeito o que quer ensinar. Pode escrever como se estivesse falando. Depois toque em Próximo.",
          },
          {
            alvo: "botao-montar-aula",
            fala: "Agora toque no botão vermelho. Eu monto o passo a passo da aula para você.",
            esperarClique: true,
          },
          {
            alvo: "plano-aula",
            fala: "Aqui está o passo a passo, com o tempo de cada parte. O que eu completei está no quadro amarelo. Confira e mude o que quiser. Depois toque em Próximo.",
          },
          {
            alvo: "proxima-etapa",
            fala: "Quando estiver tudo certo, toque em Continuar.",
            esperarClique: true,
          },
          {
            alvo: "revisao",
            fala: "Aqui eu mostro o que ainda falta no curso, com uma sugestão. Toque em Usar a sugestão se gostar. Depois toque em Próximo.",
          },
          {
            alvo: "organizar",
            fala: "Este é o passo a passo para organizar a sua aula: o que fazer uma semana antes, um dia antes, no dia e depois. Depois toque em Próximo.",
          },
          {
            alvo: "botao-publicar",
            fala: "Tudo pronto! Toque em Publicar meu curso para os alunos verem.",
            esperarClique: true,
          },
        ],
      },
    ],
    acoes: [
      {
        id: "como-organizar",
        titulo: "Como organizar a minha aula",
        detalhe: "Leio o passo a passo: antes, no dia e depois",
        executar: () =>
          lia.falar(organizar.map((b) => `${b.quando}: ${b.itens.join(" ")}`).join(" ")),
      },
      {
        id: "bom-plano",
        titulo: "O que é um bom plano de aula?",
        detalhe: "Explico como uma colega professora",
        executar: () =>
          lia.falar(
            "Um bom plano de aula para a turma 50+ tem cinco partes: uma acolhida para todos se conhecerem, a explicação do que vamos aprender, você mostrando como se faz, bastante tempo para a turma praticar e um encerramento com um resumo. Ensine um passo de cada vez e só siga quando todos tiverem conseguido.",
          ),
      },
    ],
    contexto: () =>
      `Etapa do formulário: ${ETAPAS[etapa]}. Curso em criação: ${JSON.stringify(dados)}. ${aula ? "Plano da aula: " + JSON.stringify(aula.plano) : ""}`,
  });

  function irPara(n: number) {
    if (n === 1 && r.titulo.trim().length < 3) {
      lia.falar("Escreva primeiro o nome do curso. Pode ser bem simples.", "alerta");
      return;
    }
    setEtapa(n);
    lia.falar(`Etapa ${n + 1} de 4: ${ETAPAS[n]}.`);
    window.scrollTo({ top: document.getElementById("criar")?.offsetTop ?? 0, behavior: "smooth" });
  }

  function publicar() {
    if (!usuario) return;
    // A Lia completa o que ainda falta antes de publicar.
    const d = paraDados(r);
    const curso: Curso = {
      ...d,
      id: novoId(),
      categoria: d.categoria,
      descricao: d.descricao?.trim() || sugerirDescricao(d),
      local: d.local?.trim() || "Local a combinar",
      diaHorario: d.diaHorario?.trim() || "Dia a combinar",
      duracaoMin: d.duracaoMin || aula?.plano.duracaoMin || 90,
      vagas: d.vagas || 15,
      oQueLevar: d.oQueLevar?.length ? d.oQueLevar : perfilDa(String(d.categoria)).levar,
      professor: { id: usuario.id, nome: usuario.nome },
      aulas: aula
        ? [{ id: novoId(), numero: 1, plano: aula.plano, criadaEm: new Date().toISOString() }]
        : [],
      criadoEm: new Date().toISOString(),
    };
    salvarCurso(curso);
    setPublicado(curso);
    setR(VAZIO);
    setAula(null);
    setEtapa(0);
    lia.falar(
      `Parabéns! O curso ${curso.titulo} foi publicado. Os alunos já podem ver e se inscrever.`,
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-32 pt-6">
        <p className="mb-4 font-bold uppercase tracking-widest text-primary">
          Para quem quer ensinar
        </p>
        <h1 className="text-5xl font-semibold md:text-6xl">Área do professor</h1>
        <p className="mt-6 max-w-3xl text-xl text-muted-foreground">
          Os cursos são presenciais e o material das aulas é fornecido pela Prefeitura. Monte o seu
          curso em 4 etapas. A Lia, no canto da tela, faz o passo a passo de cada aula e completa o
          que faltar, como uma colega professora. Você confere e decide.
        </p>

        {!usuario && (
          <div className="mt-8 rounded-2xl bg-accent p-7 text-lg text-accent-foreground">
            <p className="font-bold">
              Você pode experimentar à vontade. Para publicar o curso, entre na sua conta de
              professor.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/entrar"
                search={{ voltar: "/professor" }}
                className="rounded-full bg-foreground px-6 py-3 font-bold text-background"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                search={{ tipo: "ensinar" }}
                className="rounded-full border-2 border-foreground px-6 py-3 font-bold"
              >
                Cadastrar como professor
              </Link>
            </div>
          </div>
        )}

        {publicado && (
          <div
            className="mt-8 rounded-2xl bg-secondary p-7 text-lg text-secondary-foreground"
            role="status"
          >
            <p className="text-2xl font-semibold">🎉 Curso publicado: {publicado.titulo}</p>
            <Link
              to="/cursos/$id"
              params={{ id: publicado.id }}
              className="mt-4 inline-block rounded-full bg-background px-6 py-3 font-bold text-foreground"
            >
              Ver como o aluno vê
            </Link>
          </div>
        )}

        {meus.length > 0 && (
          <section className="mt-12" aria-labelledby="meus">
            <h2 id="meus" className="text-4xl font-semibold">
              Meus cursos
            </h2>
            <div className="mt-6 space-y-6">
              {meus.map((c) => (
                <MeuCurso
                  key={c.id}
                  curso={c}
                  inscritos={inscricoes.filter((i) => i.cursoId === c.id).map((i) => i.nome)}
                />
              ))}
            </div>
          </section>
        )}

        <section
          id="criar"
          className="mt-12 rounded-3xl border-2 bg-card p-6 md:p-10"
          aria-labelledby="titulo-criar"
        >
          <h2 id="titulo-criar" className="text-4xl font-semibold">
            Criar um curso novo
          </h2>
          <ol className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Etapas">
            {ETAPAS.map((nome, i) => (
              <li key={nome}>
                <button
                  type="button"
                  onClick={() => irPara(i)}
                  aria-current={etapa === i ? "step" : undefined}
                  className={`w-full rounded-xl border-2 px-3 py-3 text-left font-bold ${etapa === i ? "border-primary bg-primary text-primary-foreground" : i < etapa ? "bg-muted" : "bg-card"}`}
                >
                  <span className="block text-sm uppercase tracking-wider">Etapa {i + 1}</span>
                  {nome}
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-8 space-y-6">
            {etapa === 0 && (
              <>
                <label className="block text-lg font-bold">
                  Nome do curso
                  <input
                    value={r.titulo}
                    onChange={(e) => mudar({ titulo: e.target.value })}
                    placeholder="Ex.: Crochê para iniciantes"
                    className={caixa}
                    data-lia="campo-titulo"
                  />
                </label>
                <fieldset data-lia="escolha-categoria">
                  <legend className="text-lg font-bold">Tipo de curso</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CATEGORIAS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={r.categoria === c}
                        onClick={() => mudar({ categoria: c })}
                        className={`min-h-12 rounded-full border-2 px-5 text-lg font-bold ${r.categoria === c ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div data-lia="campo-descricao">
                  <label className="block text-lg font-bold">
                    O que a turma vai aprender?
                    <textarea
                      rows={4}
                      value={r.descricao}
                      onChange={(e) => mudar({ descricao: e.target.value })}
                      className={`${caixa} resize-y`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const t = sugerirDescricao(dados);
                      mudar({ descricao: t });
                      lia.falar(`Escrevi assim: ${t} Se quiser, mude do seu jeito.`);
                    }}
                    className="mt-3 min-h-12 rounded-full border-2 border-foreground px-5 font-bold"
                  >
                    ✨ Lia, escreva para mim
                  </button>
                </div>
              </>
            )}

            {etapa === 1 && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-lg font-bold">
                    Bairro ou lugar da aula
                    <input
                      value={r.local}
                      onChange={(e) => mudar({ local: e.target.value })}
                      placeholder="Ex.: Jardim da Penha"
                      className={caixa}
                      data-lia="campo-local"
                    />
                  </label>
                  <label className="block text-lg font-bold">
                    Endereço (opcional)
                    <input
                      value={r.endereco}
                      onChange={(e) => mudar({ endereco: e.target.value })}
                      placeholder="Rua, número, ponto de referência"
                      className={caixa}
                    />
                  </label>
                </div>
                <label className="block text-lg font-bold">
                  Dia e horário
                  <input
                    value={r.diaHorario}
                    onChange={(e) => mudar({ diaHorario: e.target.value })}
                    placeholder="Ex.: Terças, 14h"
                    className={caixa}
                    data-lia="campo-dia"
                  />
                </label>
                <div className="grid gap-6 md:grid-cols-2" data-lia="campo-duracao">
                  <label className="block text-lg font-bold">
                    Quanto tempo dura cada aula?
                    <select
                      value={r.duracaoMin || ""}
                      onChange={(e) => mudar({ duracaoMin: Number(e.target.value) })}
                      className={caixa}
                    >
                      <option value="">A Lia sugere</option>
                      <option value="60">1 hora</option>
                      <option value="90">1 hora e meia</option>
                      <option value="120">2 horas</option>
                      <option value="150">2 horas e meia</option>
                    </select>
                  </label>
                  <label className="block text-lg font-bold">
                    Quantos alunos cabem?
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={r.vagas || ""}
                      onChange={(e) => mudar({ vagas: Number(e.target.value) })}
                      placeholder="Ex.: 15"
                      className={caixa}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-lg font-bold">
                    O que o aluno leva de casa? Só coisas pessoais: o material vem da Prefeitura (um
                    por linha, opcional)
                    <textarea
                      rows={3}
                      value={r.oQueLevar}
                      onChange={(e) => mudar({ oQueLevar: e.target.value })}
                      className={`${caixa} resize-y`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const itens = perfilDa(r.categoria).levar;
                      mudar({ oQueLevar: itens.join("\n") });
                      lia.falar(`Sugeri: ${itens.join(", ")}.`);
                    }}
                    className="mt-3 min-h-12 rounded-full border-2 border-foreground px-5 font-bold"
                  >
                    ✨ Lia, sugira o que levar
                  </button>
                </div>
              </>
            )}

            {etapa === 2 && <MontarAula curso={dados} numero={1} valor={aula} aoMudar={setAula} />}

            {etapa === 3 && (
              <>
                <div data-lia="revisao" className="rounded-2xl bg-muted p-6">
                  <h3 className="text-2xl font-semibold">O que a Lia revisou</h3>
                  {sugestoes.length === 0 && aula ? (
                    <p className="mt-3 text-lg">✓ Está tudo completo. Muito bem!</p>
                  ) : (
                    <ul className="mt-3 space-y-4 text-lg">
                      {!aula && (
                        <li>
                          <strong>Falta montar a primeira aula.</strong>{" "}
                          <button
                            type="button"
                            onClick={() => irPara(2)}
                            className="font-bold text-primary underline underline-offset-4"
                          >
                            Montar agora
                          </button>
                        </li>
                      )}
                      {sugestoes.map((s) => (
                        <li key={s.campo}>
                          <strong>{s.falta}</strong>
                          {s.sugestao !== "" && (
                            <>
                              {" "}
                              Sugestão:{" "}
                              <em>
                                {Array.isArray(s.sugestao)
                                  ? s.sugestao.join(", ")
                                  : String(s.sugestao)}
                              </em>{" "}
                              <button
                                type="button"
                                onClick={() =>
                                  mudar({
                                    [s.campo]: Array.isArray(s.sugestao)
                                      ? s.sugestao.join("\n")
                                      : s.sugestao,
                                  } as Partial<Rascunho>)
                                }
                                className="font-bold text-primary underline underline-offset-4"
                              >
                                Usar a sugestão
                              </button>
                            </>
                          )}
                          {s.sugestao === "" && (
                            <>
                              {" "}
                              <button
                                type="button"
                                onClick={() => irPara(1)}
                                className="font-bold text-primary underline underline-offset-4"
                              >
                                Escrever agora
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div data-lia="organizar">
                  <h3 className="text-2xl font-semibold">
                    Passo a passo para organizar a sua aula
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {organizar.map((b) => (
                      <div key={b.quando} className="rounded-2xl border-2 p-5">
                        <p className="text-xl font-bold">{b.quando}</p>
                        <ul className="mt-2 space-y-2 text-lg">
                          {b.itens.map((it) => (
                            <li key={it}>
                              <label className="flex gap-3">
                                <input type="checkbox" className="mt-1 h-6 w-6 flex-none" />
                                <span>{it}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {usuario ? (
                  <button
                    type="button"
                    onClick={publicar}
                    className="min-h-16 w-full rounded-full bg-primary text-xl font-bold text-primary-foreground"
                    data-lia="botao-publicar"
                  >
                    Publicar meu curso
                  </button>
                ) : (
                  <div
                    className="rounded-2xl bg-accent p-6 text-lg text-accent-foreground"
                    data-lia="botao-publicar"
                  >
                    <p className="font-bold">
                      Para publicar, entre na sua conta. O que você escreveu fica guardado nesta
                      tela.
                    </p>
                    <Link
                      to="/entrar"
                      search={{ voltar: "/professor" }}
                      className="mt-3 inline-block rounded-full bg-foreground px-6 py-3 font-bold text-background"
                    >
                      Entrar
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-10 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => irPara(Math.max(0, etapa - 1))}
              disabled={etapa === 0}
              className="min-h-14 rounded-full border-2 border-foreground px-8 text-lg font-bold disabled:opacity-40"
            >
              ← Voltar
            </button>
            {etapa < 3 && (
              <button
                type="button"
                onClick={() => irPara(etapa + 1)}
                className="min-h-14 rounded-full bg-primary px-8 text-lg font-bold text-primary-foreground"
                data-lia="proxima-etapa"
              >
                Continuar →
              </button>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------------------------------------------------------- */
/* Um curso do professor: inscritos e novas aulas              */
/* ---------------------------------------------------------- */
function MeuCurso({ curso, inscritos }: { curso: Curso; inscritos: string[] }) {
  const lia = useLia();
  const [novaAula, setNovaAula] = useState(false);
  const [aula, setAula] = useState<AulaMontada>(null);
  const [verOrganizar, setVerOrganizar] = useState(false);

  return (
    <article className="rounded-2xl border-2 bg-card p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            {curso.categoria}
          </span>
          <h3 className="mt-3 text-3xl font-semibold">{curso.titulo}</h3>
          <p className="mt-2 text-lg text-muted-foreground">
            📍 {curso.local} · 🗓️ {curso.diaHorario} · {curso.aulas.length}{" "}
            {curso.aulas.length === 1 ? "aula" : "aulas"}
          </p>
        </div>
        <Link
          to="/cursos/$id"
          params={{ id: curso.id }}
          className="rounded-full border-2 border-foreground px-5 py-2 text-lg font-bold"
        >
          Ver como aluno
        </Link>
      </div>

      <div className="mt-5 rounded-xl bg-muted p-5 text-lg">
        <p className="font-bold">
          Inscritos: {inscritos.length} de {curso.vagas}
        </p>
        {inscritos.length > 0 ? (
          <p className="mt-1">{inscritos.join(", ")}</p>
        ) : (
          <p className="mt-1">Ainda ninguém. Divulgue o curso para os amigos!</p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setNovaAula((v) => !v)}
          className="min-h-14 rounded-full bg-primary px-6 text-lg font-bold text-primary-foreground"
        >
          {novaAula ? "Fechar" : `+ Montar a aula ${curso.aulas.length + 1} com a Lia`}
        </button>
        <button
          type="button"
          onClick={() => setVerOrganizar((v) => !v)}
          className="min-h-14 rounded-full border-2 border-foreground px-6 text-lg font-bold"
        >
          Como organizar a aula
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Tirar o curso ${curso.titulo} da plataforma?`)) {
              removerCurso(curso.id);
              lia.falar("Tirei o curso da plataforma.");
            }
          }}
          className="min-h-14 px-4 text-lg font-bold text-highlight underline underline-offset-4"
        >
          Tirar o curso
        </button>
      </div>

      {verOrganizar && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {passoAPassoOrganizar(curso).map((b) => (
            <div key={b.quando} className="rounded-2xl border-2 p-5">
              <p className="text-xl font-bold">{b.quando}</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-lg">
                {b.itens.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {novaAula && (
        <div className="mt-8 border-t-2 pt-8">
          <MontarAula
            curso={curso}
            numero={curso.aulas.length + 1}
            valor={aula}
            aoMudar={setAula}
          />
          {aula && (
            <button
              type="button"
              onClick={() => {
                adicionarAula(curso.id, aula.plano);
                setAula(null);
                setNovaAula(false);
                lia.falar("Aula guardada!");
              }}
              className="mt-6 min-h-16 w-full rounded-full bg-primary text-xl font-bold text-primary-foreground"
            >
              Guardar esta aula
            </button>
          )}
        </div>
      )}
    </article>
  );
}
