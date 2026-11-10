import { useState } from "react";
import { useLia } from "@/components/lia/Lia";
import { entrarComGoogle, erroEmPortugues } from "@/lib/auth";

/** Botão grande "Entrar com o Google", usado no login e no cadastro. */
export function BotaoGoogle({
  texto,
  tipo,
  voltar,
}: {
  texto: string;
  tipo?: "aprender" | "ensinar" | undefined;
  voltar?: string | undefined;
}) {
  const lia = useLia();
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState("");

  async function clicar() {
    setErro("");
    setIndo(true);
    lia.falar("Vou abrir a página do Google. Escolha a sua conta e depois eu trago você de volta.");
    try {
      await entrarComGoogle({ ...(tipo ? { tipo } : {}), ...(voltar ? { voltar } : {}) });
    } catch (e) {
      const msg = erroEmPortugues(e instanceof Error ? e.message : "");
      setErro(msg);
      lia.falar(msg, "alerta");
      setIndo(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void clicar()}
        disabled={indo}
        data-lia="botao-google"
        className="flex min-h-16 w-full items-center justify-center gap-3 rounded-full border-2 border-foreground bg-card px-6 text-xl font-bold disabled:opacity-60"
      >
        <svg viewBox="0 0 48 48" aria-hidden="true" className="h-7 w-7 flex-none">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
          />
        </svg>
        {indo ? "Abrindo o Google…" : texto}
      </button>
      {erro && (
        <p role="alert" className="mt-3 font-bold text-highlight">
          {erro}
        </p>
      )}
    </div>
  );
}

export function SeparadorOu() {
  return (
    <div className="my-8 flex items-center gap-4 text-lg text-muted-foreground" aria-hidden="true">
      <span className="h-0.5 flex-1 bg-border" />
      ou
      <span className="h-0.5 flex-1 bg-border" />
    </div>
  );
}
