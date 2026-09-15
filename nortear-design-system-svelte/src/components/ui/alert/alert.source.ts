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
  dismissible: boolean;
};

const IMPORT_BASE = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
const IMPORT_INFO = `import Info from "@lucide/svelte/icons/info";`;
const IMPORT_SUCCESS = `import CheckCircle2 from "@lucide/svelte/icons/circle-check-big";`;
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
  const { variant = 'default', role = 'alert', dismissible = false } = ctx?.args ?? {};
  const props = attrsMultilinha([
    variant === 'default' ? '' : `variant="${variant}"`,
    role === 'alert' ? '' : `role="${role}"`,
    dismissible ? 'dismissible' : '',
    dismissible ? 'onDismiss={handleDismiss}' : '',
  ]);

  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}${dismissible ? `\n\n${DISMISS_HANDLER}` : ''}`,
    `<Alert${props}>
  <Info aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>`,
  );
}

/** Variante destrutiva: falha que interrompeu o que a pessoa estava fazendo. */
export function alertDestructiveSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import AlertCircle from "@lucide/svelte/icons/circle-alert";`,
    `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" />
  <AlertTitle>Erro ao salvar</AlertTitle>
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
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
</Alert>`,
  );
}

/** Variante de aviso: algo que ainda dá tempo de resolver. */
export function alertWarningSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import TriangleAlert from "@lucide/svelte/icons/triangle-alert";`,
    `<Alert variant="warning">
  <TriangleAlert aria-hidden="true" />
  <AlertTitle>Assinatura expirando</AlertTitle>
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
  <AlertTitle>Dica</AlertTitle>
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
  <AlertTitle>Preferências salvas</AlertTitle>
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
  <AlertTitle>Perfil atualizado</AlertTitle>
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
      <AlertTitle>Título {variant}</AlertTitle>
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
  <AlertTitle>Atenção</AlertTitle>
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
  <AlertTitle>Informação</AlertTitle>
  <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>
</Alert>`,
  );
}

/** Composição sem ícone: o alert mantém o layout de coluna única. */
export function alertLayoutWithoutIconSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<Alert>
  <AlertTitle>Sem ícone</AlertTitle>
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
import AlertCircle from "@lucide/svelte/icons/circle-alert";`,
    `<div class="nds-stack" data-spacing="md">
  <Alert role="note">
    <Info aria-hidden="true" />
    <AlertTitle>Nota de implementação</AlertTitle>
    <AlertDescription>
      Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.
    </AlertDescription>
  </Alert>

  <Alert variant="destructive">
    <AlertCircle aria-hidden="true" />
    <AlertTitle>Falha no envio</AlertTitle>
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
 */
export function alertDynamicInsertionSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import { Button } from "@/components/ui/button";
${IMPORT_SUCCESS}

let generated = $state(false);`,
    `<Button variant="default" size="sm" onclick={() => (generated = true)}>Gerar relatório</Button>

{#if generated}
  <Alert>
    <CheckCircle2 aria-hidden="true" />
    <AlertTitle>Operação concluída</AlertTitle>
    <AlertDescription>O relatório foi gerado com sucesso.</AlertDescription>
  </Alert>
{/if}`,
  );
}

/** Composição com ação: o botão fica na coluna à direita do texto. */
export function alertWithActionSource(): string {
  return svelteSnippet(
    `${IMPORT_WITH_ACTION}
${IMPORT_INFO}`,
    `<Alert>
  <Info aria-hidden="true" />
  <AlertTitle>Atualização disponível</AlertTitle>
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
  <AlertTitle>Sessão expira em 5 minutos</AlertTitle>
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
  <AlertTitle class="nds-w-full">Classe adicional</AlertTitle>
  <AlertDescription class="nds-w-full">
    A classe do consumidor convive com as do design system.
  </AlertDescription>
  <AlertAction class="nds-w-auto">
    <Button size="sm" variant="default">Ação</Button>
  </AlertAction>
</Alert>`,
  );
}
