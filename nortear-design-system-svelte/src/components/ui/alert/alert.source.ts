/**
 * Transforms do painel Code do Alert.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type AlertArgs = {
  variant: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role: 'alert' | 'status' | 'note';
  dismissible: boolean;
};

const IMPORT_BASE = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
const IMPORT_INFO = `import Info from "@lucide/svelte/icons/info";`;

/**
 * Forma canônica: ícone, título e texto corrido dentro do alert.
 *
 * Serve o Playground e todas as stories cuja composição é a mesma — variante
 * padrão, alert completo, ícone no lugar de sempre. Só o que difere do padrão
 * entra como atributo.
 */
export function alertSource(_gerado?: string, ctx?: { args?: Partial<AlertArgs> }): string {
  const { variant = 'default', role = 'alert', dismissible = false } = ctx?.args ?? {};
  const props = attrsMultilinha([
    variant === 'default' ? '' : `variant="${variant}"`,
    role === 'alert' ? '' : `role="${role}"`,
    dismissible ? 'dismissible' : '',
    dismissible ? 'onDismiss={() => console.log("fechado")}' : '',
  ]);

  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}`,
    `<Alert${props}>
  <Info class="nds-icon" aria-hidden="true" />
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
  <AlertCircle class="nds-icon" aria-hidden="true" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`,
  );
}

/** Variante de sucesso: confirmação do que acabou de acontecer. */
export function alertSucessoSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import CheckCircle2 from "@lucide/svelte/icons/circle-check-big";`,
    `<Alert variant="success">
  <CheckCircle2 class="nds-icon" aria-hidden="true" />
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
</Alert>`,
  );
}

/** Variante de aviso: algo que ainda dá tempo de resolver. */
export function alertAvisoSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import TriangleAlert from "@lucide/svelte/icons/triangle-alert";`,
    `<Alert variant="warning">
  <TriangleAlert class="nds-icon" aria-hidden="true" />
  <AlertTitle>Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`,
  );
}

/** Variante informativa: contexto útil, sem urgência. */
export function alertInformativoSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}`,
    `<Alert variant="info">
  <Info class="nds-icon" aria-hidden="true" />
  <AlertTitle>Dica</AlertTitle>
  <AlertDescription>
    Você pode fixar seus filtros favoritos para acessá-los mais rápido.
  </AlertDescription>
</Alert>`,
  );
}

/**
 * Alert dispensável — serve tanto a story do clique quanto a do teclado: o botão
 * de fechar é o mesmo elemento nos dois caminhos.
 */
export function alertDismissivelSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
${IMPORT_INFO}`,
    `<Alert dismissible onDismiss={() => console.log("fechado")}>
  <Info class="nds-icon" aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
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

const variantes: AlertVariant[] = [
  "default",
  "destructive",
  "success",
  "warning",
  "info",
];`,
    `<div class="nds-stack" data-spacing="sm">
  {#each variantes as variante (variante)}
    <Alert variant={variante}>
      <AlertTitle>Título {variante}</AlertTitle>
      <AlertDescription>Texto corrido da variante {variante}.</AlertDescription>
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
  <Info class="nds-icon" aria-hidden="true" />
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>`,
  );
}

/** Sem ícone: o alert mantém o layout de coluna única. */
export function alertNoIconSource(): string {
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
    `<div class="nds-stack" data-spacing="sm">
  <Alert role="note">
    <Info class="nds-icon" aria-hidden="true" />
    <AlertTitle>Nota de implementação</AlertTitle>
    <AlertDescription>
      Conteúdo já presente quando a página carrega — não deve ser anunciado.
    </AlertDescription>
  </Alert>

  <Alert variant="destructive">
    <AlertCircle class="nds-icon" aria-hidden="true" />
    <AlertTitle>Erro ao salvar</AlertTitle>
    <AlertDescription>
      Mensagem urgente inserida em tempo de execução — anunciada de imediato.
    </AlertDescription>
  </Alert>
</div>`,
  );
}

/**
 * Mensagem que surge depois do carregamento: é o caso em que o `role="alert"`
 * padrão vale a pena, porque o leitor de tela anuncia na hora.
 */
export function alertInsercaoDinamicaSource(): string {
  return svelteSnippet(
    `${IMPORT_BASE}
import CheckCircle2 from "@lucide/svelte/icons/circle-check-big";`,
    `<Alert>
  <CheckCircle2 class="nds-icon" aria-hidden="true" />
  <AlertTitle>Operação concluída</AlertTitle>
  <AlertDescription>O relatório foi gerado com sucesso.</AlertDescription>
</Alert>`,
  );
}

/** Composição com ação: o botão fica no canto superior direito. */
export function alertWithActionSource(): string {
  return svelteSnippet(
    `import {
  Alert,
  AlertAction,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
${IMPORT_INFO}`,
    `<Alert>
  <Info class="nds-icon" aria-hidden="true" />
  <AlertTitle>Atualização disponível</AlertTitle>
  <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
  <AlertAction>
    <Button size="sm" variant="default">Atualizar</Button>
  </AlertAction>
</Alert>`,
  );
}

/**
 * Extensibilidade: a classe do consumidor SOMA às do design system em cada
 * subcomponente — não substitui.
 */
export function alertClassNameAdicionalSource(): string {
  return svelteSnippet(
    `import {
  Alert,
  AlertAction,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
${IMPORT_INFO}`,
    `<Alert class="nds-w-full">
  <Info class="nds-icon" aria-hidden="true" />
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
