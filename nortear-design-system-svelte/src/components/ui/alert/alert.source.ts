/**
 * Transforms do painel Code do Alert.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O ícone do alerta vai SEM `.nds-icon`: a folha dimensiona por
 * `.nds-alert > svg`, e a classe utilitária só duplicaria a regra.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type AlertArgs = {
  variant: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role: 'alert' | 'status' | 'note';
  /** Texto do título — string vazia publica a composição sem título. */
  title: string;
  description: string;
  dismissible: boolean;
};

export type AlertVariantName = AlertArgs['variant'];

const IMPORT_BASE = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
const IMPORT_INFO = `import Info from "@lucide/svelte/icons/info";`;
const IMPORT_ERROR = `import AlertCircle from "@lucide/svelte/icons/circle-alert";`;
const IMPORT_SUCCESS = `import CheckCircle2 from "@lucide/svelte/icons/circle-check-big";`;
const IMPORT_WARNING = `import TriangleAlert from "@lucide/svelte/icons/triangle-alert";`;

const TITLE_DEFAULT = 'Atenção';
const DESCRIPTION_DEFAULT = 'Suas alterações serão aplicadas na próxima sessão.';

/**
 * O ícone que acompanha cada variante, com o import que ele exige. `default` não
 * tem cor semântica, então recebe o informativo; `destructive` é a única cujo
 * nome de variante e nome de ícone não coincidem.
 *
 * O MESMO mapa é aplicado no render do Playground (`variantIcon`, em
 * `alert.stories.ts`). Com ele só de um lado, o painel prometia um ícone e a
 * tela mostrava outro.
 */
const VARIANT_ICON: Record<AlertVariantName, { component: string; importLine: string }> = {
  default: { component: 'Info', importLine: IMPORT_INFO },
  destructive: { component: 'AlertCircle', importLine: IMPORT_ERROR },
  success: { component: 'CheckCircle2', importLine: IMPORT_SUCCESS },
  warning: { component: 'TriangleAlert', importLine: IMPORT_WARNING },
  info: { component: 'Info', importLine: IMPORT_INFO },
};
const IMPORT_WITH_ACTION = `import {
  Alert,
  AlertAction,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";`;

/**
 * O callback de fechamento DECLARADO no exemplo — o snippet não ensina
 * `console.log`, e quem copia recebe um nome que existe.
 */
const DISMISS_HANDLER = `function handleDismiss() {
  // o alerta já saiu da tela: registre aqui a preferência de quem fechou
}`;

/**
 * Forma canônica: ícone, título e texto corrido dentro do alert.
 *
 * Serve o Playground e todas as stories cuja composição é a mesma — variante
 * padrão, alert completo, ícone no lugar de sempre. Só o que difere do padrão
 * entra como atributo.
 */
export function alertSource(_generated?: string, ctx?: { args?: Partial<AlertArgs> }): string {
  const {
    variant = 'default',
    role = 'alert',
    dismissible = false,
    title = TITLE_DEFAULT,
    description = DESCRIPTION_DEFAULT,
  } = ctx?.args ?? {};
  const icon = VARIANT_ICON[variant] ?? VARIANT_ICON.default;
  const props = attrsMultilinha([
    variant === 'default' ? '' : `variant="${variant}"`,
    role === 'alert' ? '' : `role="${role}"`,
    dismissible ? 'dismissible' : '',
    dismissible ? 'onDismiss={handleDismiss}' : '',
  ]);

  // O nível do heading entra SEMPRE que há título: o painel ensina o nível em
  // vez de deixar quem copia herdar o default `h5` do primitivo sem saber.
  const body = [
    `  <${icon.component} aria-hidden="true" />`,
    title ? `  <AlertTitle as="h4">${title}</AlertTitle>` : '',
    description ? `  <AlertDescription>${description}</AlertDescription>` : '',
  ].filter(Boolean);

  return svelteSnippet(
    `${IMPORT_BASE}
${icon.importLine}${dismissible ? `\n\n${DISMISS_HANDLER}` : ''}`,
    `<Alert${props}>
${body.join('\n')}
</Alert>`,
  );
}

/** Variante destrutiva: falha que interrompeu o que a pessoa estava fazendo. */
export function alertDestructiveSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_ERROR}`,
    `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" />
  <AlertTitle as="h4">Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`,
  );
}

/** Variante de sucesso: confirmação do que acabou de acontecer. */
export function alertSuccessSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_SUCCESS}`,
    `<Alert variant="success">
  <CheckCircle2 aria-hidden="true" />
  <AlertTitle as="h4">Perfil atualizado</AlertTitle>
  <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
</Alert>`,
  );
}

/** Variante de aviso: algo que ainda dá tempo de resolver. */
export function alertWarningSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_WARNING}`,
    `<Alert variant="warning">
  <TriangleAlert aria-hidden="true" />
  <AlertTitle as="h4">Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`,
  );
}

/** Variante informativa: contexto útil, sem urgência. */
export function alertInfoSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}`,
    `<Alert variant="info">
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Dica</AlertTitle>
  <AlertDescription>
    Você pode fixar os filtros mais usados para acessá-los mais rápido.
  </AlertDescription>
</Alert>`,
  );
}

/** Alert dispensável acionado pelo clique: variante padrão, preferência salva. */
export function alertDismissibleSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}

${DISMISS_HANDLER}`,
    `<Alert dismissible onDismiss={handleDismiss}>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Preferências salvas</AlertTitle>
  <AlertDescription>Você pode fechar este aviso quando quiser.</AlertDescription>
</Alert>`,
  );
}

/**
 * Alert dispensável acionado pelo teclado: o rótulo do botão de fechar diz O QUE
 * fecha, e é o que muda em relação à story do clique.
 */
export function alertDismissibleByKeyboardSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_SUCCESS}

${DISMISS_HANDLER}`,
    `<Alert
  variant="success"
  dismissible
  dismissLabel="Fechar confirmação"
  onDismiss={handleDismiss}
>
  <CheckCircle2 aria-hidden="true" />
  <AlertTitle as="h4">Perfil atualizado</AlertTitle>
  <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
</Alert>`,
  );
}

/**
 * As cinco variantes na mesma tela — é a composição que a medição de contraste
 * exige, porque medir uma por vez esconderia justamente a que reprova.
 */
export function alertContrastSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import type { AlertVariant } from "@/components/ui/alert";

const variants: AlertVariant[] = [
  "default",
  "destructive",
  "success",
  "warning",
  "info",
];`,
    `<div class="nds-stack" data-spacing="sm">
  {#each variants as variant (variant)}
    <Alert {variant}>
      <AlertTitle as="h4">Título {variant}</AlertTitle>
      <AlertDescription>Texto corrido da variante {variant}.</AlertDescription>
    </Alert>
  {/each}
</div>`,
  );
}

/** Sem título: a mensagem cabe numa frase e o título seria repetição. */
export function alertNoTitleSource(): string {
  return svelteSnippet(
    `import { Alert, AlertDescription } from "@/components/ui/alert";
${IMPORT_INFO}`,
    `<Alert>
  <Info aria-hidden="true" />
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>`,
  );
}

/** Estado sem ícone: a composição canônica, só sem o ícone. */
export function alertNoIconSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<Alert>
  <AlertTitle as="h4">Atenção</AlertTitle>
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>`,
  );
}

/** Composição com ícone: o SVG entra como filho direto e a folha o posiciona. */
export function alertWithIconSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}`,
    `<Alert>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Informação</AlertTitle>
  <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>
</Alert>`,
  );
}

/** Composição sem ícone: o alert mantém o layout de coluna única. */
export function alertLayoutWithoutIconSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<Alert>
  <AlertTitle as="h4">Sem ícone</AlertTitle>
  <AlertDescription>Alert sem ícone mantém layout de coluna única.</AlertDescription>
</Alert>`,
  );
}

/**
 * Conteúdo estático × mensagem urgente: `role="note"` não é live region, e a
 * omissão da prop mantém o padrão `role="alert"`, que interrompe o leitor.
 */
export function alertNoAnnouncementSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}
${IMPORT_ERROR}`,
    `<div class="nds-stack" data-spacing="md">
  <Alert role="note">
    <Info aria-hidden="true" />
    <AlertTitle as="h4">Nota de implementação</AlertTitle>
    <AlertDescription>
      Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.
    </AlertDescription>
  </Alert>

  <Alert variant="destructive">
    <AlertCircle aria-hidden="true" />
    <AlertTitle as="h4">Falha no envio</AlertTitle>
    <AlertDescription>
      Mensagem urgente surgida em tempo de execução: anúncio imediato.
    </AlertDescription>
  </Alert>
</div>`,
  );
}

/**
 * Mensagem que surge depois de uma ação: é o caso em que o `role="alert"`
 * padrão vale a pena, porque o leitor de tela anuncia na hora. O papel fica na
 * própria raiz — sem contêiner `aria-live` em volta, que aninharia duas regiões.
 *
 * O contêiner e a linha do botão são parte do exemplo: é o `nds-stack` que
 * separa o gatilho do alerta que surge, e é a linha própria que impede o stack
 * de esticar o botão na largura toda. Sem os dois, o painel publicava duas peças
 * soltas e quem copiasse não teria o espaçamento da tela.
 */
export function alertDynamicInsertionSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import { Button } from "@/components/ui/button";
${IMPORT_SUCCESS}

let generated = $state(false);`,
    `<div class="nds-stack" data-spacing="sm">
  <div>
    <Button variant="default" size="sm" onclick={() => (generated = true)}>Gerar relatório</Button>
  </div>
  {#if generated}
    <Alert>
      <CheckCircle2 aria-hidden="true" />
      <AlertTitle as="h4">Operação concluída</AlertTitle>
      <AlertDescription>O relatório foi gerado com sucesso.</AlertDescription>
    </Alert>
  {/if}
</div>`,
  );
}

/** Composição com ação: o botão fica na coluna à direita do texto. */
export function alertWithActionSource(): string {
  return svelteSnippet(
    `${IMPORT_WITH_ACTION}
${IMPORT_INFO}`,
    `<Alert>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Atualização disponível</AlertTitle>
  <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
  <AlertAction>
    <Button size="sm" variant="default">Atualizar</Button>
  </AlertAction>
</Alert>`,
  );
}

/**
 * Ação E botão de fechar no mesmo alerta: a ação ocupa a terceira coluna do grid
 * e o X segue na própria calha, à direita dela.
 */
export function alertWithActionAndDismissSource(): string {
  return svelteSnippet(
    `${IMPORT_WITH_ACTION}
${IMPORT_INFO}`,
    `<Alert dismissible>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>
  <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>
  <AlertAction>
    <Button size="sm" variant="default">Salvar agora</Button>
  </AlertAction>
</Alert>`,
  );
}

/**
 * Extensibilidade: a classe do consumidor SOMA às do design system em cada
 * subcomponente — não substitui.
 */
export function alertAdditionalClassSource(): string {
  return svelteSnippet(
    `${IMPORT_WITH_ACTION}
${IMPORT_INFO}`,
    `<Alert class="nds-w-full">
  <Info aria-hidden="true" />
  <AlertTitle as="h4" class="nds-w-full">Classe adicional</AlertTitle>
  <AlertDescription class="nds-w-full">
    A classe do consumidor convive com as do design system.
  </AlertDescription>
  <AlertAction class="nds-w-auto">
    <Button size="sm" variant="default">Ação</Button>
  </AlertAction>
</Alert>`,
  );
}
