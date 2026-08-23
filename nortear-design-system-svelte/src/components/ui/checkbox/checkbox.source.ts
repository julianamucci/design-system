/**
 * Transforms do painel Code do Checkbox.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type CheckboxArgs = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  ariaInvalid: boolean;
  withLabel: boolean;
  withDescription: boolean;
  labelText: string;
  descriptionText: string;
};

/** Um id só para o par caixa+rótulo: é ele que sustenta o `for`/`id`. */
const ID = 'opcao';

const LABEL_DEFAULT = 'Aceito os termos e condições';
const HELPER_DEFAULT = 'Ao marcar esta opção, você concorda com os termos de uso.';

/**
 * Uma linha por atributo quando a fila passa da largura útil do painel — fila
 * longa demais some na barra de rolagem.
 */
function tag(name: string, partes: Array<string | false | ''>, recuo = ''): string {
  const list = partes.filter((parte): parte is string => Boolean(parte));
  const inLine = `<${name}${attrs(...list)} />`;
  if (recuo.length + inLine.length <= 76) return inLine;
  return `<${name}\n${list.map((parte) => `${recuo}  ${parte}`).join('\n')}\n${recuo}/>`;
}

/**
 * Forma canônica: a caixa com o rótulo ao lado, marcada por estado próprio.
 *
 * Serve o Playground e cascateia para as stories que não declaram override.
 */
export function checkboxSource(_gerado?: string, ctx?: { args?: Partial<CheckboxArgs> }): string {
  const {
    checked = false,
    indeterminate = false,
    disabled = false,
    ariaInvalid = false,
    withLabel = true,
    withDescription = false,
    labelText = LABEL_DEFAULT,
    descriptionText = HELPER_DEFAULT,
  } = ctx?.args ?? {};

  const hasLabel = withLabel || withDescription;

  const imports = [
    'import { Checkbox } from "@/components/ui/checkbox";',
    hasLabel ? 'import { Label } from "@/components/ui/label";' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const state = [
    `let marcado = $state(${checked});`,
    indeterminate ? 'let parcial = $state(true);' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const props = [
    hasLabel ? `id="${ID}"` : '',
    'bind:checked={marcado}',
    indeterminate ? 'bind:indeterminate={parcial}' : '',
    disabled ? 'disabled' : '',
    ariaInvalid ? 'aria-invalid="true"' : '',
    withDescription ? `aria-describedby="${ID}-apoio"` : '',
    // A caixa alinha pelo topo quando o texto ao lado tem mais de uma linha.
    withDescription ? 'class="nds-mt-0-5"' : '',
    hasLabel ? '' : `aria-label="${labelText}"`,
  ];

  const script = `${imports}\n\n${state}`;

  // `data-disabled` na linha é o que apaga o rótulo junto da caixa: sem ele o
  // texto continua com o contraste cheio ao lado de um controle indisponível.
  const line = `<div class="nds-cluster" data-spacing="sm"${
    disabled ? ' data-disabled="true"' : ''
  }>`;

  if (withDescription) {
    return svelteSnippet(
      script,
      `${line}
  ${tag('Checkbox', props, '  ')}
  <div class="nds-stack" data-spacing="xs">
    <Label for="${ID}">${labelText}</Label>
    <p id="${ID}-apoio" class="nds-text-body">${descriptionText}</p>
  </div>
</div>`,
    );
  }

  if (withLabel) {
    return svelteSnippet(
      script,
      `${line}
  ${tag('Checkbox', props, '  ')}
  <Label for="${ID}">${labelText}</Label>
</div>`,
    );
  }

  return svelteSnippet(script, tag('Checkbox', props));
}

/** Stories `Default` (variações e composições): a caixa sozinha, rotulada por ARIA. */
export function checkboxNoLabelSource(): string {
  return checkboxSource('', { args: { withLabel: false } });
}

/** Variação `Checked`: a caixa sozinha já marcada. */
export function checkboxCheckedSource(): string {
  return checkboxSource('', { args: { checked: true, withLabel: false } });
}

/** Variação `Indeterminate`: a caixa sozinha em seleção parcial. */
export function checkboxIndeterminadoSource(): string {
  return checkboxSource('', { args: { indeterminate: true, withLabel: false } });
}

/** Composição `WithDescription`: rótulo com texto de apoio abaixo. */
export function checkboxWithDescriptionSource(): string {
  return checkboxSource('', {
    args: {
      withLabel: false,
      withDescription: true,
      labelText: 'Receber novidades por email',
      descriptionText:
        'Ao marcar esta opção, você concorda em receber comunicações de marketing.',
    },
  });
}

/** Estado `Checked`: o par completo já marcado ao montar. */
export function checkboxCheckedWithLabelSource(): string {
  return checkboxSource('', { args: { checked: true } });
}

/** Composição `WithLabelChecked`: o mesmo par marcado, com rótulo de sessão. */
export function checkboxManterSessaoSource(): string {
  return checkboxSource('', { args: { checked: true, labelText: 'Manter sessão ativa' } });
}

/** Seleção parcial de um grupo — o rótulo diz o que a caixa comanda. */
export function checkboxSelectAllSource(): string {
  return checkboxSource('', {
    args: { indeterminate: true, labelText: 'Selecionar todos os itens' },
  });
}

/** Estado `Disabled`: indisponível, e o rótulo apaga junto. */
export function checkboxDisabledSource(): string {
  return checkboxSource('', { args: { disabled: true } });
}

/** Estado `DisabledChecked`: indisponível não é o mesmo que vazio. */
export function checkboxDisabledCheckedSource(): string {
  return checkboxSource('', { args: { checked: true, disabled: true } });
}

/** Estado `Error`: inválido pelo canal ARIA, e ainda operável. */
export function checkboxWithErrorSource(): string {
  return checkboxSource('', { args: { ariaInvalid: true } });
}

/**
 * Composição `InForm`: a caixa dentro de um formulário nativo.
 *
 * `name` e `value` são o que faz o valor participar do envio — sem eles a
 * caixa marca na tela e não chega ao servidor.
 */
export function formCheckboxSource(): string {
  return svelteSnippet(
    `import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

let marcado = $state(true);`,
    `<form class="nds-stack" data-spacing="md">
  <div class="nds-cluster" data-spacing="sm">
    <Checkbox
      id="termos"
      bind:checked={marcado}
      name="termos"
      value="aceito"
    />
    <Label for="termos">Aceito os termos e condições</Label>
  </div>
  <Button type="submit">Enviar</Button>
</form>`,
  );
}
