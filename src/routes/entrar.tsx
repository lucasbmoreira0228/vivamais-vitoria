import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { erroEmPortugues, useUsuario } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { useLia, useLiaPagina } from "@/components/lia/Lia";

export const Route = createFileRoute("/entrar")({
  validateSearch: (s: Record<string, unknown>): { voltar?: string } =>
    typeof s["voltar"] === "string" && s["voltar"].startsWith("/") ? { voltar: s["voltar"] } : {},
  head: () => ({
    meta: [
      { title: "Entrar — Viva+Vitória" },
      {
        name: "description",
        content:
          "Entre na sua conta da Viva+Vitória para se inscrever nos cursos ou montar as suas aulas.",
      },
      { property: "og:title", content: "Entrar — Viva+Vitória" },
      { property: "og:description", content: "Entre na sua conta da Viva+Vitória." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entrar,
});

const campo =
  "mt-2 w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none focus:border-primary";

function Entrar() {
  const { voltar } = Route.useSearch();
  const navigate = useNavigate();
  const { usuario } = useUsuario();
  const lia = useLia();
  const [modo, setModo] = useState<"entrar" | "esqueci" | "nova-senha">("entrar");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Quem abriu o link "criar senha nova" do e-mail chega aqui.
  useEffect(() => {
    try {
      const { data } = supabase.auth.onAuthStateChange((evento) => {
        if (evento === "PASSWORD_RECOVERY") setModo("nova-senha");
      });
      return () => data.subscription.unsubscribe();
    } catch {
      return undefined;
    }
  }, []);

  useLiaPagina({
    nome: "Entrar na sua conta",
    papel: "visitante",
    saudacao:
      "Olá! Eu sou a Lia. Aqui você entra na sua conta com o e-mail e a senha do cadastro. Quer que eu mostre como?",
    roteiros: [
      {
        id: "entrar",
        tarefa: "Entrar na minha conta",
        passos: [
          {
            alvo: "campo-email",
            fala: "Vamos entrar juntos. Toque neste campo e escreva o seu e-mail, o mesmo do cadastro. Depois toque em Próximo.",
          },
          {
            alvo: "campo-senha",
            fala: "Agora escreva a sua senha. Ninguém da Viva+Vitória pede a sua senha. Depois toque em Próximo.",
          },
          {
            alvo: "mostrar-senha",
            fala: "Se quiser conferir o que digitou, toque em Mostrar senha. Depois toque em Próximo.",
          },
          {
            alvo: "botao-entrar",
            fala: "Muito bem. Agora toque no botão azul Entrar.",
            esperarClique: true,
          },
        ],
      },
      {
        id: "esqueci",
        tarefa: "Esqueci minha senha",
        passos: [
          {
            alvo: "link-esqueci",
            fala: "Sem problema, acontece com todo mundo. Toque em Esqueci minha senha.",
            esperarClique: true,
          },
          { alvo: "campo-email", fala: "Escreva o seu e-mail e depois toque em Próximo." },
          {
            alvo: "botao-entrar",
            fala: "Agora toque no botão. Vamos mandar um e-mail com um link para você criar uma senha nova.",
            esperarClique: true,
          },
        ],
      },
      {
        id: "sem-conta",
        tarefa: "Ainda não tenho conta",
        passos: [
          {
            alvo: "link-cadastro",
            fala: "Para criar a sua conta, toque em Fazer meu cadastro. Eu ajudo você lá também.",
            esperarClique: true,
          },
        ],
      },
    ],
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setAviso("");
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const email = (f["email"] ?? "").trim();
    const senha = f["senha"] ?? "";
    setEnviando(true);
    try {
      if (modo === "esqueci") {
        if (!email.includes("@")) throw new Error("email");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/entrar`,
        });
        if (error) throw error;
        setAviso(
          "Pronto! Mandamos um e-mail para você. Abra o e-mail e toque no link para criar uma senha nova.",
        );
        lia.falar(
          "Pronto! Mandei um e-mail para você. Abra o e-mail e toque no link para criar uma senha nova.",
        );
      } else if (modo === "nova-senha") {
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        lia.falar("Senha nova guardada! Você já está dentro da sua conta.");
        void navigate({ to: voltar ?? "/cursos" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        lia.falar("Que bom ver você! Você entrou na sua conta.");
        void navigate({ to: voltar ?? "/cursos" });
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "email"
          ? "Escreva o seu e-mail completo, com @."
          : erroEmPortugues(err instanceof Error ? err.message : "");
      setErro(msg);
      lia.falar(msg, "alerta");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 pb-32 pt-6">
        <h1 className="text-5xl font-semibold">
          {modo === "esqueci"
            ? "Criar uma senha nova"
            : modo === "nova-senha"
              ? "Escolha a sua senha nova"
              : "Entrar"}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          {modo === "esqueci"
            ? "Escreva o e-mail do seu cadastro. Vamos mandar um link para você criar uma senha nova."
            : modo === "nova-senha"
              ? "Escreva uma senha que você consiga lembrar, com pelo menos 6 letras ou números."
              : "Use o e-mail e a senha que você criou no cadastro. Se precisar, chame a Lia no canto da tela."}
        </p>

        {usuario && modo === "entrar" && (
          <p className="mt-6 rounded-2xl bg-accent p-5 text-lg text-accent-foreground">
            Você já está na sua conta, {usuario.nome.split(" ")[0]}.{" "}
            <Link
              to={usuario.tipo === "ensinar" ? "/professor" : "/cursos"}
              className="font-bold underline"
            >
              {usuario.tipo === "ensinar" ? "Ir para a área do professor" : "Ver os cursos"}
            </Link>
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-6 text-lg">
          {modo !== "nova-senha" && (
            <label className="block font-bold">
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className={campo}
                data-lia="campo-email"
              />
            </label>
          )}
          {modo !== "esqueci" && (
            <div>
              <label className="block font-bold">
                {modo === "nova-senha" ? "Senha nova" : "Senha"}
                <input
                  name="senha"
                  type={mostrar ? "text" : "password"}
                  autoComplete={modo === "nova-senha" ? "new-password" : "current-password"}
                  minLength={6}
                  required
                  className={campo}
                  data-lia="campo-senha"
                />
              </label>
              <label
                className="mt-3 inline-flex items-center gap-3 font-bold"
                data-lia="mostrar-senha"
              >
                <input
                  type="checkbox"
                  checked={mostrar}
                  onChange={(e) => setMostrar(e.target.checked)}
                  className="h-7 w-7"
                />
                Mostrar senha
              </label>
            </div>
          )}
          {erro && (
            <p role="alert" className="font-bold text-highlight">
              {erro}
            </p>
          )}
          {aviso && (
            <p role="status" className="rounded-2xl bg-accent p-5 font-bold text-accent-foreground">
              {aviso}
            </p>
          )}
          <button
            disabled={enviando}
            data-lia="botao-entrar"
            className="w-full rounded-full bg-primary py-4 text-xl font-bold text-primary-foreground disabled:opacity-60"
          >
            {enviando
              ? "Um momento..."
              : modo === "esqueci"
                ? "Mandar o e-mail"
                : modo === "nova-senha"
                  ? "Guardar a senha nova"
                  : "Entrar"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4 text-lg">
          {modo === "entrar" ? (
            <button
              type="button"
              onClick={() => setModo("esqueci")}
              className="text-left font-bold text-primary underline underline-offset-4"
              data-lia="link-esqueci"
            >
              Esqueci minha senha
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModo("entrar")}
              className="text-left font-bold text-primary underline underline-offset-4"
            >
              ← Voltar para Entrar
            </button>
          )}
          <p>
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-bold text-primary underline underline-offset-4"
              data-lia="link-cadastro"
            >
              Fazer meu cadastro
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
