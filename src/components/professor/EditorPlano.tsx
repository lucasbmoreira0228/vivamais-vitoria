import type { Etapa, PlanoAula } from "@/lib/lia-professora";
import type { MelhoriaPlano } from "@/lib/lia.functions";
import { useLia } from "@/components/lia/Lia";

const caixa =
  "mt-2 w-full rounded-xl border-2 bg-card px-4 py-3 text-lg outline-none focus:border-primary";
const linhas = (t: string) =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Junta o que a IA sugeriu com o plano da Lia (só troca o que veio certo). */
export function aplicarMelhoria(plano: PlanoAula, m: MelhoriaPlano): PlanoAula {
  const novo: PlanoAula = { ...plano };
  if (m.objetivo) novo.objetivo = m.objetivo;
  if (m.materiais?.length) novo.materiais = m.materiais;
  if (m.etapas?.length) novo.etapas = m.etapas;
  if (m.atividade) novo.atividade = m.atividade;
  if (m.dicasTurma?.length) novo.dicasTurma = m.dicasTurma;
  if (m.resumoAluno) novo.resumoAluno = m.resumoAluno;
  if (m.palavrasNovas?.length) novo.palavrasNovas = m.palavrasNovas;
  return novo;
}

export function EditorPlano({
  plano,
  completados,
  aoMudar,
}: {
  plano: PlanoAula;
  completados: string[];
  aoMudar: (p: PlanoAula) => void;
}) {
  const lia = useLia();
  const total = plano.etapas.reduce((s, e) => s + (Number(e.minutos) || 0), 0);
  const mudar = (p: Partial<PlanoAula>) => aoMudar({ ...plano, ...p });
  const mudarEtapa = (i: number, e: Partial<Etapa>) =>
    mudar({ etapas: plano.etapas.map((x, j) => (j === i ? { ...x, ...e } : x)) });

  return (
    <div className="space-y-8" data-lia="plano-aula">
      {completados.length > 0 && (
        <div
          className="rounded-2xl border-2 border-[#8A5A00] bg-[#FFF4D6] p-6 text-[#4A3000]"
          role="note"
        >
          <p className="text-xl font-bold">A Lia completou o que faltou. Confira:</p>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-lg">
            {completados.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-3 text-lg">Você pode mudar qualquer coisa abaixo. A aula é sua!</p>
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          lia.falar(
            `Passo a passo da aula ${plano.tema}. ${plano.etapas.map((e, i) => `Parte ${i + 1}, ${e.titulo}, ${e.minutos} minutos: ${e.descricao}`).join(" ")}`,
          )
        }
        className="min-h-14 rounded-full bg-secondary px-6 text-lg font-bold text-secondary-foreground"
      >
        🔊 Ouvir o passo a passo
      </button>

      <label className="block text-lg font-bold">
        Objetivo: o que o aluno vai saber fazer no fim
        <textarea
          rows={2}
          value={plano.objetivo}
          onChange={(e) => mudar({ objetivo: e.target.value })}
          className={`${caixa} resize-y font-normal`}
        />
      </label>

      <fieldset>
        <legend className="text-lg font-bold">
          Passo a passo da aula{" "}
          <span className={total === plano.duracaoMin ? "text-muted-foreground" : "text-highlight"}>
            ({total} de {plano.duracaoMin} minutos)
          </span>
        </legend>
        <ol className="mt-3 space-y-4">
          {plano.etapas.map((e, i) => (
            <li key={i} className="rounded-2xl border-2 bg-muted p-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <label className="block font-bold">
                  Parte {i + 1}
                  <input
                    value={e.titulo}
                    onChange={(ev) => mudarEtapa(i, { titulo: ev.target.value })}
                    className={caixa}
                  />
                </label>
                <label className="block font-bold">
                  Minutos
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={e.minutos}
                    onChange={(ev) => mudarEtapa(i, { minutos: Number(ev.target.value) || 0 })}
                    className={caixa}
                  />
                </label>
              </div>
              <label className="mt-3 block font-bold">
                O que fazer
                <textarea
                  rows={3}
                  value={e.descricao}
                  onChange={(ev) => mudarEtapa(i, { descricao: ev.target.value })}
                  className={`${caixa} resize-y font-normal`}
                />
              </label>
              <button
                type="button"
                onClick={() => mudar({ etapas: plano.etapas.filter((_, j) => j !== i) })}
                className="mt-2 font-bold text-primary underline underline-offset-4"
              >
                Tirar esta parte
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() =>
            mudar({
              etapas: [...plano.etapas, { titulo: "Nova parte", minutos: 10, descricao: "" }],
            })
          }
          className="mt-3 min-h-12 rounded-full border-2 border-foreground px-5 font-bold"
        >
          + Acrescentar uma parte
        </button>
      </fieldset>

      <label className="block text-lg font-bold">
        Material que a Prefeitura vai fornecer (um por linha)
        <textarea
          rows={4}
          value={plano.materiais.join("\n")}
          onChange={(e) => mudar({ materiais: linhas(e.target.value) })}
          className={`${caixa} resize-y font-normal`}
        />
      </label>

      <label className="block text-lg font-bold">
        Atividade prática
        <textarea
          rows={3}
          value={plano.atividade}
          onChange={(e) => mudar({ atividade: e.target.value })}
          className={`${caixa} resize-y font-normal`}
        />
      </label>

      <label className="block text-lg font-bold">
        Cuidados com a turma (um por linha)
        <textarea
          rows={5}
          value={plano.dicasTurma.join("\n")}
          onChange={(e) => mudar({ dicasTurma: linhas(e.target.value) })}
          className={`${caixa} resize-y font-normal`}
        />
      </label>

      <label className="block text-lg font-bold">
        Explicação para o aluno (é isto que o aluno vê e a Lia lê para ele)
        <textarea
          rows={4}
          value={plano.resumoAluno}
          onChange={(e) => mudar({ resumoAluno: e.target.value })}
          className={`${caixa} resize-y font-normal`}
        />
      </label>

      <label className="block text-lg font-bold">
        Palavras novas (uma por linha, assim: palavra: o que quer dizer)
        <textarea
          rows={3}
          value={plano.palavrasNovas.map((p) => `${p.termo}: ${p.significado}`).join("\n")}
          onChange={(e) =>
            mudar({
              palavrasNovas: linhas(e.target.value).map((l) => {
                const [termo, ...resto] = l.split(":");
                return { termo: (termo ?? "").trim(), significado: resto.join(":").trim() };
              }),
            })
          }
          className={`${caixa} resize-y font-normal`}
        />
      </label>
    </div>
  );
}
