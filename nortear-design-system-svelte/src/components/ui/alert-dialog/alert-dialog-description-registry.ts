/**
 * Registro da descrição do AlertDialog — é ele que decide o `aria-describedby`.
 *
 * A descrição é opcional (D4 do PRD). O primitivo desta stack grava o id da
 * descrição no estado da raiz quando ela monta e NÃO o apaga quando ela sai
 * (`DialogDescriptionState`, em `bits-ui/dist/bits/dialog/dialog.svelte.js`):
 * tirar o parágrafo em tempo de execução deixava o painel apontando para um id
 * que não existe mais — o que o axe reprova em `aria-valid-attr-value` e o
 * leitor de tela anuncia como nada. E o valor da lib vence o de quem consome no
 * `mergeProps`, então não havia como corrigir por fora.
 *
 * Por isso a descrição deste design system não usa a peça da lib: ela se
 * registra no painel mais próximo enquanto está montada, e o painel declara o
 * atributo a partir do registro — presente com descrição, ausente sem ela, e
 * ausente de novo quando ela sai. É a mesma solução do Vue, pelo mesmo motivo.
 */
import { getContext, setContext } from 'svelte';

export type DescriptionRegistry = {
  /** Registra o id da descrição e devolve a função que o retira. */
  register(id: string): () => void;
};

const KEY = Symbol('alert-dialog-description-registry');

export function setDescriptionRegistry(registry: DescriptionRegistry): void {
  setContext(KEY, registry);
}

/** `undefined` fora de um AlertDialogContent — a descrição só não se registra. */
export function getDescriptionRegistry(): DescriptionRegistry | undefined {
  return getContext<DescriptionRegistry | undefined>(KEY);
}
