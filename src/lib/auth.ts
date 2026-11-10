/*
 * Conta do usuário (login com e-mail e senha pelo Supabase do Lovable Cloud).
 * O "tipo" (aprender ou ensinar) fica guardado nos dados da conta.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  tipo: "aprender" | "ensinar";
  /** false quando a pessoa entrou pelo Google e ainda falta telefone e curso */
  cadastroCompleto: boolean;
};

type MetaConta = {
  nome?: string;
  full_name?: string;
  name?: string;
  tipo?: string;
  telefone?: string;
};

function paraUsuario(
  u: { id: string; email?: string | undefined; user_metadata?: MetaConta } | null | undefined,
): Usuario | null {
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  const email = u.email ?? "";
  return {
    id: u.id,
    email,
    nome: (meta.nome || meta.full_name || meta.name || "").trim() || email.split("@")[0] || "Você",
    tipo: meta.tipo === "ensinar" ? "ensinar" : "aprender",
    cadastroCompleto: !!meta.telefone,
  };
}

export function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;
    let cancelar: (() => void) | undefined;
    try {
      supabase.auth.getSession().then(
        ({ data }) => {
          if (!vivo) return;
          setUsuario(paraUsuario(data.session?.user as never));
          setCarregando(false);
        },
        () => vivo && setCarregando(false),
      );
      const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
        if (vivo) setUsuario(paraUsuario(sessao?.user as never));
      });
      cancelar = () => data.subscription.unsubscribe();
    } catch {
      // Supabase não configurado neste ambiente: segue como visitante.
      setCarregando(false);
    }
    return () => {
      vivo = false;
      cancelar?.();
    };
  }, []);

  return { usuario, carregando };
}

/** Mensagens de erro do login em português simples. */
export function erroEmPortugues(mensagem: string | undefined): string {
  const m = (mensagem ?? "").toLowerCase();
  if (m.includes("invalid login"))
    return "E-mail ou senha não conferem. Confira as letras e tente de novo.";
  if (m.includes("email not confirmed"))
    return "Falta confirmar o seu e-mail. Abra o e-mail que enviamos e toque no link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Este e-mail já tem cadastro. Toque em Entrar para acessar a sua conta.";
  if (m.includes("password") && (m.includes("6") || m.includes("short")))
    return "A senha precisa ter pelo menos 6 letras ou números.";
  if (m.includes("rate limit"))
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "O acesso pelo Google ainda não foi ligado. Por enquanto, use o e-mail e a senha.";
  if (m.includes("missing supabase")) return "O login ainda não está ligado nesta versão do site.";
  return "Não consegui agora. Confira a internet e tente de novo.";
}

export async function sair() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* nada a fazer */
  }
}

const CHAVE_TIPO = "vivamais.tipoGoogle";

/**
 * Entrar ou se cadastrar com a conta do Google.
 * A pessoa sai do site, escolhe a conta no Google e volta para /entrar.
 */
export async function entrarComGoogle(
  opcoes: { tipo?: "aprender" | "ensinar"; voltar?: string } = {},
) {
  try {
    if (opcoes.tipo) localStorage.setItem(CHAVE_TIPO, opcoes.tipo);
  } catch {
    /* sem armazenamento */
  }
  const destino = new URL("/entrar", location.origin);
  destino.searchParams.set("google", "1");
  if (opcoes.voltar) destino.searchParams.set("voltar", opcoes.voltar);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: destino.toString(), queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
}

/** O tipo (aprender/ensinar) escolhido antes de ir para o Google. */
export function tipoEscolhidoNoGoogle(): "aprender" | "ensinar" | undefined {
  try {
    const t = localStorage.getItem(CHAVE_TIPO);
    return t === "ensinar" || t === "aprender" ? t : undefined;
  } catch {
    return undefined;
  }
}
