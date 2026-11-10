/*
 * Cursos, aulas e inscrições
 * ------------------------------------------------------------
 * Por enquanto ficam salvos no próprio navegador (localStorage), com
 * alguns cursos de exemplo. Assim tudo funciona já, sem mudar o banco.
 * Para valer para todos os aparelhos, peça ao Lovable as tabelas
 * descritas em LIA-PLATAFORMA.md e troque as funções deste arquivo.
 */
import { useSyncExternalStore } from "react";
import { gerarPlanoAula, type Categoria, type DadosCurso, type PlanoAula } from "./lia-professora";

export type Aula = {
  id: string;
  numero: number;
  plano: PlanoAula;
  criadaEm: string;
};

export type Curso = DadosCurso & {
  id: string;
  categoria: Categoria | string;
  descricao: string;
  local: string;
  diaHorario: string;
  duracaoMin: number;
  vagas: number;
  oQueLevar: string[];
  professor: { id: string; nome: string };
  aulas: Aula[];
  criadoEm: string;
};

export type Inscricao = { cursoId: string; usuarioId: string; nome: string; quando: string };

const CHAVE_CURSOS = "vivamais.cursos.v1";
const CHAVE_INSCRICOES = "vivamais.inscricoes.v1";

export const novoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ---------------------------------------------------------- */
/* Cursos de exemplo                                           */
/* ---------------------------------------------------------- */
type Semente = Omit<Curso, "id" | "aulas" | "criadoEm" | "professor"> & {
  slug: string;
  prof: string;
  tema: string;
};

const SEMENTES: Semente[] = [
  {
    slug: "ceramica",
    titulo: "Cerâmica para iniciantes",
    categoria: "Arte",
    local: "Praia do Canto",
    diaHorario: "Terças, 10h",
    duracaoMin: 120,
    vagas: 12,
    prof: "Dona Marlene",
    tema: "Fazer uma tigela com rolinhos de argila",
    oQueLevar: ["Avental ou camiseta velha"],
    descricao:
      "Aprenda a dar forma ao barro com as próprias mãos. Começamos do zero, com peças simples, em uma turma pequena e cheia de conversa boa.",
  },
  {
    slug: "celular",
    titulo: "Celular sem mistério",
    categoria: "Tecnologia",
    local: "Centro Histórico",
    diaHorario: "Quartas, 14h",
    duracaoMin: 90,
    vagas: 15,
    prof: "Seu Antônio",
    tema: "Mandar mensagem e áudio no WhatsApp",
    oQueLevar: ["Seu celular carregado", "Carregador"],
    descricao:
      "WhatsApp, fotos, chamada de vídeo e cuidados contra golpes. Tudo bem devagar, no seu próprio celular.",
  },
  {
    slug: "cozinha",
    titulo: "Cozinha afetiva",
    categoria: "Culinária",
    local: "Jardim da Penha",
    diaHorario: "Quintas, 9h30",
    duracaoMin: 120,
    vagas: 10,
    prof: "Dona Cida",
    tema: "Bolo de fubá da vovó",
    oQueLevar: ["Um pote com tampa", "Avental"],
    descricao:
      "Receitas de família, trocadas entre a turma. A gente cozinha junto e cada um leva um pouco para casa.",
  },
  {
    slug: "danca",
    titulo: "Dança de salão",
    categoria: "Movimento",
    local: "Jardim Camburi",
    diaHorario: "Sextas, 16h",
    duracaoMin: 60,
    vagas: 20,
    prof: "Seu Jorge",
    tema: "Passo básico do bolero",
    oQueLevar: ["Sapato confortável", "Garrafa de água"],
    descricao:
      "Bolero, samba de gafieira e forró, no seu ritmo. Não precisa ter par: todo mundo dança com todo mundo.",
  },
  {
    slug: "fotografia",
    titulo: "Fotografia de rua",
    categoria: "Arte",
    local: "Bento Ferreira",
    diaHorario: "Sábados, 9h",
    duracaoMin: 90,
    vagas: 12,
    prof: "Dona Helena",
    tema: "Usar a luz da manhã nas fotos",
    oQueLevar: ["Celular ou câmera", "Chapéu"],
    descricao:
      "Saímos pelo bairro para fotografar pessoas, prédios e detalhes da cidade, usando o celular ou uma câmera.",
  },
  {
    slug: "jardinagem",
    titulo: "Jardinagem urbana",
    categoria: "Natureza",
    local: "Parque Pedra da Cebola",
    diaHorario: "Sábados, 10h",
    duracaoMin: 90,
    vagas: 15,
    prof: "Seu Raimundo",
    tema: "Plantar temperos em vaso",
    oQueLevar: ["Chapéu e protetor solar", "Luvas"],
    descricao:
      "Horta em vaso, temperos e plantas que gostam de varanda. Cada aluno leva uma muda para casa.",
  },
];

function cursosDeExemplo(): Curso[] {
  return SEMENTES.map(({ slug, prof, tema, ...c }) => ({
    ...c,
    id: `exemplo-${slug}`,
    professor: { id: `exemplo-${slug}`, nome: prof },
    criadoEm: "2026-11-01T12:00:00.000Z",
    aulas: [
      {
        id: `exemplo-${slug}-1`,
        numero: 1,
        criadaEm: "2026-11-01T12:00:00.000Z",
        plano: gerarPlanoAula(c, { tema }, 1).plano,
      },
    ],
  }));
}

/* ---------------------------------------------------------- */
/* Armazenamento                                               */
/* ---------------------------------------------------------- */
const ouvintes = new Set<() => void>();
const EXEMPLOS = cursosDeExemplo();
let cacheCursos: Curso[] | null = null;
let cacheInscricoes: Inscricao[] | null = null;
const SEM_INSCRICOES: Inscricao[] = [];

function ler<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}
function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento (janela anônima): segue só na memória */
  }
}
function avisar() {
  ouvintes.forEach((f) => f());
}
function assinar(f: () => void) {
  ouvintes.add(f);
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE_CURSOS || e.key === CHAVE_INSCRICOES) {
      cacheCursos = null;
      cacheInscricoes = null;
      f();
    }
  };
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    ouvintes.delete(f);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}

export function listarCursos(): Curso[] {
  if (typeof window === "undefined") return EXEMPLOS;
  if (!cacheCursos) {
    const criados = ler<Curso[]>(CHAVE_CURSOS) ?? [];
    cacheCursos = [...criados, ...EXEMPLOS];
  }
  return cacheCursos;
}

export function listarInscricoes(): Inscricao[] {
  if (typeof window === "undefined") return SEM_INSCRICOES;
  if (!cacheInscricoes) cacheInscricoes = ler<Inscricao[]>(CHAVE_INSCRICOES) ?? [];
  return cacheInscricoes;
}

function cursosCriados(): Curso[] {
  return ler<Curso[]>(CHAVE_CURSOS) ?? [];
}

export function salvarCurso(curso: Curso) {
  const criados = cursosCriados();
  const i = criados.findIndex((c) => c.id === curso.id);
  if (i >= 0) criados[i] = curso;
  else criados.unshift(curso);
  gravar(CHAVE_CURSOS, criados);
  cacheCursos = null;
  avisar();
}

export function adicionarAula(cursoId: string, plano: PlanoAula) {
  const curso = cursosCriados().find((c) => c.id === cursoId);
  if (!curso) return;
  curso.aulas.push({
    id: novoId(),
    numero: curso.aulas.length + 1,
    plano,
    criadaEm: new Date().toISOString(),
  });
  salvarCurso(curso);
}

export function removerCurso(cursoId: string) {
  gravar(
    CHAVE_CURSOS,
    cursosCriados().filter((c) => c.id !== cursoId),
  );
  gravar(
    CHAVE_INSCRICOES,
    listarInscricoes().filter((i) => i.cursoId !== cursoId),
  );
  cacheCursos = null;
  cacheInscricoes = null;
  avisar();
}

export function inscrever(
  cursoId: string,
  usuarioId: string,
  nome: string,
): "ok" | "ja" | "lotado" {
  const todas = listarInscricoes();
  if (todas.some((i) => i.cursoId === cursoId && i.usuarioId === usuarioId)) return "ja";
  const curso = listarCursos().find((c) => c.id === cursoId);
  if (curso && todas.filter((i) => i.cursoId === cursoId).length >= curso.vagas) return "lotado";
  gravar(CHAVE_INSCRICOES, [
    ...todas,
    { cursoId, usuarioId, nome, quando: new Date().toISOString() },
  ]);
  cacheInscricoes = null;
  avisar();
  return "ok";
}

export function cancelarInscricao(cursoId: string, usuarioId: string) {
  gravar(
    CHAVE_INSCRICOES,
    listarInscricoes().filter((i) => !(i.cursoId === cursoId && i.usuarioId === usuarioId)),
  );
  cacheInscricoes = null;
  avisar();
}

/* ---------------------------------------------------------- */
/* Hooks                                                       */
/* ---------------------------------------------------------- */
export function useCursos(): Curso[] {
  return useSyncExternalStore(assinar, listarCursos, () => EXEMPLOS);
}
export function useInscricoes(): Inscricao[] {
  return useSyncExternalStore(assinar, listarInscricoes, () => SEM_INSCRICOES);
}

export function vagasRestantes(curso: Curso, inscricoes: Inscricao[]) {
  return Math.max(0, curso.vagas - inscricoes.filter((i) => i.cursoId === curso.id).length);
}

/** Tira acentos e deixa minúsculo, para a busca achar "ceramica" e "Cerâmica". */
export const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
