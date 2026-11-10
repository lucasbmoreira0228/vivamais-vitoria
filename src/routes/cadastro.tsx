import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { erroEmPortugues } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { useLia, useLiaPagina } from "@/components/lia/Lia";

const schema = z.object({
  tipo: z.enum(["aprender", "ensinar"]),
  nome: z.string().trim().min(2, "Escreva o seu nome").max(120),
  telefone: z
    .string()
    .trim()
    .min(8, "Escreva um telefone com DDD, por exemplo 27 99999-0000")
    .max(30),
  email: z
    .string()
    .trim()
    .email("Confira o e-mail: ele precisa ter @ e um ponto, como maria@gmail.com")
    .max(255),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 letras ou números").max(72),
  bairro: z.string().trim().max(100),
  area: z.string().trim().min(2, "Conte qual curso").max(120),
  mensagem: z.string().trim().max(1000),
});

export const Route = createFileRoute("/cadastro")({
  validateSearch: (s: Record<string, unknown>): { tipo?: "aprender" | "ensinar" | undefined } => ({
    tipo: s["tipo"] === "ensinar" ? "ensinar" : s["tipo"] === "aprender" ? "aprender" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cadastro — Viva+Vitória" },
      {
        name: "description",
        content: "Cadastre-se para aprender ou ensinar em cursos presenciais 50+ em Vitória - ES.",
      },
      { property: "og:title", content: "Cadastro — Viva+Vitória" },
      {
        property: "og:description",
        content: "Quer aprender ou ensinar? Faça seu cadastro na comunidade Viva+Vitória.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cadastro,
});

const field =
  "mt-2 w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none focus:border-primary";

function Cadastro() {
  const search = Route.useSearch();
  const lia = useLia();
  const [tipo, setTipo] = useState<"aprender" | "ensinar">(search.tipo ?? "aprender");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [ok, setOk] = useState<null | { entrou: boolean }>(null);

  useLiaPagina({
    nome: "Cadastro",
    papel: "visitante",
    saudacao:
      "Olá! Eu sou a Lia. Vou ajudar você a fazer o seu cadastro, um campo de cada vez. Toque em Fazer meu cadastro com a Lia.",
    roteiros: [
      {
        id: "cadastro",
        tarefa: "Fazer meu cadastro com a Lia",
        passos: [
          {
            alvo: "escolha-tipo",
            fala: "Primeiro, escolha: você quer aprender ou quer ensinar? Toque na opção certa. Depois toque em Próximo.",
          },
          {
            alvo: "campo-nome",
            fala: "Escreva aqui o seu nome completo. Depois toque em Próximo.",
          },
          {
            alvo: "campo-telefone",
            fala: "Agora o seu telefone ou WhatsApp, com o DDD. Por exemplo: 27, 9 9 9 9 9, 0 0 0 0. Depois toque em Próximo.",
          },
          {
            alvo: "campo-email",
            fala: "Escreva o seu e-mail. Ele vai servir para você entrar na plataforma. Depois toque em Próximo.",
          },
          {
            alvo: "campo-senha",
            fala: "Crie uma senha com pelo menos 6 letras ou números. Anote num lugar seguro e não conte para ninguém. Depois toque em Próximo.",
          },
          {
            alvo: "campo-bairro",
            fala: "Escreva o bairro onde você mora. Assim achamos cursos perto de você. Depois toque em Próximo.",
          },
          {
            alvo: "campo-area",
            fala: "Conte qual curso você quer fazer, ou qual curso você quer dar. Depois toque em Próximo.",
          },
          {
            alvo: "campo-mensagem",
            fala: "Este campo é opcional. Se quiser, conte algo mais sobre você. Depois toque em Próximo.",
          },
          {
            alvo: "botao-enviar",
            fala: "Tudo pronto! Confira os dados e toque no botão azul Enviar cadastro.",
            esperarClique: true,
          },
        ],
      },
    ],
    acoes: [
      {
        id: "por-que",
        titulo: "Por que pedem meus dados?",
        detalhe: "Explico para que serve cada informação",
        executar: () =>
          lia.falar(
            "O nome e o telefone servem para o professor falar com você. O e-mail e a senha servem para você entrar na plataforma. O bairro ajuda a achar cursos perto de casa. Seus dados vão para a Prefeitura de Vitória e não são vendidos para ninguém.",
          ),
      },
    ],
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = schema.safeParse({ ...f, tipo });
    if (!r.success) {
      const msg = r.error.issues[0]?.message ?? "Confira os dados";
      setErro(msg);
      lia.falar(msg, "alerta");
      return;
    }
    setEnviando(true);
    const { senha, ...d } = r.data;
    try {
      // 1) cria a conta para entrar na plataforma
      const conta = await supabase.auth.signUp({
        email: d.email,
        password: senha,
        options: {
          emailRedirectTo: `${location.origin}/entrar`,
          data: { nome: d.nome, tipo: d.tipo, telefone: d.telefone, bairro: d.bairro },
        },
      });
      if (conta.error) throw conta.error;
      // 2) manda o cadastro para a Prefeitura (como antes)
      const { error } = await supabase.from("cadastros").insert({
        ...d,
        email: d.email || null,
        bairro: d.bairro || null,
        mensagem: d.mensagem || null,
      });
      if (error) console.error("[cadastro] não foi possível registrar na Prefeitura", error);
      const entrou = !!conta.data.session;
      setOk({ entrou });
      lia.falar(
        entrou
          ? "Cadastro feito! Você já está na sua conta."
          : "Cadastro feito! Agora abra o seu e-mail e toque no link que mandamos para confirmar a sua conta.",
      );
    } catch (err) {
      const msg = erroEmPortugues(err instanceof Error ? err.message : "");
      setErro(msg);
      lia.falar(msg, "alerta");
    } finally {
      setEnviando(false);
    }
  }

  if (ok)
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
          <h1 className="text-5xl font-semibold">Cadastro recebido!</h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Seus dados foram encaminhados à Prefeitura de Vitória.{" "}
            {ok.entrou
              ? "Você já está na sua conta."
              : "Falta um passo: abra o seu e-mail e toque no link que mandamos para confirmar a conta. Depois, é só entrar."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to={tipo === "ensinar" ? "/professor" : "/cursos"}
              className="inline-block rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground"
            >
              {tipo === "ensinar" ? "Montar meu curso com a Lia" : "Ver os cursos"}
            </Link>
            {!ok.entrou && (
              <Link
                to="/entrar"
                className="inline-block rounded-full border-2 border-foreground px-8 py-4 text-lg font-bold"
              >
                Entrar
              </Link>
            )}
          </div>
        </main>
      </>
    );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-32 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border-2 border-foreground px-5 py-2 text-lg font-bold"
        >
          ← Voltar
        </Link>
        <h1 className="mt-10 text-5xl font-semibold">Faça seu cadastro</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Seu cadastro será encaminhado à Prefeitura de Vitória - ES e cria a sua conta para entrar
          na plataforma. A Lia, no canto da tela, ajuda você em cada campo.
        </p>
        <p className="mt-3 text-lg">
          Já tem conta?{" "}
          <Link to="/entrar" className="font-bold text-primary underline underline-offset-4">
            Entrar
          </Link>
        </p>

        <div
          className="mt-8 grid grid-cols-2 gap-3"
          role="radiogroup"
          aria-label="Eu quero"
          data-lia="escolha-tipo"
        >
          {(["aprender", "ensinar"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => setTipo(t)}
              className={`rounded-xl border-2 py-4 text-xl font-bold ${tipo === t ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
            >
              Quero {t}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6 text-lg" noValidate>
          <label className="block font-bold">
            Nome completo
            <input
              name="nome"
              autoComplete="name"
              className={field}
              required
              data-lia="campo-nome"
            />
          </label>
          <label className="block font-bold">
            Telefone / WhatsApp
            <input
              name="telefone"
              type="tel"
              autoComplete="tel"
              className={field}
              required
              data-lia="campo-telefone"
            />
          </label>
          <label className="block font-bold">
            E-mail (para entrar na plataforma)
            <input
              name="email"
              type="email"
              autoComplete="email"
              className={field}
              required
              data-lia="campo-email"
            />
          </label>
          <div>
            <label className="block font-bold">
              Crie uma senha (pelo menos 6 letras ou números)
              <input
                name="senha"
                type={mostrar ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                className={field}
                required
                data-lia="campo-senha"
              />
            </label>
            <label className="mt-3 inline-flex items-center gap-3 font-bold">
              <input
                type="checkbox"
                checked={mostrar}
                onChange={(e) => setMostrar(e.target.checked)}
                className="h-7 w-7"
              />
              Mostrar senha
            </label>
          </div>
          <label className="block font-bold">
            Bairro em Vitória
            <input name="bairro" className={field} data-lia="campo-bairro" />
          </label>
          <label className="block font-bold">
            {tipo === "ensinar" ? "Que curso você quer dar?" : "Que curso você quer fazer?"}
            <input name="area" className={field} required data-lia="campo-area" />
          </label>
          <label className="block font-bold">
            {tipo === "ensinar"
              ? "Conte sobre sua experiência (opcional)"
              : "Algo mais que queira contar? (opcional)"}
            <textarea
              name="mensagem"
              rows={4}
              className={`${field} resize-none`}
              data-lia="campo-mensagem"
            />
          </label>
          {erro && (
            <p role="alert" className="font-bold text-highlight">
              {erro}
            </p>
          )}
          <button
            disabled={enviando}
            className="w-full rounded-full bg-primary py-4 text-xl font-bold text-primary-foreground disabled:opacity-60"
            data-lia="botao-enviar"
          >
            {enviando ? "Enviando..." : "Enviar cadastro"}
          </button>
          <p className="text-center">
            <Link
              to="/"
              className="inline-block text-lg font-bold text-primary underline underline-offset-4"
            >
              ← Voltar ao início
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}
