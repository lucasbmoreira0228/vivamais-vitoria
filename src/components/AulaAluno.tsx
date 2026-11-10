import { useState } from "react";
import { useLia } from "@/components/lia/Lia";
import { perguntarLia } from "@/lib/lia.functions";
import { textoParaOuvir } from "@/lib/lia-professora";
import type { Aula } from "@/lib/cursos";

/** Material da aula do jeito que o aluno vê: simples, em letra grande, com a Lia lendo. */
export function AulaAluno({
  aula,
  cursoTitulo,
  primeira = false,
}: {
  aula: Aula;
  cursoTitulo: string;
  primeira?: boolean;
}) {
  const lia = useLia();
  const [explicando, setExplicando] = useState(false);
  const p = aula.plano;
  const materiais = p.materiais.filter((m) => !/presen/i.test(m));

  async function explicar() {
    setExplicando(true);
    lia.abrir();
    lia.falar("Deixa eu preparar uma explicação simples para você…");
    let texto = "";
    try {
      const r = await perguntarLia({
        data: {
          pergunta:
            "Explique esta aula para mim de um jeito bem simples, como uma professora paciente. Diga o que vou aprender e o que vou fazer.",
          papel: "aluno",
          pagina: `Curso ${cursoTitulo}`,
          contexto: textoParaOuvir(p, aula.numero),
        },
      });
      if (r.ok) texto = r.resposta;
    } catch {
      /* sem IA */
    }
    setExplicando(false);
    lia.falar(
      texto ||
        `${p.resumoAluno} ${p.palavrasNovas.length ? "Algumas palavras que você vai ouvir: " + p.palavrasNovas.map((w) => `${w.termo}, que quer dizer: ${w.significado}`).join(" ") : ""}`,
    );
  }

  return (
    <article
      className="rounded-2xl border-2 bg-card p-7"
      aria-labelledby={`aula-${aula.id}`}
      data-lia={primeira ? "primeira-aula" : undefined}
    >
      <p className="font-bold uppercase tracking-widest text-primary">Aula {aula.numero}</p>
      <h3 id={`aula-${aula.id}`} className="mt-1 text-3xl font-semibold">
        {p.tema}
      </h3>
      <p className="mt-4 text-xl">{p.resumoAluno}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-xl font-bold">O que vamos fazer</h4>
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-lg">
            {p.etapas.map((e) => (
              <li key={e.titulo}>
                {e.titulo} <span className="text-muted-foreground">({e.minutos} min)</span>
              </li>
            ))}
          </ol>
        </div>
        {materiais.length > 0 && (
          <div>
            <h4 className="text-xl font-bold">O que vamos usar</h4>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-lg">
              {materiais.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {p.palavrasNovas.length > 0 && (
        <div className="mt-6 rounded-xl bg-muted p-5">
          <h4 className="text-xl font-bold">Palavras novas</h4>
          <dl className="mt-2 space-y-2 text-lg">
            {p.palavrasNovas.map((w) => (
              <div key={w.termo}>
                <dt className="inline font-bold">{w.termo}: </dt>
                <dd className="inline">{w.significado}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            lia.abrir();
            lia.falar(textoParaOuvir(p, aula.numero));
          }}
          className="min-h-14 rounded-full bg-secondary px-6 text-lg font-bold text-secondary-foreground"
          data-lia={primeira ? "ler-aula" : undefined}
        >
          🔊 Ler esta aula para mim
        </button>
        <button
          type="button"
          onClick={() => void explicar()}
          disabled={explicando}
          className="min-h-14 rounded-full border-2 border-foreground px-6 text-lg font-bold disabled:opacity-60"
          data-lia={primeira ? "explicar-aula" : undefined}
        >
          {explicando ? "A Lia está preparando…" : "💬 Lia, explique de um jeito simples"}
        </button>
      </div>
    </article>
  );
}
