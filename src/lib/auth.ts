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
};

type MetaConta = { nome?: string; tipo?: string };

function paraUsuario(
  u: { id: string; email?: string | undefined; user_metadata?: MetaConta } | null | undefined,
): Usuario | null {
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  const email = u.email ?? "";
  return {
    id: u.id,
    email,
    nome: meta.nome?.trim() || email.split("@")[0] || "Você",
    tipo: meta.tipo === "ensinar" ? "ensinar" : "aprender",
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
