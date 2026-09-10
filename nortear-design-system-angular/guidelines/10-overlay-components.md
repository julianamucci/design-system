# Overlay — a mecânica desta stack (Angular)

**As regras da categoria estão em [`18-overlay.md`](../../docs/shared/guidelines/18-overlay.md)**,
uma vez só para as cinco stacks: superfície, véu, camadas, teclado, modalidade,
título, corpo rolável, formulário, analytics e a tabela de quem cobra cada
invariante. O que cada componente É está no PRD dele, em `docs/shared/prd/`.

Este arquivo guarda só o que é **desta stack** e não tem equivalente nas
outras quatro. Até 2026-09-10 ele era uma das cinco cópias da regra de
categoria — que discordavam entre si e ficaram para trás juntas — e o portão
`guideline_de_stack_repete_categoria` impede que a cópia volte.

---
## O padrão de composição deste stack

Todo overlay segue a mesma forma, e ela é diferente das outras quatro stacks:

```
<orquestrador>                          (dono do estado; nds-* ou diretiva no host)
├── gatilho                             ← FICA na página
└── ng-template[…Content]               ← o painel, portalizado ao abrir
```

O painel vive num **`<ng-template>`**, não num elemento escrito na página. Isso não é preferência: o painel é instanciado dentro de um portal no corpo do documento e destruído ao fechar. Um elemento escrito pelo consumidor teria de ser teleportado para lá e devolvido no fechamento; um template é criado e destruído junto com o portal, sem nó órfão.

Duas consequências que valem para todos:

- **Em teste, o painel não está no canvas.** Procure no corpo do documento, e espere a animação assentar antes de afirmar — o painel entra com fade e zoom, e ler o primeiro frame produz uma falsa violação de contraste com razão perto de 1.0
- **Não há input de classe no painel** em vários deles: quem escreve não é dono daquele elemento. Classe extra no painel seria API nova, e enquanto não houver caso concreto o painel tem uma classe só, a do design system

## Uma âncora de foco que o axe acusa

O primitivo cerca o conteúdo portalizado com duas âncoras de foco de 1 pixel, escondidas do leitor e focáveis — é o que devolve o foco ao limite certo quando o Tab entra ou sai do portal. O axe lê `aria-hidden` mais focável como armadilha de foco, que é o **contrário** do que essas âncoras fazem.

Tirar o atributo escondido calaria o axe e faria o leitor anunciar dois elementos vazios em todo menu; tirar o tab stop desmontaria o mecanismo. A regra é desligada **só** nas stories que terminam com um overlay aberto, o que mantém as outras valendo. A correção é da biblioteca.
