# Prompt — construir um tema novo a partir do brand book

Cole isto na sessão que já tem o brand book. Substitua `<ID>` e `<NOME>`.

---

Construa um tema de marca novo para o design system Nortear, a partir do brand
book que você já tem em contexto.

**Antes de escrever qualquer linha, leia `docs/shared/guidelines/16-novo-tema.md`
por inteiro.** Ele tem os 39 tokens obrigatórios, as regras de contraste que o
portão automático cobra, os 21 arquivos em que o tema precisa ser registrado e
os cinco erros que este projeto já cometeu construindo tema. O que segue aqui
são só as decisões e as restrições específicas desta rodada.

## Identidade

- id: `<ID>` (kebab-case, minúsculo — vira a classe `.tema-<ID>`)
- nome: `<NOME>` (o que aparece na toolbar e na página de cores)

## Como usar o brand book

Extraia dele, com os valores exatos: a cor primária; a secundária e o acento se
existirem; a temperatura dos neutros (matiz e saturação do tint); as cores de
sistema, se a marca as define; e se há identidade de forma (cantos vivos, muito
arredondados).

**O brand book manda no que ele define. Onde ele cala, derive** — deslocando o
matiz a partir da primária, mantendo o contraste — e escreva no comentário do
arquivo que aquele valor é derivado, não prescrito. Não invente cor de sistema
se o brand book não tem: derive e diga que derivou.

**Onde o brand book conflitar com o contraste exigido, o contraste ganha** — é
requisito de acessibilidade, não preferência. Nesse caso registre no
`FIXES-NEEDED.md` o valor pedido, o valor usado e a razão medida, para a dona
decidir se aceita o desvio ou muda o brand book.

## O que NÃO fazer

- Não mexa em espaçamento, densidade, tipografia ou movimento. Tema é cor (e,
  se a marca pedir, raio). As outras dimensões são eixos separados e combináveis.
- Não use a função `hsl()` no valor do token. É `210 40% 50%`, não
  `hsl(210 40% 50%)` — senão `hsl(var(--primary) / 0.1)` quebra em todo lugar
  que usa a versão suave da cor.
- Não dê cor própria aos quatro `*-foreground` de feedback. É `var(--foreground)`,
  e a guideline explica por quê.
- Não registre em quatro stacks. São **cinco**: react, vue, svelte, vanilla,
  angular.

## Como saber que terminou

Rode, nesta ordem, e não declare pronto antes de todos passarem:

```bash
node scripts/audit.mjs --all --json
cd nortear-design-system-vanilla && npx vitest run paleta-de-tema
cd nortear-design-system-<cada-uma-das-5> && npx vitest run
```

O portão da paleta é o que importa: ele mede cada swatch por dois caminhos
independentes e cobra 4.5:1 em todo par consumido, nos temas × modos. Se ele
passar, a paleta está coerente.

Depois, `npm run chromatic` numa stack — o tema novo entra no cascade de toda
story, e a foto é o que separa "mudou o tema" de "mudou o tema e quebrou dois
componentes".

## Regras de trabalho deste repositório

- Rode vitest em **foreground**, com timeout de 600000. Em background ele morre
  em silêncio nesta máquina.
- **Nunca `git stash`** — outra sessão pode estar no mesmo repositório.
- **Faça stage só dos seus caminhos**, nunca `git add -A`.
- Commite quando a tarefa fechar, sem perguntar; **push só se pedirem**.
- O repositório é público: nenhuma credencial, token ou ID de medição em commit.

## O que entregar

1. `docs/shared/themes/<ID>.css`, com o comentário de cabeçalho declarando a
   estratégia do tema — qual o tint dos neutros, o que acontece com feedback,
   o que acontece com os gráficos, e o que é herdado em vez de declarado.
2. Os 19 registros.
3. Um resumo dizendo: quais cores vieram do brand book e quais você derivou;
   qual o contraste medido dos pares mais apertados (o menor de cada modo); e
   qualquer desvio que teve de fazer, com o motivo.
