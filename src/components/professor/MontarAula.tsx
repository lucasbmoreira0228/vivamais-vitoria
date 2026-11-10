import { useState } from "react";
import { useLia } from "@/components/lia/Lia";
import { gerarPlanoAula, type DadosCurso, type PlanoAula } from "@/lib/lia-professora";
import { melhorarPlanoComIA } from "@/lib/lia.functions";
import { EditorPlano, aplicarMelhoria } from "./EditorPlano";

const caixa =
  "mt-2 w-full rounded-xl border-2 bg-card px-4 py-3 text-lg font-normal outline-none focus:border-primary";

export type AulaMontada = { plano: PlanoAula; completados: string[] } | null;

/** O professor escreve o tema (e o que mais quiser) e a Lia monta o passo a passo da aula. */
export function MontarAula({
  curso,
  numero,
  valor,
  aoMudar,
}: {
  curso: DadosCurso;
  numero: number;
  valor: AulaMontada;
  aoMudar: (v: AulaMontada) => void;
}) {
  const lia = useLia();
  const [tema, setTema] = useState(valor?.plano.tema ?? "");
  const [objetivo, setObjetivo] = useState("");
  const [materiais, setMateriais] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [pensando, setPensando] = useState(false);

  async function montar() {
    if (tema.trim().length < 3) {
      lia.falar(
        "Escreva primeiro o tema da aula. Pode ser bem curto, por exemplo: mandar áudio no WhatsApp.",
        "alerta",
      );
      return;
    }
    const base = gerarPlanoAula(
      curso,
      {
        tema,
        objetivo,
        materiais: materiais.split("\n"),
        observacoes,
        ...(curso.duracaoMin ? { duracaoMin: curso.duracaoMin } : {}),
      },
      numero,
    );
    aoMudar(base);
    setPensando(true);
    lia.abrir();
    lia.falar("Montei o passo a passo da aula. Agora estou caprichando nos detalhes, um momento…");
    let melhorou = false;
    try {
      const r = await melhorarPlanoComIA({
        data: {
          curso: {
            titulo: curso.titulo,
            categoria: String(curso.categoria),
            descricao: curso.descricao ?? "",
            local: curso.local ?? "",
          },
          aula: {
            numero,
            tema,
            observacoes: [objetivo, materiais, observacoes].filter(Boolean).join("\n"),
            duracaoMin: base.plano.duracaoMin,
          },
          rascunho: JSON.stringify(base.plano),
        },
      });
      if (r.ok) {
        aoMudar({ plano: aplicarMelhoria(base.plano, r.melhoria), completados: base.completados });
        melhorou = true;
      }
    } catch {
      /* sem IA: fica o plano da Lia */
    }
    setPensando(false);
    lia.falar(
      `Pronto! A aula tem ${base.plano.etapas.length} partes. ${melhorou ? "Usei também a minha experiência de professora para melhorar os textos. " : ""} ${
        base.completados.length
          ? "Eu completei algumas coisas que faltavam. Elas estão no quadro amarelo. "
          : ""
      }Confira e mude o que quiser.`,
    );
  }

  return (
    <div className="space-y-6">
      <label className="block text-lg font-bold">
        Tema da aula {numero}
        <input
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Ex.: Mandar mensagem e áudio no WhatsApp"
          className={caixa}
          data-lia="campo-tema"
        />
      </label>
      <label className="block text-lg font-bold">
        Conte do seu jeito o que você quer ensinar (opcional)
        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex.: Quero que eles aprendam a gravar áudio e mandar foto para os netos."
          className={`${caixa} resize-y`}
          data-lia="campo-observacoes"
        />
      </label>
      <details className="rounded-2xl border-2 p-5">
        <summary className="cursor-pointer text-lg font-bold">
          Quero escrever o objetivo e os materiais (opcional)
        </summary>
        <label className="mt-4 block text-lg font-bold">
          Objetivo da aula
          <textarea
            rows={2}
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            className={`${caixa} resize-y`}
          />
        </label>
        <label className="mt-4 block text-lg font-bold">
          Materiais (um por linha)
          <textarea
            rows={3}
            value={materiais}
            onChange={(e) => setMateriais(e.target.value)}
            className={`${caixa} resize-y`}
          />
        </label>
      </details>
      <button
        type="button"
        onClick={() => void montar()}
        disabled={pensando}
        className="min-h-16 w-full rounded-full bg-highlight px-6 text-xl font-bold text-highlight-foreground disabled:opacity-60"
        data-lia="botao-montar-aula"
      >
        {pensando
          ? "A Lia está caprichando…"
          : valor
            ? "Lia, monte de novo"
            : "✨ Lia, monte o passo a passo da aula"}
      </button>

      {valor && (
        <EditorPlano
          plano={valor.plano}
          completados={valor.completados}
          aoMudar={(p) => aoMudar({ ...valor, plano: p })}
        />
      )}
    </div>
  );
}
