/*
 * Lia com IA (gateway de IA do Lovable)
 * ------------------------------------------------------------
 * Roda só no servidor: a chave LOVABLE_API_KEY nunca vai para o navegador.
 * Se a IA não estiver ligada no projeto (ou falhar), as funções devolvem
 * { ok: false } e a Lia usa o que sabe sozinha (src/lib/lia-professora.ts).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODELO = "google/gemini-2.5-flash";

const PERSONA =
  "Você é a Lia, assistente da plataforma Viva+Vitória: cursos presenciais para pessoas com mais de 50 anos em Vitória - ES. " +
  "Você é uma professora experiente, calma e gentil. Fale em português do Brasil, com frases curtas, verbo no começo e sem palavras técnicas ou em inglês. " +
  "Nunca peça senha, CPF ou dados de banco. Se não souber algo da plataforma, diga que não sabe e sugira pedir ajuda ao professor do curso.";

type Mensagem = { role: "system" | "user"; content: string };

async function chamarIA(mensagens: Mensagem[], json: boolean): Promise<string | null> {
  const chave = process.env["LOVABLE_API_KEY"];
  if (!chave) return null;
  try {
    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELO,
        messages: mensagens,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!resp.ok) {
      console.error("[Lia] IA respondeu", resp.status);
      return null;
    }
    const dados = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    return dados.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("[Lia] IA indisponível", e);
    return null;
  }
}

/* ---------------------------------------------------------- */
/* Tirar uma dúvida                                            */
/* ---------------------------------------------------------- */
export const perguntarLia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pergunta: z.string().trim().min(2).max(600),
      papel: z.enum(["aluno", "professor", "visitante"]),
      pagina: z.string().max(120),
      contexto: z.string().max(6000),
    }),
  )
  .handler(async ({ data }) => {
    const quem =
      data.papel === "professor"
        ? "Quem pergunta é um professor idoso montando o curso ou a aula. Ajude como uma colega professora: dê o passo a passo e complete o que faltar."
        : "Quem pergunta é uma pessoa idosa que quer achar, entender ou se inscrever num curso, ou usar o site. Explique como para um amigo, em no máximo 5 frases.";
    const resposta = await chamarIA(
      [
        { role: "system", content: `${PERSONA} ${quem}` },
        {
          role: "user",
          content: `Página aberta: ${data.pagina}\n\nO que aparece na página:\n${data.contexto}\n\nPergunta: ${data.pergunta}`,
        },
      ],
      false,
    );
    return resposta ? { ok: true as const, resposta } : { ok: false as const, resposta: "" };
  });

/* ---------------------------------------------------------- */
/* Melhorar o plano de aula                                    */
/* ---------------------------------------------------------- */
const esquemaPlano = z.object({
  objetivo: z.string().min(5).max(500).optional(),
  materiais: z.array(z.string().min(2).max(160)).max(12).optional(),
  etapas: z
    .array(
      z.object({
        titulo: z.string().min(2).max(80),
        minutos: z.number().int().min(1).max(240),
        descricao: z.string().min(5).max(700),
      }),
    )
    .min(3)
    .max(9)
    .optional(),
  atividade: z.string().min(5).max(700).optional(),
  dicasTurma: z.array(z.string().min(5).max(240)).max(10).optional(),
  resumoAluno: z.string().min(10).max(900).optional(),
  palavrasNovas: z
    .array(z.object({ termo: z.string().min(1).max(60), significado: z.string().min(3).max(200) }))
    .max(8)
    .optional(),
});

export type MelhoriaPlano = z.infer<typeof esquemaPlano>;

export const melhorarPlanoComIA = createServerFn({ method: "POST" })
  .validator(
    z.object({
      curso: z.object({
        titulo: z.string().max(160),
        categoria: z.string().max(60),
        descricao: z.string().max(1500),
        local: z.string().max(160),
      }),
      aula: z.object({
        numero: z.number().int().min(1).max(100),
        tema: z.string().max(200),
        observacoes: z.string().max(1500),
        duracaoMin: z.number().int().min(30).max(240),
      }),
      rascunho: z.string().max(8000),
    }),
  )
  .handler(async ({ data }) => {
    const texto = await chamarIA(
      [
        {
          role: "system",
          content:
            `${PERSONA} Agora você ajuda um professor idoso a montar o passo a passo de uma aula presencial para turma 50+. ` +
            "Complete o que o professor não escreveu, com ideias práticas e seguras. A soma dos minutos das etapas deve ser igual à duração da aula. " +
            'Responda só com JSON: {"objetivo": string, "materiais": string[], "etapas": [{"titulo": string, "minutos": number, "descricao": string}], ' +
            '"atividade": string, "dicasTurma": string[], "resumoAluno": string (explicação para o aluno, simples, 3 a 5 frases), "palavrasNovas": [{"termo": string, "significado": string}]}',
        },
        {
          role: "user",
          content:
            `Curso: ${data.curso.titulo} (${data.curso.categoria}), em ${data.curso.local || "Vitória"}.\n` +
            `Sobre o curso: ${data.curso.descricao}\n` +
            `Aula ${data.aula.numero}: ${data.aula.tema}. Duração: ${data.aula.duracaoMin} minutos.\n` +
            `O que o professor escreveu: ${data.aula.observacoes || "(nada)"}\n\n` +
            `Rascunho atual da Lia (melhore e complete):\n${data.rascunho}`,
        },
      ],
      true,
    );
    if (!texto) return { ok: false as const };
    try {
      const limpo = texto.replace(/^```(?:json)?\s*|\s*```$/g, "");
      const r = esquemaPlano.safeParse(JSON.parse(limpo));
      if (!r.success) return { ok: false as const };
      const etapas = r.data.etapas;
      // Só aceita as etapas se o tempo bater com a aula (folga de 10 minutos).
      if (etapas && Math.abs(etapas.reduce((s, e) => s + e.minutos, 0) - data.aula.duracaoMin) > 10)
        delete r.data.etapas;
      return { ok: true as const, melhoria: r.data };
    } catch {
      return { ok: false as const };
    }
  });
