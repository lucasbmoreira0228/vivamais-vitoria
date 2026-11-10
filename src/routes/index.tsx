import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { CartaoCurso } from "@/components/CartaoCurso";
import { LiaAvatar } from "@/components/lia/LiaAvatar";
import { useLia, useLiaPagina } from "@/components/lia/Lia";
import { useCursos, useInscricoes, vagasRestantes } from "@/lib/cursos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Viva+Vitória — Cursos presenciais pela cidade" },
      { name: "description", content: "Comunidade 50+ de Vitória - ES para aprender e ensinar em cursos presenciais pela cidade." },
      { property: "og:title", content: "Viva+Vitória — Cursos presenciais pela cidade" },
      { property: "og:description", content: "Aprenda ou ensine em cursos presenciais para o público 50+ em Vitória - ES." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const cursos = useCursos();
  const inscricoes = useInscricoes();
  const lia = useLia();

  useLiaPagina({
    nome: "Página inicial da Viva+Vitória",
    papel: "visitante",
    saudacao:
      "Olá! Eu sou a Lia, a assistente da Viva+Vitória. Eu ajudo você a achar um curso, fazer o cadastro, entrar na sua conta e entender as aulas. E, se você quiser ensinar, eu ajudo a montar o seu curso.",
    roteiros: [
      {
        id: "comecar",
        tarefa: "Conhecer a Viva+Vitória",
        passos: [
          { alvo: "menu-cursos", fala: "Aqui em Cursos você vê todas as turmas e se inscreve. Depois toque em Próximo." },
          { alvo: "menu-professor", fala: "Em Para professores, quem quer ensinar monta o curso e as aulas comigo. Depois toque em Próximo." },
          { alvo: "menu-cadastro", fala: "Ainda não tem conta? Toque em Cadastre-se. É rápido, e eu ajudo em cada campo. Depois toque em Próximo." },
          { alvo: "menu-entrar", fala: "Se você já tem cadastro, toque em Entrar e use o seu e-mail e a sua senha." },
        ],
      },
    ],
    acoes: [
      {
        id: "o-que-e",
        titulo: "O que é a Viva+Vitória?",
        detalhe: "Explico em poucas palavras",
        executar: () =>
          lia.falar(
            "A Viva+Vitória é uma comunidade para quem tem mais de 50 anos, em Vitória. Você pode fazer cursos presenciais perto de casa, ou ensinar o que você sabe. As aulas são presenciais, é de graça, o material é fornecido pela Prefeitura e o cadastro vai para ela.",
          ),
      },
    ],
  });

  return (
    <main>
      <SiteHeader />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div>
          <p className="mb-4 font-bold uppercase tracking-widest text-primary">Comunidade de aprendizado</p>
          <h1 className="text-5xl font-semibold md:text-6xl">Nunca é tarde para aprender — e fazer amigos.</h1>
          <p className="mt-6 text-xl text-muted-foreground">Uma comunidade 50+ de Vitória - ES para quem quer aprender algo novo — e para quem quer ensinar o que sabe. Cursos presenciais, em espaços acolhedores pela cidade.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/cursos" className="rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground">Quero aprender</Link>
            <Link to="/professor" className="rounded-full border-2 border-foreground px-8 py-4 text-lg font-bold">Quero ensinar</Link>
          </div>
        </div>
        <img src={hero} alt="Grupo de pessoas 50+ em aula de cerâmica" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl" />
      </section>

      <section id="como" className="bg-secondary py-20 text-secondary-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-semibold">Como funciona</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["1", "Escolha", "Aprender algo novo ou compartilhar o que você sabe."],
              ["2", "Cadastre-se", "Diga se quer aprender ou ensinar. Seu cadastro vai para a Prefeitura de Vitória."],
              ["3", "Compareça", "Encontre a turma no local, perto de casa, e aproveite."],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span className="font-display text-6xl text-accent">{n}</span>
                <h3 className="mt-2 text-2xl font-semibold">{t}</h3>
                <p className="mt-2 text-lg">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl items-center gap-8 px-6 md:grid-cols-[auto_1fr]" aria-labelledby="lia">
        <LiaAvatar className="mx-auto w-40 md:w-48" />
        <div>
          <h2 id="lia" className="text-4xl font-semibold">Conheça a Lia, a sua assistente</h2>
          <p className="mt-4 text-xl text-muted-foreground">
            A Lia fica no canto da tela, em todas as páginas. Ela fala com você, mostra onde tocar e lê as páginas em voz alta.
          </p>
          <ul className="mt-4 grid gap-2 text-lg sm:grid-cols-2">
            <li>✓ Ajuda no cadastro e no login</li>
            <li>✓ Acha o curso certo para você</li>
            <li>✓ Lê as páginas em voz alta</li>
            <li>✓ Monta o passo a passo da aula com o professor</li>
          </ul>
          <button type="button" onClick={lia.saudar} className="mt-6 rounded-full bg-secondary px-8 py-4 text-lg font-bold text-secondary-foreground">
            Falar com a Lia
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pt-20 md:grid-cols-2">
        <div className="rounded-2xl bg-accent p-10 text-accent-foreground">
          <h2 className="text-4xl font-semibold">Quero aprender</h2>
          <p className="mt-4 text-lg">Artes, culinária, tecnologia, dança e muito mais, perto de casa e com gente da sua geração.</p>
          <Link to="/cadastro" search={{ tipo: "aprender" }} className="mt-6 inline-block rounded-full bg-foreground px-8 py-4 text-lg font-bold text-background">Cadastrar como aluno</Link>
        </div>
        <div className="rounded-2xl bg-primary p-10 text-primary-foreground">
          <h2 className="text-4xl font-semibold">Quero ensinar</h2>
          <p className="mt-4 text-lg">Tem um ofício, um hobby ou uma vida de experiência? Compartilhe com a comunidade dando um curso.</p>
          <Link to="/cadastro" search={{ tipo: "ensinar" }} className="mt-6 inline-block rounded-full bg-background px-8 py-4 text-lg font-bold text-foreground">Cadastrar como professor</Link>
        </div>
      </section>

      <section id="cursos" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-4xl font-semibold">Próximas turmas</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.slice(0, 6).map((c) => (
            <CartaoCurso key={c.id} curso={c} vagas={vagasRestantes(c, inscricoes)} />
          ))}
        </div>
        <Link to="/cursos" className="mt-10 inline-block rounded-full border-2 border-foreground px-8 py-4 text-lg font-bold">
          Ver todos os cursos
        </Link>
      </section>

      <footer className="border-t py-10 pb-32 text-center text-muted-foreground">Viva+Vitória · Aprender junto, em qualquer idade</footer>
    </main>
  );
}
