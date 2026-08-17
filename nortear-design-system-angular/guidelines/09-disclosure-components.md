# Disclosure Components (Nortear — Angular)

---

## Accordion

**Propósito**: mostrar e esconder seções de conteúdo relacionado numa lista vertical. Para um único bloco isolado, **Collapsible**.

**Quando usar**: perguntas frequentes, configuração avançada, conteúdo agrupável em que nem tudo precisa estar visível ao mesmo tempo.

**Peças**: `div[ndsAccordion]`, `div[ndsAccordionItem]`, `button[ndsAccordionTrigger]`, `div[ndsAccordionContent]`.

**Estrutura**:

```
div[ndsAccordion]
└── div[ndsAccordionItem]                  (valor próprio)
    ├── button[ndsAccordionTrigger]        (aria-expanded, aria-controls)
    │   ├── rótulo
    │   └── seta                           (decorativa, gira no estado aberto)
    └── div[ndsAccordionContent]           (region, rotulada pelo gatilho)
        └── conteúdo
```

**Entradas** — vêm do primitivo headless, expostas no host de cada peça:

| Peça | Entradas | Saídas |
|---|---|---|
| `ndsAccordion` | modo múltiplo, valor, valor inicial, desabilitado | mudança de valor |
| `ndsAccordionItem` | valor, desabilitado | mudança de aberto |
| `ndsAccordionTrigger` | do primitivo | — |
| `ndsAccordionContent` | do primitivo | — |

**Regras**:
- Cada item precisa de valor único — é dele que saem os identificadores que ligam gatilho e conteúdo
- Gatilho é `<button>`, nunca `<div>` com handler
- Modo único é o default. Modo múltiplo é escolha, e muda o contrato de valor de "um" para "vários"
- Conteúdo colapsado sai do fluxo de verdade: esconder só por CSS deixa o que está dentro na ordem de tabulação
- A rotação da seta respeita `prefers-reduced-motion`
- Item desabilitado continua visível e anunciado como desabilitado — esconder muda a lista

**Acessibilidade**:
- `aria-expanded` no gatilho reflete o estado real
- `aria-controls` aponta ao conteúdo, e o conteúdo é rotulado pelo gatilho
- Setas navegam entre gatilhos, Home e End vão ao primeiro e ao último
- Elemento focável dentro do painel só é alcançável quando o painel está aberto
- O nível do heading que envolve o gatilho, quando houver, é escolha da página — hierarquia primeiro

**Analytics**: `accordion_expand` e `accordion_collapse`, com identificador estável do item.

---

## Collapsible

**Propósito**: mostrar e esconder **um** bloco de conteúdo, controlado por um gatilho próprio.

**Peças**: `div[ndsCollapsible]`, `button[ndsCollapsibleTrigger]`, `div[ndsCollapsiblePanel]`.

**Estrutura**:

```
div[ndsCollapsible]
├── button[ndsCollapsibleTrigger]      (aria-expanded, aria-controls)
└── div[ndsCollapsiblePanel]           (id, escondido quando fechado)
```

**Entradas** — do primitivo headless:

| Peça | Entradas | Saídas |
|---|---|---|
| `ndsCollapsible` | aberto, aberto inicial, id do painel | mudança de aberto, e mudança concluída depois da animação |
| `ndsCollapsiblePanel` | id, manter montado, revelável pela busca do navegador |

**Regras**:
- Para vários blocos irmãos, o componente é Accordion — vários Collapsible lado a lado não coordenam nada
- "Manter montado" existe para o caso em que o conteúdo precisa continuar no DOM (formulário com estado, por exemplo). Não é o default, porque o default certo é não pagar por conteúdo escondido
- "Revelável pela busca do navegador" permite que Ctrl+F encontre texto dentro do painel fechado e o abra. Ligue quando o conteúdo é texto que a pessoa pode querer procurar
- Quando o gatilho não tem texto visível, o nome acessível é obrigatório e deve descrever a **ação**, não o estado
- **Divergência de API registrada**: `disabled` não é exposto no gatilho deste stack. O Dialog expõe, e a razão é oposta — lá duas diretivas ligam o mesmo atributo no host e precisam de uma fonte única. Aqui não há esse conflito, e expor um input que o primitivo já trata seria superfície duplicada

**Acessibilidade**:
- `aria-expanded` obrigatório no gatilho
- `aria-controls` apontando ao painel
- Gatilho sempre focável por teclado
- A seta de expansão é decorativa — e, se ela vem de um `ngTemplateOutlet`, atenção: **diretiva de `@angular/common` faltando no `imports` do componente não dá erro de build.** O sintoma é a seta simplesmente não aparecer, com a página inteira renderizando e o teste verde. Ver `13-system-design.md`
