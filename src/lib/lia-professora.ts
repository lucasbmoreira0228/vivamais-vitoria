/*
 * Lia professora
 * ------------------------------------------------------------
 * Monta o passo a passo de uma aula a partir do pouco que o professor
 * escreveu e COMPLETA o que faltou (objetivo, materiais, tempo de cada
 * parte, atividade prática, cuidados com a turma 50+).
 *
 * Tudo aqui roda sem internet. Quando a IA do Lovable está ligada,
 * src/lib/lia.functions.ts melhora os textos, mas este arquivo continua
 * sendo a base: a aula nunca fica sem plano.
 */

export const CATEGORIAS = [
  "Arte",
  "Tecnologia",
  "Culinária",
  "Movimento",
  "Natureza",
  "Música",
  "Idiomas",
  "Saúde e bem-estar",
  "Outro",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export type DadosCurso = {
  titulo: string;
  categoria: Categoria | string;
  descricao?: string;
  local?: string;
  endereco?: string;
  diaHorario?: string;
  duracaoMin?: number;
  vagas?: number;
  oQueLevar?: string[];
};

export type DadosAula = {
  tema: string;
  objetivo?: string;
  materiais?: string[];
  observacoes?: string;
  duracaoMin?: number;
};

export type Etapa = { titulo: string; minutos: number; descricao: string };
export type Palavra = { termo: string; significado: string };

export type PlanoAula = {
  tema: string;
  objetivo: string;
  duracaoMin: number;
  materiais: string[];
  etapas: Etapa[];
  atividade: string;
  dicasTurma: string[];
  resumoAluno: string;
  palavrasNovas: Palavra[];
};

export type ResultadoPlano = {
  plano: PlanoAula;
  /** O que a Lia precisou completar, em frases simples, para o professor revisar. */
  completados: string[];
};

const limpo = (t?: string) => (t ?? "").replace(/\s+/g, " ").trim();
const minusculaInicial = (t: string) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
/** "Fazer a correntinha" já começa com verbo; "Bolero" precisa de um ("praticar bolero"). */
const comVerbo = (verbo: string, tema: string) =>
  /^[a-zà-ú]+(ar|er|ir|or)\b/i.test(tema.trim()) ? minusculaInicial(tema) : `${verbo} ${minusculaInicial(tema)}`;

/* ---------------------------------------------------------- */
/* Conhecimento da Lia por área                                */
/* ---------------------------------------------------------- */
type PerfilArea = {
  materiais: string[];
  pratica: (tema: string) => string;
  cuidados: string[];
  palavras: Palavra[];
  verbo: string;
};

const PERFIS: Record<string, PerfilArea> = {
  Tecnologia: {
    materiais: [
      "Celular de cada aluno, com bateria carregada",
      "Carregadores e uma extensão de tomada",
      "Senha do Wi-Fi do local escrita em letra grande",
      "Folha impressa com o passo a passo (letra 16 ou maior)",
    ],
    pratica: (t) =>
      `Cada aluno faz "${t}" no próprio celular, devagar, enquanto você passa de mesa em mesa. Quem terminar ajuda o colega do lado.`,
    cuidados: [
      "Mostre cada toque no seu celular e espere todos repetirem antes de seguir.",
      "Peça para ninguém digitar senhas em voz alta.",
      "Lembre a turma: banco e governo não pedem senha nem código por mensagem.",
    ],
    palavras: [
      { termo: "Aplicativo", significado: "Um programa do celular, como o WhatsApp." },
      { termo: "Tocar", significado: "Encostar o dedo na tela uma vez, de leve." },
      { termo: "Wi-Fi", significado: "Internet sem fio do lugar onde você está." },
    ],
    verbo: "usar",
  },
  Arte: {
    materiais: [
      "Avental ou camiseta velha para cada aluno",
      "Material de arte para a turma toda (com sobra)",
      "Jornal ou plástico para forrar as mesas",
      "Pano úmido e papel-toalha",
    ],
    pratica: (t) =>
      `Cada aluno cria a sua peça de "${t}". Não existe certo ou errado: elogie o caminho, não só o resultado.`,
    cuidados: [
      "Deixe as peças secando em um lugar marcado com o nome de cada um.",
      "Prefira materiais sem cheiro forte e sem ponta perigosa.",
    ],
    palavras: [
      { termo: "Técnica", significado: "O jeito de fazer alguma coisa." },
      { termo: "Acabamento", significado: "Os últimos cuidados para a peça ficar bonita." },
    ],
    verbo: "fazer",
  },
  Culinária: {
    materiais: [
      "Ingredientes da receita, já medidos",
      "Receita impressa em letra grande",
      "Toucas, aventais e álcool em gel",
      "Potes para cada aluno levar uma porção para casa",
    ],
    pratica: (t) =>
      `Em duplas, a turma prepara "${t}". Cada dupla fica com uma tarefa (picar, misturar, montar) e depois trocam.`,
    cuidados: [
      "Pergunte antes da aula se alguém tem alergia ou não pode comer açúcar ou sal.",
      "Deixe facas e fogão com você ou com alguém de apoio.",
      "Lave as mãos com a turma no começo.",
    ],
    palavras: [
      { termo: "Rendimento", significado: "Para quantas pessoas a receita dá." },
      { termo: "Ponto", significado: "O momento certo em que a comida fica pronta." },
    ],
    verbo: "preparar",
  },
  Movimento: {
    materiais: [
      "Caixa de som e as músicas da aula",
      "Garrafas de água",
      "Cadeiras firmes para apoio e descanso",
    ],
    pratica: (t) =>
      `A turma pratica "${t}" em partes pequenas. Repita cada parte três vezes antes de juntar tudo.`,
    cuidados: [
      "Comece com aquecimento e termine com alongamento.",
      "Diga que cada um respeita o próprio limite e pode sentar quando quiser.",
      "Peça que quem tem problema de coração, pressão ou coluna converse com o médico antes.",
      "Faça pausas para beber água.",
    ],
    palavras: [
      { termo: "Aquecimento", significado: "Movimentos leves para preparar o corpo." },
      { termo: "Alongamento", significado: "Esticar o corpo com calma, sem dor." },
    ],
    verbo: "praticar",
  },
  Natureza: {
    materiais: [
      "Mudas, sementes ou plantas da aula",
      "Terra adubada e vasos ou canteiro",
      "Luvas e pás pequenas",
      "Regador",
    ],
    pratica: (t) =>
      `Cada aluno coloca a mão na terra e faz "${t}" com a sua planta. No fim, cada um escreve o nome da planta e a data.`,
    cuidados: [
      "Lembre de chapéu, protetor solar e água se a aula for ao ar livre.",
      "Tenha um lugar com sombra e cadeiras para descanso.",
      "Evite trabalho agachado por muito tempo: use mesas ou canteiros altos.",
    ],
    palavras: [
      { termo: "Muda", significado: "Uma planta pequena, pronta para plantar." },
      { termo: "Adubo", significado: "O alimento da planta, que vai na terra." },
    ],
    verbo: "cuidar de",
  },
  Música: {
    materiais: [
      "Instrumento (ou a voz!) de cada aluno",
      "Letras das músicas impressas em letra grande",
      "Caixa de som",
    ],
    pratica: (t) => `A turma pratica "${t}" junto, primeiro devagar e depois no ritmo da música.`,
    cuidados: [
      "Escolha músicas que a turma conhece: lembrança é ótima para aprender.",
      "Faça pausas para a voz e para as mãos descansarem.",
    ],
    palavras: [
      { termo: "Ritmo", significado: "A batida da música, o que faz a gente bater o pé." },
      { termo: "Refrão", significado: "A parte da música que se repete." },
    ],
    verbo: "tocar",
  },
  Idiomas: {
    materiais: [
      "Folha com as palavras da aula, em letra grande",
      "Quadro e canetas grossas",
      "Áudio com a pronúncia (do seu celular)",
    ],
    pratica: (t) =>
      `Em duplas, a turma usa as palavras de "${t}" numa conversa curta, como numa situação do dia a dia.`,
    cuidados: [
      "Poucas palavras novas por aula (de 5 a 8).",
      "Repita a pronúncia devagar e várias vezes. Errar faz parte!",
    ],
    palavras: [{ termo: "Pronúncia", significado: "O jeito certo de falar a palavra." }],
    verbo: "falar sobre",
  },
  "Saúde e bem-estar": {
    materiais: [
      "Folha com as dicas principais da aula",
      "Cadeiras confortáveis",
      "Água para a turma",
    ],
    pratica: (t) =>
      `Cada aluno escreve uma coisa sobre "${t}" que vai experimentar em casa nesta semana e conta para a turma.`,
    cuidados: [
      "Lembre que a aula não substitui a consulta com o médico.",
      "Respeite quem não quiser falar da própria saúde.",
    ],
    palavras: [{ termo: "Hábito", significado: "Uma coisa que a gente faz quase todo dia." }],
    verbo: "cuidar de",
  },
};

const PERFIL_GERAL: PerfilArea = {
  materiais: [
    "Folha com o resumo da aula, em letra grande (16 ou mais)",
    "Quadro ou cartolina e canetas grossas",
    "Lista de presença",
  ],
  pratica: (t) =>
    `Em grupos pequenos, a turma faz uma atividade sobre "${t}" e depois cada grupo mostra o que fez.`,
  cuidados: [],
  palavras: [],
  verbo: "aprender sobre",
};

const DICAS_TURMA_50 = [
  "Fale devagar, de frente para a turma, e repita as partes importantes.",
  "Ensine um passo de cada vez. Só siga quando todos tiverem conseguido.",
  "Entregue o material em letra grande, com bom contraste.",
  "Deixe a turma anotar e tirar foto do quadro.",
  "Lembre onde ficam o banheiro e a água logo no começo.",
];

export function perfilDa(categoria: string): PerfilArea {
  return PERFIS[categoria] ?? PERFIL_GERAL;
}

/* ---------------------------------------------------------- */
/* Tempo de cada parte da aula                                 */
/* ---------------------------------------------------------- */
function dividirTempo(total: number): Record<string, number> {
  const t = Math.max(30, Math.min(240, Math.round(total)));
  const intervalo = t >= 90 ? 10 : 0;
  const resto = t - intervalo;
  const partes = {
    acolhida: Math.round(resto * 0.1),
    explicacao: Math.round(resto * 0.25),
    demonstracao: Math.round(resto * 0.15),
    pratica: Math.round(resto * 0.35),
    intervalo,
    encerramento: 0,
  };
  partes.encerramento =
    t - (partes.acolhida + partes.explicacao + partes.demonstracao + partes.pratica + intervalo);
  return partes;
}

/* ---------------------------------------------------------- */
/* Plano de aula                                               */
/* ---------------------------------------------------------- */
export function gerarPlanoAula(curso: DadosCurso, aula: DadosAula, numero = 1): ResultadoPlano {
  const completados: string[] = [];
  const perfil = perfilDa(String(curso.categoria));
  const tema = limpo(aula.tema) || limpo(curso.titulo) || "Aula";

  let duracao = aula.duracaoMin ?? curso.duracaoMin ?? 0;
  if (!duracao || duracao < 30) {
    duracao = 90;
    completados.push("Coloquei 90 minutos de aula, um tempo bom para turmas 50+, com intervalo.");
  }

  let objetivo = limpo(aula.objetivo);
  if (!objetivo) {
    objetivo = `Ao final da aula, cada aluno vai conseguir ${comVerbo(perfil.verbo, tema)} sozinho, com calma e segurança.`;
    completados.push("Escrevi o objetivo da aula: o que o aluno vai saber fazer no fim.");
  }

  let materiais = (aula.materiais ?? []).map(limpo).filter(Boolean);
  if (!materiais.length) {
    materiais = [...perfil.materiais];
    completados.push("Sugeri a lista de materiais, pensando na sua área.");
  }
  if (!materiais.some((m) => /presen/i.test(m))) materiais.push("Lista de presença");

  const tempo = dividirTempo(duracao);
  const obs = limpo(aula.observacoes);
  const etapas: Etapa[] = [
    {
      titulo: "Acolhida",
      minutos: tempo["acolhida"] ?? 10,
      descricao:
        numero === 1
          ? "Receba a turma pelo nome. Cada um conta o próprio nome e por que veio. Mostre onde ficam o banheiro e a água."
          : "Receba a turma, pergunte como foi a semana e quem praticou em casa.",
    },
    {
      titulo: numero === 1 ? "O que vamos aprender" : "Lembrar a aula passada e o que vem hoje",
      minutos: tempo["explicacao"] ?? 20,
      descricao: `Explique com palavras simples: ${objetivo} ${obs ? `Pontos que você quer destacar: ${obs}` : "Use exemplos do dia a dia da turma."}`,
    },
    {
      titulo: "Mostrar como se faz",
      minutos: tempo["demonstracao"] ?? 15,
      descricao: `Faça "${tema}" na frente de todos, bem devagar, dizendo cada passo em voz alta. Faça duas vezes.`,
    },
  ];
  if (tempo["intervalo"]) {
    etapas.push({
      titulo: "Intervalo",
      minutos: tempo["intervalo"],
      descricao: "Pausa para água, banheiro e conversa.",
    });
  }
  etapas.push(
    {
      titulo: "Prática da turma",
      minutos: tempo["pratica"] ?? 30,
      descricao: perfil.pratica(tema),
    },
    {
      titulo: "Encerramento",
      minutos: tempo["encerramento"] ?? 10,
      descricao:
        "Pergunte o que cada um aprendeu e o que ficou difícil. Entregue o resumo impresso e combine a próxima aula.",
    },
  );
  if (!obs) completados.push("Montei as partes da aula e o tempo de cada uma.");

  const atividade = perfil.pratica(tema);
  const dicasTurma = [...perfil.cuidados, ...DICAS_TURMA_50];
  if (perfil.cuidados.length) completados.push("Lembrei dos cuidados importantes para a sua área.");

  const resumoAluno = [
    `Nesta aula, vamos aprender: ${tema}.`,
    `No final, você vai conseguir ${comVerbo(perfil.verbo, tema)} com calma.`,
    `Primeiro o professor mostra como se faz. Depois, você pratica com a ajuda dele.`,
    `A aula dura ${duracao} minutos${tempo["intervalo"] ? ", com um intervalo no meio" : ""}.`,
  ].join(" ");

  return {
    plano: {
      tema,
      objetivo,
      duracaoMin: duracao,
      materiais,
      etapas,
      atividade,
      dicasTurma,
      resumoAluno,
      palavrasNovas: perfil.palavras,
    },
    completados,
  };
}

/* ---------------------------------------------------------- */
/* Revisão do curso: o que faltou?                             */
/* ---------------------------------------------------------- */
export type Sugestao = {
  campo: keyof DadosCurso;
  falta: string;
  sugestao: string | number | string[];
};

export function sugerirDescricao(curso: DadosCurso): string {
  const titulo = limpo(curso.titulo) || "este curso";
  const perfil = perfilDa(String(curso.categoria));
  return `Um curso presencial e sem pressa para quem quer ${comVerbo(perfil.verbo, titulo)}. Não precisa saber nada antes: vamos aprender juntos, um passo de cada vez, em uma turma pequena e acolhedora.`;
}

export function revisarCurso(curso: DadosCurso): Sugestao[] {
  const s: Sugestao[] = [];
  if (limpo(curso.descricao).length < 30)
    s.push({
      campo: "descricao",
      falta: "A descrição do curso está curta.",
      sugestao: sugerirDescricao(curso),
    });
  if (!limpo(curso.local))
    s.push({ campo: "local", falta: "Falta dizer o bairro ou o lugar da aula.", sugestao: "" });
  if (!limpo(curso.diaHorario))
    s.push({ campo: "diaHorario", falta: "Falta o dia e o horário.", sugestao: "Terças, 14h" });
  if (!curso.duracaoMin)
    s.push({ campo: "duracaoMin", falta: "Falta a duração de cada aula.", sugestao: 90 });
  if (!curso.vagas) s.push({ campo: "vagas", falta: "Falta o número de vagas.", sugestao: 15 });
  if (!curso.oQueLevar?.length)
    s.push({
      campo: "oQueLevar",
      falta: "Falta dizer o que o aluno precisa levar.",
      sugestao: perfilDa(String(curso.categoria)).materiais.slice(0, 2),
    });
  return s;
}

/* ---------------------------------------------------------- */
/* Passo a passo para organizar a aula                         */
/* ---------------------------------------------------------- */
export type BlocoOrganizacao = { quando: string; itens: string[] };

export function passoAPassoOrganizar(curso: DadosCurso): BlocoOrganizacao[] {
  const perfil = perfilDa(String(curso.categoria));
  return [
    {
      quando: "Uma semana antes",
      itens: [
        `Confirme o lugar${curso.local ? ` (${curso.local})` : ""}: tem rampa, banheiro perto e cadeiras firmes?`,
        "Veja a lista de inscritos aqui na plataforma.",
        "Crie um grupo de WhatsApp da turma e mande um áudio de boas-vindas.",
        `Separe os materiais: ${perfil.materiais.slice(0, 2).join("; ").toLowerCase()}.`,
      ],
    },
    {
      quando: "Um dia antes",
      itens: [
        `Lembre a turma do dia e do horário${curso.diaHorario ? ` (${curso.diaHorario})` : ""} e do que levar.`,
        "Imprima o resumo da aula em letra grande.",
        "Ensaie a parte em que você mostra como se faz.",
      ],
    },
    {
      quando: "No dia da aula",
      itens: [
        "Chegue 20 minutos antes para arrumar a sala.",
        "Deixe água à vista e mostre onde fica o banheiro.",
        "Passe a lista de presença.",
        "Siga o passo a passo da aula que a Lia montou com você.",
      ],
    },
    {
      quando: "Depois da aula",
      itens: [
        "Mande no grupo um resumo ou uma foto do quadro.",
        "Anote o que funcionou e o que mudar na próxima aula.",
        "Cadastre a próxima aula aqui na plataforma.",
      ],
    },
  ];
}

/* ---------------------------------------------------------- */
/* Texto para a Lia ler a aula em voz alta para o aluno        */
/* ---------------------------------------------------------- */
export function textoParaOuvir(plano: PlanoAula, numero: number): string {
  const partes = [
    `Aula ${numero}: ${plano.tema}.`,
    plano.resumoAluno,
    `O que vamos fazer: ${plano.etapas.map((e) => e.titulo).join(", ")}.`,
  ];
  if (plano.materiais.length) partes.push(`O que levar ou usar: ${plano.materiais.join(", ")}.`);
  if (plano.palavrasNovas.length)
    partes.push(
      `Palavras novas: ${plano.palavrasNovas.map((p) => `${p.termo}: ${p.significado}`).join(" ")}`,
    );
  return partes.join(" ");
}
