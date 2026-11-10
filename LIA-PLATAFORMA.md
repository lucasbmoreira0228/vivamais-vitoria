# A Lia na plataforma Viva+Vitória

A Lia (a mesma assistente do Guia+) agora vive dentro da plataforma, em todas as páginas.
Ela fala, mostra na tela onde tocar e ensina passo a passo.

## Páginas

| Endereço | Para quem | O que a Lia faz ali |
|---|---|---|
| `/` | todos | Apresenta a plataforma e os menus |
| `/cursos` | aluno | Ensina a achar um curso (busca, tipos, quadros) e lê a lista em voz alta |
| `/cursos/:id` | aluno | Guia a inscrição, lê as informações e o material de cada aula e explica de um jeito simples |
| `/professor` | professor | Guia a criação do curso em 4 etapas, monta o passo a passo de cada aula, completa o que faltou e mostra como organizar a aula (antes, no dia, depois) |
| `/entrar` | todos | Guia o login, "Esqueci minha senha" e a criação de senha nova |
| `/cadastro` | todos | Guia cada campo do cadastro, que cria a conta (Google ou e-mail e senha); os cursos são escolhidos marcando opções, com "Ainda não sei" |

Em todas as páginas o painel da Lia também tem: **Tirar uma dúvida** (escrevendo ou falando),
**Conhecer esta página**, **Ler esta página**, **Me leve para…**, **Letra grande**,
**Ouvir ao tocar**, **Velocidade da voz** e o aviso de segurança ao tocar num campo de senha.
Em telas largas a página abre espaço ao lado do painel; no celular, o botão **Diminuir** deixa a página livre.

## Arquivos

```
src/components/lia/Lia.tsx         A Lia: painel, voz, destaque, roteiros, dúvidas, preferências
src/components/lia/LiaAvatar.tsx   O desenho da Lia
src/components/lia/voz.ts          Falar e escutar (Web Speech API)
src/lib/lia-professora.ts          A Lia professora: plano de aula, o que faltou, como organizar
src/lib/lia.functions.ts           IA do Lovable (só no servidor), com volta para a Lia sem IA
src/lib/cursos.ts                  Cursos, aulas e inscrições
src/lib/auth.ts                    Conta do usuário (login do Supabase)
src/routes/cursos/, professor.tsx, entrar.tsx   Páginas novas
```

### Como ensinar um roteiro novo à Lia

Em qualquer página, marque os elementos com `data-lia="nome"` e registre o roteiro:

```tsx
useLiaPagina({
  nome: "Nome da página",
  roteiros: [{
    id: "tarefa",
    tarefa: "O que aparece no painel",
    passos: [
      { alvo: "campo-nome", fala: "Escreva o seu nome. Depois toque em Próximo." },
      { alvo: "botao-enviar", fala: "Agora toque em Enviar.", esperarClique: true },
    ],
  }],
});
```

## Duas coisas para ligar no Lovable

**1. IA da Lia (opcional).** Ative o *Lovable AI* no projeto. A chave `LOVABLE_API_KEY` fica só no
servidor. Com ela, a Lia responde dúvidas livres e capricha no plano de aula. Sem ela, tudo continua
funcionando: a Lia usa o que sabe sozinha (respostas prontas e o plano montado em `lia-professora.ts`).

**2. Guardar cursos e inscrições no banco.** Hoje os cursos criados e as inscrições ficam salvos no
navegador de quem usa (com 6 cursos de exemplo). Para valerem para todos os aparelhos, peça ao Lovable
(o banco é gerenciado por ele) algo como:

> Crie as tabelas `cursos` (id, professor_id → auth.users, professor_nome, titulo, categoria, descricao,
> local, endereco, dia_horario, duracao_min, vagas, o_que_levar text[], criado_em),
> `aulas` (id, curso_id → cursos, numero, plano jsonb, criada_em) e
> `inscricoes` (curso_id → cursos, usuario_id → auth.users, nome, quando; chave única curso_id+usuario_id),
> com RLS: todos podem ler cursos e aulas; só o professor dono cria e edita os seus cursos e aulas;
> cada usuário cria e apaga só as próprias inscrições; o professor lê as inscrições dos seus cursos.
> Depois troque as funções de `src/lib/cursos.ts` para usar essas tabelas, mantendo os mesmos nomes.

**3. Login com o Google.** Os botões "Entrar com o Google" e "Cadastrar com o Google" usam o login do
Supabase (`signInWithOAuth`). O Google "gerenciado pelo Lovable" só funciona em sites publicados pelo
próprio Lovable; no site da Vercel é preciso usar **credenciais próprias**:

1. No Google Cloud Console, crie um *OAuth client* do tipo **Web application**.
   Em *Authorized redirect URIs*, coloque o endereço de retorno do Supabase do projeto
   (`https://SEU-PROJETO.supabase.co/auth/v1/callback`).
2. No Lovable, em **Users → Settings → Google**, escolha usar as suas credenciais e cole o
   *Client ID* e o *Client secret*.
3. Nas URLs permitidas do login (Site URL / Redirect URLs), inclua `https://vivamais-vitoria.vercel.app/**`.

Quem entra pelo Google pela primeira vez cai na página de cadastro para completar telefone, bairro e cursos.

Também vale conferir em *Authentication* se a confirmação de e-mail está ligada: se estiver, depois do
cadastro a pessoa precisa tocar no link do e-mail antes de entrar (a Lia avisa isso na tela).
