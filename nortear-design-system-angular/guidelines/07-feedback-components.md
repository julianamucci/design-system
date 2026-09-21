# Feedback — a mecânica desta stack (Angular)

**As regras da categoria estão em [`19-feedback.md`](../../docs/shared/guidelines/19-feedback.md)**,
uma vez só para as cinco stacks: qual componente usar, cor e superfície, anúncio e
região viva, movimento, elevação, analytics e tom de voz, mais a tabela de quem
cobra cada invariante. O que cada componente É está no PRD dele, em
`docs/shared/prd/` — Alert, Badge, Progress, Skeleton e Sonner têm um cada,
escritos a partir do código em 2026-09-13.

Este arquivo guarda só o que é **desta stack** e não tem equivalente nas outras
quatro. Até 2026-09-13 ele era uma das cinco cópias da regra de categoria — que
discordavam entre si e ficaram para trás juntas — e o portão
`guideline_de_stack_repete_categoria` impede que a cópia volte.

---

## Seletor de atributo, e o que isso decide

As peças desta categoria vivem num seletor de ATRIBUTO sobre o elemento nativo
(`div[ndsAlert]`, `[ndsAlertTitle]`, `span[ndsBadgeCounter]`): quem escreve
escolhe a tag, e nenhuma delas acrescenta um elemento embrulhando o que já
existe — é o que mantém ícone, título e descrição como FILHOS DIRETOS, que é o
que a folha `.nds-alert` posiciona.

**O que decide entre `@Directive` e `@Component` é haver markup a montar**, não o
tipo de seletor:

- `[ndsAlertTitle]`, `[ndsAlertDescription]`, `[ndsAlertAction]` e
  `svg[ndsAlertIcon]` são `@Directive` — só aplicam classe, `data-slot` e
  atributos no elemento que você escreveu.
- `div[ndsAlert]` é `@Component`, com `template` e `<ng-content />`, porque tem
  markup próprio a montar: o botão de fechar, que vem DEPOIS do conteúdo
  projetado para o leitor de tela anunciar a mensagem antes da ação de
  descartá-la. Sem template não haveria onde declará-lo.

Três consequências que só existem aqui:

- **O nível do título é o ELEMENTO em que a diretiva foi aplicada.** `h2[ndsAlertTitle]`
  sai `h2`; não há prop de nível e não há default a sobrescrever. Nível fixo pularia
  degrau sob seções e reprovaria `heading-order` no axe. As outras quatro têm prop
  ou opção, com um default — a divergência está registrada na §7 de
  [`docs/shared/prd/alert.md`](../../docs/shared/prd/alert.md).
- **Valor, mínimo e máximo do Progress entram pelo host do raiz** (`hostDirectives`
  com as entradas da lib), e não por atributo escrito no template: no Angular o
  atributo estático perde para o host binding da diretiva. **O texto acessível é a
  exceção**: a lib liga o MESMO `aria-valuetext`, e host binding só reescreve
  quando o próprio valor muda — então a diretiva o escreve depois do render, com
  `afterRenderEffect`, e o texto de quem compõe não perde para o da lib.
- **Fechar o Alert não remove o nó.** O componente escreve `hidden` no host e emite
  o `output`; tirar o elemento da árvore é de quem consome, porque o nó é do template
  dele. Nas outras quatro o wrapper desmonta a peça.

## Estilo global, não encapsulado

As folhas `.nds-*` são compartilhadas com as outras quatro stacks, então componente
desta stack que estilize por `styles` encapsulado sai do sistema. A exigência de
`ViewEncapsulation.None` está no [`RULES.md`](RULES.md), com a dívida medida
registrada no `FIXES-NEEDED.md` da raiz.
