/*
 * Voz da Lia: fala em português do Brasil com a voz do próprio navegador
 * (Web Speech API) e escuta a dúvida da pessoa quando o navegador permite.
 */

let vozPt: SpeechSynthesisVoice | null = null;

function escolherVoz() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const vozes = window.speechSynthesis.getVoices();
  const br = vozes.filter((v) => /^pt[-_]BR/i.test(v.lang));
  vozPt =
    br.find((v) => /google|luciana|francisca|thalita|maria|natural/i.test(v.name)) ??
    br[0] ??
    vozes.find((v) => /^pt/i.test(v.lang)) ??
    null;
}

let iniciada = false;
function iniciar() {
  if (iniciada || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  iniciada = true;
  escolherVoz();
  window.speechSynthesis.addEventListener("voiceschanged", escolherVoz);
}

let geracao = 0;

/** Fala o texto. Chama aoTerminar quando a última frase acaba (ou logo, se não houver voz). */
export function falarTexto(
  texto: string,
  velocidade: number,
  aoComecar: () => void,
  aoTerminar: () => void,
) {
  const minha = ++geracao;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    aoComecar();
    setTimeout(() => minha === geracao && aoTerminar(), Math.max(1500, texto.length * 60));
    return;
  }
  iniciar();
  const voz = window.speechSynthesis;
  voz.cancel();
  // Frases curtas, uma de cada vez: o Chrome corta falas muito longas.
  const frases = (texto.match(/[^.!?]+[.!?]*/g) ?? [texto]).map((f) => f.trim()).filter(Boolean);
  // Segurança: se o navegador não avisar o fim, a boca para sozinha.
  const trava = setTimeout(
    () => minha === geracao && aoTerminar(),
    Math.max(2500, (texto.length * 110) / velocidade),
  );
  aoComecar();
  frases.forEach((frase, i) => {
    const u = new SpeechSynthesisUtterance(frase);
    u.lang = "pt-BR";
    if (vozPt) u.voice = vozPt;
    u.rate = velocidade;
    u.onend = u.onerror = () => {
      if (minha === geracao && i === frases.length - 1) {
        clearTimeout(trava);
        aoTerminar();
      }
    };
    voz.speak(u);
  });
}

export function calarVoz() {
  geracao++;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/* ---------------------------------------------------------- */
/* Escutar (ditado da dúvida)                                  */
/* ---------------------------------------------------------- */
type Reconhecedor = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function construtor(): (new () => Reconhecedor) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    ((w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as
      (new () => Reconhecedor) | undefined) ?? null
  );
}

export const podeEscutar = () => construtor() !== null;

export function escutar(aoOuvir: (texto: string) => void, aoTerminar: () => void): () => void {
  const R = construtor();
  if (!R) {
    aoTerminar();
    return () => {};
  }
  const r = new R();
  r.lang = "pt-BR";
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    const t = e.results[0]?.[0]?.transcript ?? "";
    if (t) aoOuvir(t);
  };
  r.onerror = () => aoTerminar();
  r.onend = () => aoTerminar();
  calarVoz();
  r.start();
  return () => r.stop();
}
