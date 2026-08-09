import { Directive } from '@angular/core';

// ─── Label ────────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-label (docs/shared/styles/nds/label.css). O estado
// disabled propaga por CSS — via controle irmão (`.peer`) ou por ancestral com
// `data-disabled="true"` / `fieldset:disabled`.
//
// SEM inputs. Tudo que o Label precisa já é nativo do HTML:
//   `for`   → associação com o controle (atributo nativo)
//   `class` → o Angular mescla com a classe do host
//   texto   → conteúdo do próprio elemento
// Uma diretiva sem input não é diretiva à toa: ela é o que carrega a classe e o
// `data-slot`, e é por eles que story, teste e CSS encontram o componente.
//
// SEM `RdxLabelDirective`, apesar de ele contribuir comportamento (evita
// seleção de texto no duplo-clique). O motivo é de contrato, não de qualidade:
// React, Vue, Svelte e Vanilla renderizam um <label> puro com .nds-label e
// nenhum deles tem esse comportamento. Compor aqui daria ao Angular um
// comportamento e um atributo `id` gerado que nenhuma outra stack emite — que
// é exatamente o tipo de divergência que a auditoria cross-stack caça. Se o
// design system decidir adotar a prevenção de seleção, ela entra nas cinco
// stacks de uma vez, não só nesta.

@Directive({
  selector: 'label[ndsLabel]',
  standalone: true,
  host: {
    class: 'nds-label',
    '[attr.data-slot]': '"label"',
  },
})
export class NdsLabel {}
