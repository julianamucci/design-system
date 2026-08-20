/**
 * Transforms do painel Code do Switch.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * Uma transform só cobre o componente inteiro: as três composições que as
 * stories exercitam (rótulo à direita, painel com descrição, e sem rótulo
 * visível) são as MESMAS que os args descrevem, então a cascata do meta já
 * entrega o snippet certo em cada story sem override nenhum.
 */
import { svelteSnippet } from '@/lib/story-source';

export type SwitchArgs = {
  checked: boolean;
  disabled: boolean;
  ariaInvalid: boolean;
  ariaLabel: string;
  name: string;
  size: 'default' | 'sm';
  withLabel: boolean;
  withDescription: boolean;
  labelText: string;
  descriptionText: string;
};

/**
 * A tag do controle, em linha única enquanto couber e uma prop por linha
 * quando não couber — fila longa demais some na barra de rolagem do painel.
 */
function tagDoSwitch(props: string[], indentacao: string): string {
  const emLinha = `${indentacao}<Switch ${props.join(' ')} />`;
  if (emLinha.length <= 78) return emLinha;
  return `${indentacao}<Switch\n${props
    .map((prop) => `${indentacao}  ${prop}`)
    .join('\n')}\n${indentacao}/>`;
}

/**
 * Forma canônica: o controle e o seu rótulo.
 *
 * Serve o Playground e cascateia para variantes, estados e composições. Só
 * escreve o que difere do padrão do componente (`checked=false`,
 * `size="default"`, habilitado e válido); o que nunca sai é a associação com o
 * rótulo — um switch sem nome acessível é anunciado só como "botão".
 */
export function switchSource(_gerado?: string, ctx?: { args?: Partial<SwitchArgs> }): string {
  const {
    checked = false,
    disabled = false,
    ariaInvalid = false,
    ariaLabel = 'Alternar',
    name,
    size = 'default',
    withLabel = true,
    withDescription = false,
    labelText = 'Receber notificações por email',
    descriptionText = 'Receba novidades e promoções da plataforma.',
  } = ctx?.args ?? {};

  const comRotulo = withDescription || withLabel;

  const props = [
    'id="opcao"',
    'bind:checked={ligado}',
    name ? `name="${name}"` : '',
    size === 'sm' ? 'size="sm"' : '',
    disabled ? 'disabled' : '',
    ariaInvalid ? 'aria-invalid="true"' : '',
    // Sem rótulo visível o nome tem de vir de `aria-label`: o controle continua
    // precisando ser anunciado com o mesmo texto que o rótulo traria.
    comRotulo ? 'aria-labelledby="opcao-label"' : `aria-label="${ariaLabel}"`,
    withDescription ? 'aria-describedby="opcao-description"' : '',
  ].filter((prop) => prop !== '');

  const script = `import { Switch } from "@/components/ui/switch";${
    comRotulo ? '\nimport { Label } from "@/components/ui/label";' : ''
  }

let ligado = $state(${checked});`;

  if (withDescription) {
    return svelteSnippet(
      script,
      `<div
  class="nds-cluster nds-w-sm"
  data-align="center"
  data-justify="between"
  data-spacing="md"
>
  <div class="nds-stack" data-spacing="xs">
    <Label id="opcao-label" for="opcao" class="nds-text-body nds-font-medium">
      ${labelText}
    </Label>
    <p id="opcao-description" class="nds-text-body">${descriptionText}</p>
  </div>
${tagDoSwitch(props, '  ')}
</div>`,
    );
  }

  if (withLabel) {
    return svelteSnippet(
      script,
      `<div class="nds-cluster" data-spacing="sm">
${tagDoSwitch(props, '  ')}
  <Label id="opcao-label" for="opcao" class="nds-text-body nds-font-medium">
    ${labelText}
  </Label>
</div>`,
    );
  }

  return svelteSnippet(script, tagDoSwitch(props, ''));
}
