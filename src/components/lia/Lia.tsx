/*
 * Lia — assistente da plataforma Viva+Vitória
 * ------------------------------------------------------------
 * Versão da Lia do Guia+ feita para dentro da plataforma:
 *   - botão flutuante e painel com balão de fala, em todas as páginas
 *   - voz em português, com a boca mexendo
 *   - roteiros guiados de cada página (anel, seta e tela escurecida)
 *   - Conhecer esta página, Ler esta página, Tirar uma dúvida
 *   - Letra grande, Ouvir ao tocar, velocidade da voz
 *   - aviso de segurança ao tocar num campo de senha
 *
 * Cada página conta para a Lia o que ela pode ensinar ali com
 * useLiaPagina({ nome, roteiros, acoes, contexto }). Os elementos
 * que a Lia destaca têm o atributo data-lia="nome-do-alvo".
 */
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { LiaAvatar } from "./LiaAvatar";
import { calarVoz, escutar, falarTexto, podeEscutar } from "./voz";
import { perguntarLia } from "@/lib/lia.functions";

/* ---------------------------------------------------------- */
/* Tipos                                                       */
/* ---------------------------------------------------------- */
export type PassoLia = {
  /** valor do atributo data-lia do elemento a destacar; sem alvo, a Lia só fala */
  alvo?: string | undefined;
  fala: string;
  /** true: avança sozinho quando a pessoa clica no elemento */
  esperarClique?: boolean;
};
export type RoteiroLia = { id: string; tarefa: string; passos: PassoLia[] };
export type AcaoLia = { id: string; titulo: string; detalhe?: string; executar: () => void };
export type PaginaLia = {
  nome: string;
  papel?: "aluno" | "professor" | "visitante";
  saudacao?: string | undefined;
  roteiros?: RoteiroLia[];
  acoes?: AcaoLia[];
  /** texto extra que a Lia usa para responder dúvidas sobre esta página */
  contexto?: () => string;
};
type TipoFala = "" | "alerta" | "perigo";

type LiaApi = {
  falar: (texto: string, tipo?: TipoFala) => void;
  abrir: () => void;
  /** abre o painel e a Lia se apresenta */
  saudar: () => void;
  iniciarRoteiro: (r: RoteiroLia) => void;
  perguntar: () => void;
  registrar: (p: RefObject<PaginaLia>) => () => void;
};

const LiaContexto = createContext<LiaApi | null>(null);

export function useLia(): LiaApi {
  const api = useContext(LiaContexto);
  if (!api) throw new Error("useLia precisa estar dentro de <LiaProvider>");
  return api;
}

/** Cada página chama isto para dizer à Lia o que ela pode ensinar ali. */
export function useLiaPagina(pagina: PaginaLia) {
  const { registrar } = useLia();
  const ref = useRef(pagina);
  ref.current = pagina;
  useEffect(() => registrar(ref), [registrar]);
}

/* ---------------------------------------------------------- */
/* Preferências                                                */
/* ---------------------------------------------------------- */
type Prefs = { velocidade: number; letraGrande: boolean; ouvirAoTocar: boolean };
const PADRAO: Prefs = { velocidade: 1, letraGrande: false, ouvirAoTocar: false };
const CHAVE_PREFS = "vivamais.lia.prefs";
const VELOCIDADES = [
  { v: 0.8, nome: "devagar" },
  { v: 1, nome: "normal" },
  { v: 1.2, nome: "rápida" },
];

function lerPrefs(): Prefs {
  try {
    return {
      ...PADRAO,
      ...(JSON.parse(localStorage.getItem(CHAVE_PREFS) ?? "{}") as Partial<Prefs>),
    };
  } catch {
    return PADRAO;
  }
}

/* ---------------------------------------------------------- */
/* Ajudantes de página                                         */
/* ---------------------------------------------------------- */
const limpar = (t?: string | null) =>
  String(t ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

function visivel(el: Element): boolean {
  if (!el.isConnected) return false;
  const h = el as HTMLElement & { checkVisibility?: (o?: object) => boolean };
  if (h.checkVisibility && !h.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
    return false;
  const r = el.getBoundingClientRect();
  return r.width >= 4 && r.height >= 4;
}

function textoDe(el: Element): string {
  const h = el as HTMLInputElement;
  const candidatos = [
    el.getAttribute("aria-label"),
    h.labels?.[0]?.innerText,
    el.getAttribute("placeholder"),
    el.getAttribute("alt"),
    (el as HTMLElement).innerText,
    el.getAttribute("title"),
  ];
  for (const c of candidatos) if (limpar(c)) return limpar(c);
  return "";
}

function descrever(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const tipo = (el.getAttribute("type") ?? "").toLowerCase();
  const nome = textoDe(el).replace(/[.!?:;,]+$/, "");
  const doMenu = !!el.closest("nav, header");
  if (tag === "input" && tipo === "password")
    return "Este é o campo da senha. Digite com cuidado e não mostre a senha para ninguém.";
  if (tag === "input" && tipo === "search")
    return "Este é o campo de busca. Escreva aqui o que você procura.";
  if (tag === "input" && /^(checkbox|radio)$/.test(tipo))
    return `Esta é uma opção para marcar: ${nome}.`;
  if (tag === "input" || tag === "textarea")
    return nome ? `Este é um campo para escrever: ${nome}.` : "Este é um campo para escrever.";
  if (tag === "select")
    return `Esta é uma lista de opções${nome ? ": " + nome : ""}. Toque nela para escolher.`;
  if (tag === "a" && doMenu)
    return `Este é um item do menu: ${nome}. Ele leva você para outra parte do site.`;
  if (tag === "a") return `Este é um link: ${nome}. Ele abre outra página.`;
  if (
    tag === "button" ||
    el.getAttribute("role") === "button" ||
    el.getAttribute("role") === "radio"
  )
    return nome ? `Este é o botão ${nome}.` : "Este é um botão.";
  if (tag === "h1") return `Este é o título da página: ${nome}.`;
  if (/^h[2-6]$/.test(tag)) return `Este é o título de uma parte da página: ${nome}.`;
  if (tag === "img") return nome ? `Esta é uma imagem: ${nome}.` : "Esta é uma imagem.";
  return nome ? `Aqui está escrito: ${nome}` : "Não encontrei texto nesta parte.";
}

const SELETOR_CLICAVEL =
  "a[href], button, [role=button], [role=radio], input, select, textarea, summary";
const SELETOR_LEGIVEL = `${SELETOR_CLICAVEL}, label, h1, h2, h3, h4, li, p, img, dt, dd, span`;

function textoPrincipal(): string {
  const main = document.querySelector("main") ?? document.body;
  const h1 = main.querySelector("h1");
  const paragrafos = Array.from(main.querySelectorAll("p"))
    .filter((p) => !p.closest("[data-lia-ui]") && visivel(p))
    .map((p) => p.innerText.replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 20)
    .slice(0, 3)
    .join(" ");
  return [h1 ? limpar(h1.innerText) : limpar(document.title), paragrafos]
    .filter(Boolean)
    .join(". ");
}

/* Respostas que a Lia sabe sem internet. */
function respostaLocal(pergunta: string): string {
  const p = pergunta.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/senha|esqueci/.test(p))
    return "Na página Entrar, toque em Esqueci minha senha. Vamos mandar um e-mail para você criar uma senha nova. E lembre: nunca conte a sua senha para ninguém.";
  if (/inscrev|matricul|participar|vaga/.test(p))
    return "Para se inscrever, abra Cursos e toque no curso que você quer. Depois, toque no botão Quero me inscrever. Você precisa estar com a sua conta aberta.";
  if (/cadastr|criar conta|conta nova/.test(p))
    return "Toque em Cadastre-se, no alto da página. Escolha se quer aprender ou ensinar, preencha seu nome, telefone, e-mail e crie uma senha. Eu posso mostrar cada campo para você.";
  if (/entrar|login|acessar/.test(p))
    return "Toque em Entrar, no alto da página. Escreva o seu e-mail e a sua senha e toque no botão Entrar.";
  if (/professor|ensinar|criar curso|montar|plano|aula nova/.test(p))
    return "Abra Para professores, no alto da página. Eu ajudo você a criar o curso em 4 etapas e monto o passo a passo de cada aula. O que faltar, eu completo e você confere.";
  if (/material|aula|entender|apostila/.test(p))
    return "Abra o curso e desça até a parte Aulas. Em cada aula, toque em Ler esta aula para mim e eu leio tudo, devagar.";
  if (/onde|endereco|local|horario|dia|quando/.test(p))
    return "Cada curso mostra o bairro, o endereço, o dia e o horário. Abra Cursos e toque no curso para ver tudo.";
  if (/golpe|pix|codigo|banco/.test(p))
    return "Cuidado! A Viva+Vitória nunca pede PIX, código de mensagem ou senha de banco. Se alguém pedir, não responda e fale com alguém de confiança.";
  return "Ainda não sei responder isso. Toque em Ler esta página, ou pergunte ao professor do curso. Ele vai gostar de ajudar.";
}

/* ---------------------------------------------------------- */
/* Ícones simples                                              */
/* ---------------------------------------------------------- */
const ICONES: Record<string, string> = {
  repetir: '<path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 3v5h5" />',
  voz: '<path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />',
  letra: '<path d="M3 19l5-14 5 14M5 14h6" /><path d="M18 8v8M14 12h8" />',
  tocar:
    '<path d="M9 11V5a2 2 0 0 1 4 0v6" /><path d="M13 10a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3.4-2L9 14" />',
  seguir: '<path d="M5 12h14M13 6l6 6-6 6" />',
  bussola: '<circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" />',
  ler: '<path d="M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z" /><path d="M20 5h-4a2 2 0 0 0-2 2" /><path d="M20 5v13h-6" />',
  duvida:
    '<circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" />',
  fechar: '<path d="M6 6l12 12M18 6L6 18" />',
  estrela: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />',
  casa: '<path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" />',
  microfone:
    '<rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />',
};
function Icone({ nome, className = "h-7 w-7" }: { nome: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${className}`}
      dangerouslySetInnerHTML={{ __html: ICONES[nome] ?? "" }}
    />
  );
}

/* ---------------------------------------------------------- */
/* Provider: estado, lógica e interface                        */
/* ---------------------------------------------------------- */
type Destaque = { left: number; top: number; width: number; height: number } | null;

export function LiaProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [aberto, setAberto] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [modo, setModo] = useState<"menu" | "roteiro" | "pergunta">("menu");
  const [balao, setBalao] = useState<{ texto: string; tipo: TipoFala }>({
    texto: "Olá! Eu sou a Lia.",
    tipo: "",
  });
  const [falando, setFalando] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(PADRAO);
  const [roteiro, setRoteiro] = useState<{ rot: RoteiroLia; passo: number } | null>(null);
  const [destaque, setDestaque] = useState<Destaque>(null);
  const [aEsquerda, setAEsquerda] = useState(false);
  const [versaoPagina, setVersaoPagina] = useState(0);
  const [pergunta, setPergunta] = useState("");
  const [pensando, setPensando] = useState(false);
  const [escutando, setEscutando] = useState(false);

  const paginaRef = useRef<RefObject<PaginaLia> | null>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLElement>(null);
  const lancadorRef = useRef<HTMLButtonElement>(null);
  const alvoRef = useRef<Element | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const roteiroRef = useRef(roteiro);
  roteiroRef.current = roteiro;
  const ultimaFala = useRef<{ texto: string; tipo: TipoFala }>({ texto: "", tipo: "" });
  const pararEscuta = useRef<() => void>(() => {});

  const pagina = (): PaginaLia | null => paginaRef.current?.current ?? null;

  // Em telas largas, a página abre espaço ao lado para o painel não cobrir nada.
  useEffect(() => {
    document.documentElement.classList.toggle("lia-aberta", aberto && !minimizado);
    if (!aberto) setMinimizado(false);
  }, [aberto, minimizado]);

  /* ---------- preferências ---------- */
  useEffect(() => setPrefs(lerPrefs()), []);
  useEffect(() => {
    document.documentElement.classList.toggle("lia-letra-grande", prefs.letraGrande);
  }, [prefs.letraGrande]);
  const mudarPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefs((atual) => {
      const novo = { ...atual, ...p };
      try {
        localStorage.setItem(CHAVE_PREFS, JSON.stringify(novo));
      } catch {
        /* sem armazenamento */
      }
      return novo;
    });
  }, []);

  /* ---------- fala ---------- */
  const falar = useCallback((texto: string, tipo: TipoFala = "") => {
    ultimaFala.current = { texto, tipo };
    setBalao({ texto, tipo });
    falarTexto(
      texto,
      prefsRef.current.velocidade,
      () => setFalando(true),
      () => setFalando(false),
    );
  }, []);
  const calar = useCallback(() => {
    calarVoz();
    setFalando(false);
  }, []);

  /* ---------- destaque ---------- */
  const destacar = useCallback((el: Element | null) => {
    alvoRef.current = el;
    if (!el) {
      setDestaque(null);
      setAEsquerda(false);
      return;
    }
    try {
      el.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center",
      });
    } catch {
      el.scrollIntoView();
    }
  }, []);

  useEffect(() => {
    const posicionar = () => {
      const el = alvoRef.current;
      if (!el) return;
      if (!visivel(el)) return setDestaque(null);
      const r = el.getBoundingClientRect();
      setDestaque((d) =>
        d && d.left === r.left && d.top === r.top && d.width === r.width && d.height === r.height
          ? d
          : { left: r.left, top: r.top, width: r.width, height: r.height },
      );
      const p = painelRef.current?.getBoundingClientRect();
      if (p) {
        const cobre = r.left < p.right && r.right > p.left && r.top < p.bottom && r.bottom > p.top;
        if (cobre) setAEsquerda(r.left + r.width / 2 > window.innerWidth / 2);
      }
    };
    const vigia = setInterval(posicionar, 200);
    window.addEventListener("scroll", posicionar, true);
    window.addEventListener("resize", posicionar);
    return () => {
      clearInterval(vigia);
      window.removeEventListener("scroll", posicionar, true);
      window.removeEventListener("resize", posicionar);
    };
  }, []);

  /* ---------- abrir e fechar ---------- */
  const abrir = useCallback(() => {
    setAberto(true);
    setMinimizado(false);
  }, []);

  const encerrarRoteiro = useCallback(
    (silencioso: boolean) => {
      const tinha = !!roteiroRef.current;
      setRoteiro(null);
      setModo("menu");
      destacar(null);
      if (!silencioso && tinha) falar("Terminamos! Se precisar, é só me chamar de novo.");
    },
    [destacar, falar],
  );

  const fechar = useCallback(() => {
    calar();
    pararEscuta.current();
    encerrarRoteiro(true);
    setAberto(false);
    setModo("menu");
    setTimeout(() => lancadorRef.current?.focus(), 0);
  }, [calar, encerrarRoteiro]);

  const saudar = useCallback(() => {
    setAberto(true);
    setModo("menu");
    const p = pagina();
    falar(
      p?.saudacao ??
        (p?.roteiros?.length
          ? `Olá! Eu sou a Lia. Você está em: ${p.nome}. Posso ensinar você a usar esta página. Escolha uma opção abaixo.`
          : "Olá! Eu sou a Lia. Escolha abaixo como posso ajudar."),
    );
  }, [falar]);

  /* ---------- roteiros ---------- */
  const iniciarRoteiro = useCallback((rot: RoteiroLia) => {
    setAberto(true);
    setModo("roteiro");
    setRoteiro({ rot, passo: 0 });
  }, []);

  useEffect(() => {
    if (!roteiro) return;
    const { rot, passo } = roteiro;
    const p = rot.passos[passo];
    if (!p) return;
    let vivo = true;
    let ouvinte: ((e: MouseEvent) => void) | null = null;
    let espera: ReturnType<typeof setTimeout> | undefined;

    const mostrar = (el: Element | null) => {
      if (!vivo) return;
      destacar(el);
      falar(p.fala);
      if (el && p.esperarClique) {
        ouvinte = (e) => {
          if (e.target instanceof Node && el.contains(e.target)) {
            document.removeEventListener("click", ouvinte!, true);
            ouvinte = null;
            espera = setTimeout(() => {
              if (!vivo) return;
              setRoteiro((r) =>
                r && r.rot === rot && r.passo === passo
                  ? passo >= rot.passos.length - 1
                    ? null
                    : { rot, passo: passo + 1 }
                  : r,
              );
            }, 600);
          }
        };
        document.addEventListener("click", ouvinte, true);
      }
    };

    if (!p.alvo) {
      mostrar(null);
    } else {
      const inicio = Date.now();
      const aviso = setTimeout(
        () => vivo && setBalao({ texto: "Um momento, estou procurando na tela…", tipo: "" }),
        900,
      );
      const procurar = () => {
        if (!vivo) return;
        const el =
          Array.from(document.querySelectorAll(`[data-lia="${p.alvo}"]`)).find(visivel) ?? null;
        if (el) {
          clearTimeout(aviso);
          return mostrar(el);
        }
        if (Date.now() - inicio > 6000) {
          clearTimeout(aviso);
          destacar(null);
          return falar(
            "Não encontrei essa parte na tela. Se a página mudou, toque em Voltar. Ou toque em Repetir para eu procurar de novo.",
          );
        }
        espera = setTimeout(procurar, 250);
      };
      procurar();
    }
    return () => {
      vivo = false;
      clearTimeout(espera);
      if (ouvinte) document.removeEventListener("click", ouvinte, true);
    };
  }, [roteiro, destacar, falar]);

  // Se o roteiro acabou por clique no último passo
  useEffect(() => {
    if (!roteiro && modo === "roteiro") {
      setModo("menu");
      destacar(null);
      falar("Muito bem, você conseguiu! Se precisar, é só me chamar de novo.");
    }
  }, [roteiro, modo, destacar, falar]);

  const avancar = () => {
    if (!roteiro) return;
    if (roteiro.passo >= roteiro.rot.passos.length - 1) return encerrarRoteiro(false);
    setRoteiro({ ...roteiro, passo: roteiro.passo + 1 });
  };
  const voltar = () => setRoteiro((r) => (r && r.passo > 0 ? { ...r, passo: r.passo - 1 } : r));

  /* ---------- conhecer e ler a página ---------- */
  const conhecerPagina = useCallback(() => {
    const ok = (el: Element) =>
      !el.closest("[data-lia-ui]") &&
      !el.closest("[aria-hidden=true]") &&
      visivel(el) &&
      !!textoDe(el);
    const pegar = (s: string, max: number) =>
      Array.from(document.querySelectorAll(s)).filter(ok).slice(0, max);
    const grupos = [
      pegar("main h1", 1),
      pegar("header nav a[href]", 3),
      pegar("main input:not([type=hidden]), main select, main textarea", 3),
      pegar("main button, main a[href]", 3),
      pegar("main h2", 2),
    ];
    const escolhidos: Element[] = [];
    const vistos = new Set<string>();
    let mudou = true;
    while (escolhidos.length < 8 && mudou) {
      mudou = false;
      for (const g of grupos) {
        while (g.length) {
          const el = g.shift()!;
          const chave = textoDe(el).toLowerCase();
          if (vistos.has(chave)) continue;
          escolhidos.push(el);
          vistos.add(chave);
          mudou = true;
          break;
        }
        if (escolhidos.length >= 8) break;
      }
    }
    escolhidos.sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
    if (!escolhidos.length) return falar("Não encontrei botões nem campos nesta parte da página.");
    // Marca cada parte para o roteiro achar.
    const alvos = escolhidos.map((el, i) => {
      const atual = el.getAttribute("data-lia");
      if (atual) return atual;
      el.setAttribute("data-lia", `tour-${i}`);
      return `tour-${i}`;
    });
    const titulo = pagina()?.nome ?? limpar(document.title);
    iniciarRoteiro({
      id: "conhecer",
      tarefa: "Conhecer esta página",
      passos: [
        {
          fala: `Você está na página: ${titulo}. Vou mostrar ${escolhidos.length} partes importantes. Toque em Próximo para começar.`,
        },
        ...escolhidos.map((el, i) => ({ alvo: alvos[i], fala: descrever(el) })),
      ],
    });
  }, [falar, iniciarRoteiro]);

  const lerPagina = useCallback(() => {
    falar(textoPrincipal() || "Esta página não tem um texto principal para ler.");
  }, [falar]);

  /* ---------- dúvidas ---------- */
  const perguntar = useCallback(() => {
    setAberto(true);
    setModo("pergunta");
    falar("Pode perguntar. Escreva a sua dúvida, ou toque em Falar e diga em voz alta.");
  }, [falar]);

  const enviarPergunta = async () => {
    const q = pergunta.trim();
    if (q.length < 2) return falar("Escreva a sua dúvida primeiro. Pode ser bem curtinha.");
    setPensando(true);
    setBalao({ texto: "Deixa eu pensar um pouquinho…", tipo: "" });
    const p = pagina();
    const contexto = [p?.contexto?.() ?? "", textoPrincipal()].join("\n").slice(0, 5800);
    let resposta = "";
    try {
      const r = await perguntarLia({
        data: {
          pergunta: q.slice(0, 600),
          papel: p?.papel ?? "visitante",
          pagina: p?.nome ?? pathname,
          contexto,
        },
      });
      if (r.ok) resposta = r.resposta;
    } catch {
      /* sem IA: usa a resposta local */
    }
    setPensando(false);
    falar(resposta || respostaLocal(q));
  };

  const ditar = () => {
    if (escutando) return pararEscuta.current();
    setEscutando(true);
    setBalao({ texto: "Estou ouvindo. Pode falar…", tipo: "" });
    pararEscuta.current = escutar(
      (t) => setPergunta(t),
      () => setEscutando(false),
    );
  };

  /* ---------- ouvir ao tocar ---------- */
  useEffect(() => {
    if (!prefs.ouvirAoTocar) return;
    let ultimo: Element | null = null;
    let hora = 0;
    let apagar: ReturnType<typeof setTimeout> | undefined;
    const aoTocar = (ev: MouseEvent) => {
      if (roteiroRef.current || ev.detail === 0) return; // teclado funciona normal
      const alvo = ev.target instanceof Element ? ev.target : null;
      if (!alvo || alvo.closest("[data-lia-ui]")) return;
      const el = alvo.closest(SELETOR_LEGIVEL) ?? alvo;
      const clicavel = el.closest(SELETOR_CLICAVEL);
      const item = clicavel ?? el;
      if (ultimo === item && Date.now() - hora < 20000) {
        ultimo = null;
        destacar(null);
        return; // 2º toque: funciona normal
      }
      ev.preventDefault();
      ev.stopImmediatePropagation();
      ultimo = item;
      hora = Date.now();
      setAberto(true);
      destacar(item);
      falar(descrever(item) + (clicavel ? " Para usar, toque de novo." : ""));
      clearTimeout(apagar);
      apagar = setTimeout(
        () => alvoRef.current === item && !roteiroRef.current && destacar(null),
        6000,
      );
    };
    window.addEventListener("click", aoTocar, true);
    return () => {
      window.removeEventListener("click", aoTocar, true);
      clearTimeout(apagar);
    };
  }, [prefs.ouvirAoTocar, destacar, falar]);

  /* ---------- alerta de senha ---------- */
  useEffect(() => {
    const avisadas = new WeakSet<Element>();
    const aoFocar = (ev: FocusEvent) => {
      const el = ev.target;
      if (!(el instanceof HTMLInputElement) || el.type !== "password" || avisadas.has(el)) return;
      avisadas.add(el);
      const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      if (location.protocol !== "https:" && !local) {
        setAberto(true);
        falar(
          "Cuidado! Este endereço não é seguro, ele não começa com https. Não digite sua senha aqui.",
          "perigo",
        );
      } else if (!roteiroRef.current) {
        setAberto(true);
        falar(
          "Atenção: você vai digitar sua senha. Ninguém da Viva+Vitória, de banco ou do governo pede a sua senha por telefone ou mensagem.",
          "alerta",
        );
      }
    };
    document.addEventListener("focusin", aoFocar, true);
    return () => document.removeEventListener("focusin", aoFocar, true);
  }, [falar]);

  /* ---------- teclado e troca de página ---------- */
  useEffect(() => {
    const aoTeclar = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape" || !aberto) return;
      if (uiRef.current?.contains(document.activeElement)) fechar();
      else calar();
    };
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, [aberto, fechar, calar]);

  useEffect(() => {
    // Ao mudar de página, a Lia para de falar e mostra o menu da página nova.
    if (!roteiroRef.current) {
      calar();
      setModo("menu");
      destacar(null);
    }
  }, [pathname, calar, destacar]);

  /* ---------- API ---------- */
  const registrar = useCallback((ref: RefObject<PaginaLia>) => {
    paginaRef.current = ref;
    setVersaoPagina((v) => v + 1);
    return () => {
      if (paginaRef.current === ref) {
        paginaRef.current = null;
        setVersaoPagina((v) => v + 1);
      }
    };
  }, []);

  const api = useMemo<LiaApi>(
    () => ({ falar, abrir, saudar, iniciarRoteiro, perguntar, registrar }),
    [falar, abrir, saudar, iniciarRoteiro, perguntar, registrar],
  );

  /* ---------- desenho ---------- */
  void versaoPagina;
  const pg = pagina();
  const velocidade = VELOCIDADES.find((x) => x.v === prefs.velocidade) ?? VELOCIDADES[1]!;
  const passoAtual = roteiro ? roteiro.rot.passos[roteiro.passo] : undefined;

  const botaoAcao = (
    icone: string,
    titulo: string,
    detalhe: string,
    aoClicar: () => void,
    chave: string,
  ) => (
    <button
      key={chave}
      type="button"
      onClick={aoClicar}
      className="flex min-h-16 w-full items-center gap-3.5 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-[1.05rem] font-bold text-foreground hover:border-primary hover:bg-muted"
    >
      <span className="text-primary">
        <Icone nome={icone} />
      </span>
      <span>
        {titulo}
        {detalhe && (
          <small className="block text-base font-normal text-muted-foreground">{detalhe}</small>
        )}
      </span>
    </button>
  );

  const IR_PARA = [
    { to: "/cursos", nome: "Cursos" },
    { to: "/professor", nome: "Para professores" },
    { to: "/entrar", nome: "Entrar" },
    { to: "/cadastro", nome: "Cadastro" },
  ] as const;

  return (
    <LiaContexto.Provider value={api}>
      {children}
      <div data-lia-ui="" ref={uiRef} className="lia-ui" style={{ fontSize: "18px" }}>
        {/* Destaque: anel, seta e tela escurecida */}
        {destaque && (
          <>
            <div
              aria-hidden="true"
              className="lia-anel pointer-events-none fixed z-[2147483645] rounded-2xl border-[5px] border-highlight"
              style={{
                left: destaque.left - 8,
                top: destaque.top - 8,
                width: destaque.width + 16,
                height: destaque.height + 16,
              }}
            />
            <div
              aria-hidden="true"
              className="lia-seta pointer-events-none fixed z-[2147483645] h-16 w-14"
              style={{
                left: Math.max(
                  4,
                  Math.min(window.innerWidth - 60, destaque.left + destaque.width / 2 - 28),
                ),
                top:
                  destaque.top - 8 > 80 ? destaque.top - 78 : destaque.top + destaque.height + 14,
                transform: destaque.top - 8 > 80 ? undefined : "rotate(180deg)",
              }}
            >
              <svg viewBox="0 0 56 64" className="h-16 w-14 drop-shadow-md">
                <path
                  d="M18 2h20v30h14L28 62 4 32h14z"
                  fill="#F2C94C"
                  stroke="#1B2D57"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>
        )}

        {/* Botão flutuante */}
        {!aberto && (
          <>
            <div
              aria-hidden="true"
              onClick={saudar}
              className="fixed bottom-[44px] right-[120px] z-[2147483646] hidden cursor-pointer whitespace-nowrap rounded-xl bg-secondary px-4 py-2 text-[18px] font-bold text-secondary-foreground shadow-lg sm:block"
            >
              Precisa de ajuda? Fale com a Lia
            </div>
            <button
              ref={lancadorRef}
              type="button"
              onClick={saudar}
              aria-label="Chamar a Lia, assistente da Viva+Vitória"
              aria-expanded="false"
              className="lia-lancador fixed bottom-[20px] right-[20px] z-[2147483646] grid h-[88px] w-[88px] place-items-end overflow-hidden rounded-full border-4 border-white bg-secondary p-0 shadow-xl outline outline-2 outline-secondary focus-visible:outline-4 focus-visible:outline-highlight"
            >
              <LiaAvatar className="mx-auto block h-20 w-20" />
            </button>
          </>
        )}

        {/* Painel minimizado: só o rosto da Lia e o que ela disse por último */}
        {aberto && minimizado && (
          <div className="fixed bottom-4 right-4 z-[2147483646] flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-full border-[3px] border-secondary bg-card py-1 pl-1 pr-2 shadow-2xl">
            <LiaAvatar falando={falando} className="h-14 w-14 flex-none rounded-full bg-muted" />
            <p className="m-0 line-clamp-2 max-w-[260px] text-base" aria-live="polite">
              {balao.texto}
            </p>
            <button
              type="button"
              onClick={() => setMinimizado(false)}
              className="min-h-12 flex-none rounded-full bg-secondary px-4 font-bold text-secondary-foreground"
            >
              Mostrar a Lia
            </button>
          </div>
        )}

        {/* Painel */}
        {aberto && !minimizado && (
          <section
            ref={painelRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby="lia-titulo"
            className={`fixed bottom-4 z-[2147483646] flex max-h-[calc(100vh-32px)] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-[20px] border-[3px] bg-card text-foreground shadow-2xl ${
              aEsquerda ? "left-4" : "right-4"
            } ${balao.tipo === "perigo" ? "border-highlight" : "border-secondary"}`}
          >
            <div
              className={`flex flex-none items-center justify-between gap-2 py-1.5 pl-4 pr-2 text-white ${balao.tipo === "perigo" ? "bg-highlight" : "bg-secondary"}`}
            >
              <h2 id="lia-titulo" className="m-0 font-sans text-xl font-bold">
                Lia
                <span className="ml-2 hidden text-base font-normal sm:inline">sua assistente</span>
              </h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMinimizado(true)}
                  aria-label="Diminuir a assistente para ver a página"
                  className="inline-flex min-h-12 items-center rounded-xl border-2 border-white px-2.5 text-lg font-bold focus-visible:outline-4 focus-visible:outline-accent"
                >
                  Diminuir
                </button>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar a assistente"
                  className="inline-flex min-h-12 items-center gap-1 rounded-xl border-2 border-white px-2.5 text-lg font-bold focus-visible:outline-4 focus-visible:outline-accent"
                >
                  <Icone nome="fechar" className="h-5 w-5" />
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex flex-none items-end gap-2 bg-muted px-3 pt-3">
              <LiaAvatar falando={falando} className="w-[96px] flex-none max-[700px]:w-[70px]" />
              <div
                role="status"
                aria-live={balao.tipo ? "assertive" : "polite"}
                className={`lia-balao relative mb-4 max-h-[200px] min-w-0 flex-1 overflow-y-auto rounded-2xl border-2 px-3.5 py-3 text-[1.05rem] max-[700px]:max-h-[130px] ${
                  balao.tipo === "perigo"
                    ? "border-highlight bg-[#FDECEA] font-bold text-[#5C0F0A]"
                    : balao.tipo === "alerta"
                      ? "border-[#8A5A00] bg-[#FFF4D6] text-[#4A3000]"
                      : "border-border bg-card"
                }`}
              >
                {balao.texto}
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto p-3.5 [&>*]:flex-none">
              {modo === "roteiro" && roteiro && passoAtual && (
                <>
                  <h3 className="m-0 font-sans text-lg font-bold text-primary">
                    {roteiro.rot.tarefa}
                  </h3>
                  <p className="m-0 text-muted-foreground">
                    Passo {roteiro.passo + 1} de {roteiro.rot.passos.length}
                  </p>
                  <div className="grid grid-cols-[1fr_1fr_1.25fr] gap-2">
                    <button
                      type="button"
                      onClick={voltar}
                      disabled={roteiro.passo === 0}
                      className="min-h-14 rounded-2xl border-2 border-primary bg-card font-bold text-primary disabled:opacity-50"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => encerrarRoteiro(false)}
                      className="min-h-14 rounded-2xl border-2 border-primary bg-card font-bold text-primary"
                    >
                      Parar
                    </button>
                    <button
                      type="button"
                      onClick={avancar}
                      autoFocus
                      className="min-h-14 rounded-2xl border-2 border-primary bg-primary font-bold text-primary-foreground"
                    >
                      {roteiro.passo === roteiro.rot.passos.length - 1 ? "Concluir" : "Próximo"}
                    </button>
                  </div>
                </>
              )}

              {modo === "pergunta" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void enviarPergunta();
                  }}
                  className="flex flex-col gap-2.5"
                >
                  <label className="font-bold" htmlFor="lia-pergunta">
                    Sua dúvida
                  </label>
                  <textarea
                    id="lia-pergunta"
                    value={pergunta}
                    onChange={(e) => setPergunta(e.target.value)}
                    rows={3}
                    maxLength={600}
                    placeholder="Ex.: Como eu me inscrevo neste curso?"
                    className="w-full resize-none rounded-xl border-2 bg-card px-3 py-2 text-lg outline-none focus:border-primary"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {podeEscutar() ? (
                      <button
                        type="button"
                        onClick={ditar}
                        aria-pressed={escutando}
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card font-bold text-primary aria-pressed:bg-accent"
                      >
                        <Icone nome="microfone" className="h-6 w-6" />
                        {escutando ? "Parar" : "Falar"}
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={pensando}
                      className="min-h-14 rounded-2xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
                    >
                      {pensando ? "Pensando…" : "Perguntar"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModo("menu")}
                    className="min-h-12 rounded-2xl border-2 border-border font-bold"
                  >
                    Voltar ao menu
                  </button>
                </form>
              )}

              {modo === "menu" && (
                <>
                  {!!pg?.roteiros?.length && (
                    <>
                      <h3 className="m-0 font-sans text-lg font-bold text-primary">
                        Eu ensino você a:
                      </h3>
                      {pg.roteiros.map((r) =>
                        botaoAcao(
                          "seguir",
                          r.tarefa,
                          `${r.passos.length} passos, com voz`,
                          () => iniciarRoteiro(r),
                          r.id,
                        ),
                      )}
                    </>
                  )}
                  {!!pg?.acoes?.length && (
                    <>
                      <h3 className="m-0 font-sans text-lg font-bold text-primary">
                        Nesta página:
                      </h3>
                      {pg.acoes.map((a) =>
                        botaoAcao("estrela", a.titulo, a.detalhe ?? "", a.executar, a.id),
                      )}
                    </>
                  )}
                  <h3 className="m-0 font-sans text-lg font-bold text-primary">Outras ajudas:</h3>
                  {botaoAcao(
                    "duvida",
                    "Tirar uma dúvida",
                    "Escreva ou fale, e eu respondo",
                    perguntar,
                    "duvida",
                  )}
                  {botaoAcao(
                    "bussola",
                    "Conhecer esta página",
                    "Mostro as partes mais importantes",
                    conhecerPagina,
                    "conhecer",
                  )}
                  {botaoAcao(
                    "ler",
                    "Ler esta página",
                    "Leio o título e o começo do texto",
                    lerPagina,
                    "ler",
                  )}
                  <h3 className="m-0 font-sans text-lg font-bold text-primary">Me leve para:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {IR_PARA.filter((d) => d.to !== pathname).map((d) => (
                      <button
                        key={d.to}
                        type="button"
                        onClick={() => {
                          void navigate({ to: d.to });
                          falar(`Pronto, abri a página ${d.nome}.`);
                        }}
                        className="inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 text-left font-bold hover:border-primary"
                      >
                        <Icone nome="casa" className="h-5 w-5 text-primary" />
                        {d.nome}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              role="group"
              aria-label="Opções"
              className="grid flex-none grid-cols-2 gap-1.5 border-t-2 border-border p-2"
            >
              {[
                {
                  icone: "repetir",
                  texto: "Repetir",
                  pressionado: undefined,
                  fazer: () => {
                    if (roteiro) setRoteiro({ ...roteiro });
                    else if (ultimaFala.current.texto)
                      falar(ultimaFala.current.texto, ultimaFala.current.tipo);
                    else saudar();
                  },
                },
                {
                  icone: "voz",
                  texto: `Voz ${velocidade.nome}`,
                  pressionado: undefined,
                  fazer: () => {
                    const i = VELOCIDADES.findIndex((x) => x.v === prefs.velocidade);
                    const nova = VELOCIDADES[(i + 1) % VELOCIDADES.length]!;
                    mudarPrefs({ velocidade: nova.v });
                    prefsRef.current = { ...prefsRef.current, velocidade: nova.v };
                    falar(`Agora eu falo assim: voz ${nova.nome}.`);
                  },
                },
                {
                  icone: "letra",
                  texto: "Letra grande",
                  pressionado: prefs.letraGrande,
                  fazer: () => {
                    mudarPrefs({ letraGrande: !prefs.letraGrande });
                    falar(
                      !prefs.letraGrande
                        ? "Pronto! Deixei as letras e os botões maiores."
                        : "Voltei as letras ao tamanho normal.",
                    );
                  },
                },
                {
                  icone: "tocar",
                  texto: "Ouvir ao tocar",
                  pressionado: prefs.ouvirAoTocar,
                  fazer: () => {
                    mudarPrefs({ ouvirAoTocar: !prefs.ouvirAoTocar });
                    falar(
                      !prefs.ouvirAoTocar
                        ? "Ligado! Toque em qualquer coisa na página e eu leio para você. Para usar um botão, toque nele mais uma vez."
                        : "Desliguei a leitura ao tocar.",
                    );
                  },
                },
              ].map((b) => (
                <button
                  key={b.icone}
                  type="button"
                  onClick={b.fazer}
                  aria-pressed={b.pressionado}
                  aria-label={
                    b.icone === "voz"
                      ? `Velocidade da voz: ${velocidade.nome}. Toque para mudar.`
                      : undefined
                  }
                  className="flex min-h-14 items-center gap-2 rounded-xl border-2 border-border bg-card px-2.5 text-left font-bold leading-tight text-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                >
                  <Icone nome={b.icone} className="h-6 w-6" />
                  <span>{b.texto}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </LiaContexto.Provider>
  );
}
