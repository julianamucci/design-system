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
  const inLine = `${indentacao}<Switch ${props.join(' ')} />`;
  if (inLine.length <= 78) return inLine;
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
    labelText = 'Receber notificações',
    descriptionText = 'Receba novidades e promoções da plataforma.',
  } = ctx?.args ?? {};

  const hasLabel = withDescription || withLabel;

  const props = [
    'id="opcao"',
    'bind:checked={ligado}',
    name ? `name="${name}"` : '',
    size === 'sm' ? 'size="sm"' : '',
    disabled ? 'disabled' : '',
    ariaInvalid ? 'aria-invalid="true"' : '',
    // Sem rótulo visível o nome tem de vir de `aria-label`: o controle continua
    // precisando ser anunciado com o mesmo texto que o rótulo traria.
    hasLabel ? 'aria-labelledby="opcao-label"' : `aria-label="${ariaLabel}"`,
    withDescription ? 'aria-describedby="opcao-description"' : '',
  ].filter((prop) => prop !== '');

  const script = `import { Switch } from "@/components/ui/switch";${
    hasLabel ? '\nimport { Label } from "@/components/ui/label";' : ''
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

/**
 * Lista de configurações: painéis idênticos empilhados, um por preferência.
 *
 * Escrita por extenso, e não mapeada de um array: no snippet o que importa é a
 * FORMA de cada linha, e um `#each` esconderia justamente ela.
 */
export function switchSettingsListSource(): string {
  const painel = (id: string, label: string, descricao: string, ligado = false) => `  <div
    class="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
    data-align="center"
    data-justify="between"
  >
    <div class="nds-stack nds-pr-4" data-spacing="xs">
      <Label id="${id}-label" for="${id}" class="nds-text-body nds-font-medium">${label}</Label>
      <p class="nds-text-body">${descricao}</p>
    </div>
    <Switch id="${id}"${ligado ? ' checked' : ''} aria-labelledby="${id}-label" />
  </div>`;

  return svelteSnippet(
    `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";`,
    `<div class="nds-stack nds-w-md" data-spacing="sm">
  <p class="nds-text-body nds-font-semibold nds-mb-2">Preferências de notificação</p>
${painel('pref-email', 'Receber novidades por email', 'Resumo semanal sobre o produto.', true)}
${painel('pref-push', 'Receber notificações push', 'Alertas no dispositivo em tempo real.')}
${painel('pref-sms', 'Alertas por SMS', 'Eventos críticos via mensagem de texto.')}
</div>`,
  );
}

/**
 * Em formulário: o `name` é o que faz o switch entrar no envio nativo — sem ele
 * o campo simplesmente não é enviado, e nada no visual denuncia.
 */
export function switchFormSource(): string {
  return svelteSnippet(
    `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

let ligado = $state(true);`,
    `<form class="nds-stack nds-w-sm" data-spacing="sm" onsubmit={(e) => e.preventDefault()}>
  <div class="nds-cluster" data-spacing="sm">
    <Switch
      id="newsletter"
      name="newsletter"
      bind:checked={ligado}
      aria-labelledby="newsletter-label"
    />
    <Label id="newsletter-label" for="newsletter" class="nds-text-body nds-font-medium">
      Aceitar newsletter semanal
    </Label>
  </div>
  <Button type="submit">Salvar preferências</Button>
</form>`,
  );
}

/**
 * Controlado por estado externo. `bind:checked` é a ligação de ida E volta:
 * passar só o valor deixaria o interruptor inerte — ele deixa de ser dono do
 * próprio estado e ninguém assume o lugar.
 */
export function switchControlledSource(): string {
  return svelteSnippet(
    `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

let ativo = $state(false);`,
    `<div class="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
  <div class="nds-cluster" data-spacing="sm">
    <Switch id="opcao" bind:checked={ativo} aria-labelledby="opcao-label" />
    <Label id="opcao-label" for="opcao" class="nds-text-body nds-font-medium">
      Receber notificações
    </Label>
  </div>
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code class="nds-font-mono">{ativo}</code>
  </p>
</div>`,
  );
}
