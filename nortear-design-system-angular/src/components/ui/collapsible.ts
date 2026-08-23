import { Directive, computed } from '@angular/core';
import {
  RdxCollapsibleRootDirective,
  RdxCollapsibleTriggerDirective,
  RdxCollapsiblePanelDirective,
  injectCollapsibleRootContext,
} from '@radix-ng/primitives/collapsible';

// ─── Collapsible ──────────────────────────────────────────────────────────────
//
// Visual: classe .nds-collapsible na raiz (docs/shared/styles/nds/collapsible.css).
// Trigger e painel não têm visual próprio — quem usa estiliza como quiser, e é
// por isso que o exemplo canônico compõe o trigger com `ndsButton`.
//
// COM os primitivos do Radix NG. O que eles entregam aqui é justamente a parte
// que se escreve errado à mão:
//
//   · `aria-expanded` no trigger, sempre em sincronia com o estado;
//   · `aria-controls` apontando para o id do painel — e SÓ enquanto o painel
//     existe no DOM, que é o detalhe que evita `aria-valid-attr-value` do axe
//     quando o painel desmonta ao fechar;
//   · o par `data-starting-style` / `data-ending-style` e a medição do painel em
//     `--collapsible-panel-height`, que é exatamente o que o CSS compartilhado
//     lê para animar a altura (o mesmo nome de variável do Base UI, então a
//     folha vale para as cinco stacks sem ramificação);
//   · manter o painel montado durante a transição de saída, senão o fechamento
//     não teria o que animar.
//
// O que os primitivos NÃO entregam é `data-state="open|closed"`: o Radix NG usa
// `data-open` / `data-closed` (convenção do Base UI) e as outras quatro stacks
// emitem `data-state`. O Vanilla — referência de markup — põe `data-state` no
// trigger e no painel, e não na raiz. Emitimos exatamente isso: nem mais, nem
// menos, porque paridade de markup é o que a auditoria cross-stack compara.
//
// Todos são `@Directive`: as três peças só acrescentam atributos e classe a
// elementos que quem consome já escreveu. Nenhuma projeta conteúdo próprio, e um
// `@Component` com `template: '<ng-content />'` criaria view e ciclo de detecção
// para renderizar nada.

/**
 * Raiz do Collapsible.
 *
 * `open` é model do primitivo, então `[(open)]` funciona; `defaultOpen` cobre o
 * modo não-controlado.
 *
 * `disabled` do `RdxCollapsibleRootDirective` fica FORA da lista de inputs de
 * propósito. O que ele faz é (a) barrar o toggle e (b) fazer o trigger escrever
 * `aria-disabled="true"` e `data-disabled`. Só que esses dois atributos já têm
 * dono quando o trigger é um `<button ndsButton>`: o `RdxButtonDirective` liga
 * os mesmos atributos a partir do SEU `disabled`. Dois host bindings no mesmo
 * atributo não dão erro — o último a rodar vence, e a ordem depende de como as
 * diretivas casaram. Desabilitar pelo botão dá as três coisas de uma vez (sem
 * clique, sem teclado, aparência e anúncio nativos) e é o que o conteúdo
 * compartilhado descreve: "prop disabled no trigger, via Button".
 */
@Directive({
  selector: 'div[ndsCollapsible]',
  standalone: true,
  // Sem `encapsulation`: diretiva não tem view própria, então também não há
  // escopo de estilo a declarar. O visual inteiro vem de @shared/styles/nds/.
  hostDirectives: [
    {
      directive: RdxCollapsibleRootDirective,
      inputs: ['open', 'defaultOpen', 'panelId'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'],
    },
  ],
  host: {
    class: 'nds-collapsible',
    '[attr.data-slot]': '"collapsible"',
  },
})
export class NdsCollapsible {}

/**
 * Botão que alterna o painel.
 *
 * `type="button"` estático: sem ele um trigger dentro de `<form>` herdaria
 * `type="submit"` e abrir o painel enviaria o formulário. É atributo de
 * criação — quando o elemento também é `ndsButton`, o primitivo de botão liga
 * `[attr.type]` com o mesmo valor, então os dois concordam.
 */
@Directive({
  selector: 'button[ndsCollapsibleTrigger]',
  standalone: true,
  hostDirectives: [RdxCollapsibleTriggerDirective],
  host: {
    type: 'button',
    '[attr.data-slot]': '"collapsible-trigger"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsCollapsibleTrigger {
  // O contexto da raiz, e não `inject(RdxCollapsibleRootDirective)`: a raiz está
  // em OUTRO elemento (o wrapper), então a injeção por diretiva não a alcança.
  private readonly root = injectCollapsibleRootContext();

  /** Espelha o estado do primitivo para o `data-state` das outras stacks. */
  protected readonly state = computed(() => (this.root.open() ? 'open' : 'closed'));
}

/**
 * Painel colapsável.
 *
 * `data-slot="collapsible-content"` — e não `-panel` — porque é esse o gancho
 * que o CSS compartilhado usa e que as outras quatro stacks emitem. O nome
 * `Panel` fica no seletor Angular, que segue a anatomia do primitivo.
 *
 * Fechado, o painel SAI do DOM (é o padrão do primitivo). `keepMounted` mantém o
 * elemento para quem precisa medir ou pré-carregar; `hiddenUntilFound` troca o
 * `hidden` por `hidden="until-found"`, o que deixa a busca do navegador achar e
 * abrir o conteúdo.
 */
@Directive({
  selector: 'div[ndsCollapsiblePanel]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxCollapsiblePanelDirective,
      inputs: ['id', 'keepMounted', 'hiddenUntilFound'],
    },
  ],
  host: {
    '[attr.data-slot]': '"collapsible-content"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsCollapsiblePanel {
  private readonly root = injectCollapsibleRootContext();

  protected readonly state = computed(() => (this.root.open() ? 'open' : 'closed'));
}

/** As três peças — conveniência para o `imports` de quem compõe. */
export const NDS_COLLAPSIBLE = [
  NdsCollapsible,
  NdsCollapsibleTrigger,
  NdsCollapsiblePanel,
] as const;
