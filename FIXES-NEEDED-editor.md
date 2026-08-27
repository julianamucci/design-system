# Editor — o que sobrou depois da pipeline · 2026-08-27

Os 27 itens levantados pelos auditores foram **fechados**. `node scripts/audit.mjs editor`
fecha em zero, e os portões passam nas cinco stacks sobre a árvore final.

O que segue são as pendências que **sobraram por decisão**, não por esquecimento:
cada uma foi encontrada durante a correção, avaliada, e deixada aberta com o
motivo escrito. Duas delas são de raio maior que o componente.

---

## Aberto por decisão

- [ ] **Troca de idioma não destrói as instâncias de editor da página.**
  Ao trocar o idioma, a docs page substitui cada seção sem desmontar o que havia
  dentro — no editor isso vaza a instância da demonstração, dos dois pares de
  Do & Don't e dos dois cards de variante.

  **É pré-existente e não é do editor**: `DocsDemonstration`, `DocsDoDont` e
  `DocsVariants` são compartilhados pelas 50 páginas, e nenhum tem caminho de
  desmontagem. O editor só tornou o vazamento visível, porque é o primeiro
  componente dessas seções que segura uma instância de biblioteca.

  Fechar exige acrescentar desmontagem aos três containers, nas cinco stacks. O
  agente que encontrou recusou fazê-lo no meio do lote, e a recusa está certa:
  é mudança que atravessa 50 páginas e merece a própria rodada.

- [ ] **A caixa da lista de tarefas mede 24px, e o checkbox do sistema mede 14.**
  O mínimo de alvo de toque (WCAG 2.5.8) é 24×24 e o axe mede o retângulo do
  próprio `<input>` — pseudo-elemento do pai não conta, medido. Como a caixa
  aqui é o `<input>` que a biblioteca desenha, e não o primitivo do design
  system, ela teve de crescer de verdade.

  A saída boa é trocar por um controle próprio (`appearance: none` mais desenho
  do sistema), que daria os 14px visuais dentro de um alvo de 24. É mudança de
  outra ordem: mexe no nodeView da lista de tarefas nas cinco stacks.

- [ ] **`t()` não pode reprovar em type-check, e duas stacks dependem dele.**
  Os rótulos da barra agora vêm do conteúdo compartilhado nas cinco. React, vue
  e svelte leem o JSON tipado, então rótulo ausente ou idioma atrasado reprova
  na compilação. Vanilla e angular montam por `t()` com `as` — que satisfaz
  "vem do conteúdo" e **não** o portão, porque `t()` devolve a própria chave
  quando ela falta.

  Diferença de forma, mesma consequência: nas duas o defeito aparece na tela, e
  nas outras três não chega a compilar.

---

## Registrado em outro lugar, e ainda válido

Estes já estavam no `FIXES-NEEDED.md` do repositório antes desta pipeline e
seguem abertos; ficam aqui só como referência cruzada.

- `hidden` não esconde classe `.nds-*` que declare `display` — a armadilha
  apareceu **quatro vezes** dentro do próprio `editor.css`. A regra de auditoria
  proposta continua sendo a única coisa que impede a quinta.
- `createToggle` (solto) sem setter público de `pressed`.
- As três capacidades novas do `toggle-group` do Vanilla ainda não portadas para
  as outras quatro stacks.

---

## Para a guideline de teste, não para o backlog

Duas coisas que esta rodada mediu e que pertencem à documentação de teste, porque
custaram tempo a agentes independentes que não tinham como saber:

1. **Fixture binária com bytes iguais vira o mesmo `data:` URL.** O resolvedor
   padrão embute o arquivo, o cache de descrição é por `src` — e está certo —,
   então dois arquivos de mesmo conteúdo e nomes diferentes compartilham
   descrição. **Quatro agentes bateram nisso na mesma rodada**, cada um achando
   que era defeito de colar ou de arrastar. Fixture binária deriva os bytes do
   nome.

2. **Tolerância de asserção geométrica se mede, não se escolhe.** Pedi 1px de
   folga no portão de alinhamento depois de descobrir que a regressão que ele
   existe para pegar produz **exatamente 2px** — a folga de 2 que eu tinha
   pedido por hábito passaria na borda. Antes de fixar uma tolerância, plante o
   defeito e meça o desvio que ele produz.
