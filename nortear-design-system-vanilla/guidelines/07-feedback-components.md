# Feedback — a mecânica desta stack (Vanilla TS)

**As regras da categoria estão em [`19-feedback.md`](../../docs/shared/guidelines/19-feedback.md)**,
uma vez só para as cinco stacks: qual componente usar, cor e superfície, anúncio e
região viva, movimento, elevação, analytics e tom de voz, mais a tabela de quem
cobra cada invariante. O que cada componente É está no PRD dele, em
`docs/shared/prd/` — Alert, Badge, Progress, Skeleton e Sonner têm um cada,
escritos a partir do código em 2026-09-13.

Este arquivo guarda só o que é **desta stack** e não tem equivalente nas outras
quatro. Até 2026-09-13 ele era uma das cinco cópias da regra de categoria — que
discordavam entre si e ficaram para trás juntas, com esta documentando quatro
variantes de Alert onde o código tem cinco — e o portão
`guideline_de_stack_repete_categoria` impede que a cópia volte.

---

## Fábrica, não componente

As outras quatro stacks declaram componente e recebem o ciclo de vida do
framework. Aqui cada peça é uma **fábrica** que devolve o elemento pronto, e três
consequências valem para a categoria inteira:

| regra | por quê |
|---|---|
| Nunca pendurar ouvinte no elemento DEVOLVIDO pela fábrica | o ouvinte fica fora do que a fábrica sabe desmontar, e sobrevive ao elemento — foi assim que o gatilho escondido nasceu em três componentes |
| Nome acessível é **opção da fábrica**, não retoque no elemento retornado | `createProgress({ ariaLabel })` e os irmãos: quem escreve o atributo depois perde na próxima chamada que reconstrói a peça |
| Subpeça é subfábrica | `createAlertTitle`, `createBadgeCounter`: o elemento devolvido entra na lista `children` da fábrica de cima, em vez de a fábrica de cima ganhar um ramo novo |

**Interatividade vem de fora.** O Badge não é o elemento interativo: etiqueta
clicável é `createBadge` **dentro** de um `<button>`, e o foco é do botão. A
fábrica não recebe `onClick` de propósito.

## O que o teclado precisa aqui

Na categoria de feedback só a torrada tem teclado, e nas três stacks com lib ele
vem da própria lib. Aqui é escrito à mão em `ui/toast-utils.ts`, e é por isso que
esta stack é a única — com o Angular — em que **`Escape` fecha a notificação**.
A divergência está medida em `docs/shared/prd/sonner.md` §7.

## Dois arquivos órfãos, removidos

`ui/toast.ts` e `ui/toaster.ts` não eram importados por ninguém e tinham
divergido do contrato que `toast-utils.ts` implementa — rótulos em inglês,
`variant` `destructive`, `aria-live` na região E na notificação, sem cronômetro,
fila ou `promise`. Saíram em 2026-09-14, como registra a §7 de
[`docs/shared/prd/sonner.md`](../../docs/shared/prd/sonner.md): quem procurava
"toast" nesta stack achava primeiro o arquivo que ninguém usava. A torrada da
stack é só `toast-utils.ts`, reexportado por `ui/sonner.ts`.
