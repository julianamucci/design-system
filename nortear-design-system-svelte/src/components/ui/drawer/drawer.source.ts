/**
 * Transforms do painel Code do Drawer.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type DrawerArgs = {
  direction: 'bottom' | 'top' | 'left' | 'right';
  /** Estado inicial. A API real é `open`, que é ligável nos dois sentidos. */
  defaultOpen: boolean;
  open: boolean;
  dismissible: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  cancelLabel: string;
};

const IMPORT_BASE = `import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";`;

const IMPORT_WITH_BODY = `import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";`;

const IMPORT_WITH_FIELDS = `${IMPORT_WITH_BODY}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`;

type Frame = {
  imports?: string;
  isOpen?: boolean;
  direction?: DrawerArgs['direction'];
  dismissible?: boolean;
  /**
   * Nível do cabeçalho do título. Ausente, o snippet não escreve nível nenhum.
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  triggerLabel: string;
  title: string;
  description: string;
  /** Corpo entre o cabeçalho e o rodapé, já indentado em 4 espaços. */
  body?: string;
  actionLabel: string;
  cancelLabel: string;
  /**
   * Painel de confirmação: o foco entra no fechador do rodapé, a saída segura.
   * Só onde a decisão É a tela — no painel de formulário o padrão fica.
   */
  focusOnSafeExit?: boolean;
  /**
   * Id do `<form>` do corpo, quando há um. O rodapé é IRMÃO do corpo por
   * construção do primitivo — `.nds-drawer-body` só rola enquanto é filho
   * direto do flex column do painel —, então o `<form>` não pode envolvê-lo: é
   * o par id ↔ `form` que os religa. Sem o atributo, com dois campos o
   * navegador não faz submissão implícita e o Enter num campo não dispara nada.
   */
  formId?: string;
};

/**
 * O gancho de foco desta stack, tal como a story o escreve.
 *
 * `onOpenAutoFocus` é o que o primitivo oferece para escolher o alvo, e o painel
 * vem do REF — não de `event.target`. A lib não DESPACHA este evento: ela
 * constrói um `CustomEvent` e o entrega direto ao callback, então o alvo é
 * `null`. O snippet ensinava a lê-lo, e quem copiasse levava um no-op: sem
 * `preventDefault()` a lib seguia com o padrão dela, focando o primeiro
 * tabbable — que num painel com corpo rolável é o corpo.
 *
 * O `tick()` não é cautela: só depois do commit pendente o rodapé está no DOM e
 * o ref, preenchido. `preventDefault()` fica ANTES dele, porque a lib lê
 * `defaultPrevented` assim que o callback volta.
 */
const FOCUS_SCRIPT = `
let panelEl = $state<HTMLElement | null>(null);

async function focusSafeExit(event: Event) {
  event.preventDefault();
  await tick();
  if (!panelEl) return;
  const safeExit = panelEl.querySelector<HTMLElement>('[data-slot="drawer-close"]');
  (safeExit ?? panelEl).focus();
}`;

/**
 * Título do painel, com o nível de cabeçalho quando ele é pedido.
 *
 * A delegação vai pelo snippet `child`: nesta lib o `level` sozinho troca o
 * `aria-level` e mantém a TAG em `div`. Os dois andam juntos para a tag e o
 * ARIA concordarem. Sem nível pedido nada disso é escrito — valor padrão não
 * se escreve num exemplo que alguém copia.
 */
function panelTitle(title: string, level?: 1 | 2 | 3 | 4 | 5 | 6): string {
  if (!level) return `<DrawerTitle>${title}</DrawerTitle>`;
  return `<DrawerTitle level={${level}}>
        {#snippet child({ props })}
          <h${level} {...props}>${title}</h${level}>
        {/snippet}
      </DrawerTitle>`;
}

/**
 * Estrutura comum a todas as composições: raiz com estado ligado, gatilho,
 * painel, cabeçalho, corpo opcional e rodapé com a ação e a saída.
 */
function panel({
  imports = IMPORT_BASE,
  isOpen = false,
  direction = 'bottom',
  dismissible = true,
  titleLevel,
  triggerLabel,
  title,
  description,
  body = '',
  actionLabel,
  cancelLabel,
  focusOnSafeExit = false,
  formId,
}: Frame): string {
  const rootProps = attrs(
    direction === 'bottom' ? '' : `direction="${direction}"`,
    dismissible ? '' : 'dismissible={false}',
  );
  const miolo = body ? `\n${body}` : '';
  const importTick = focusOnSafeExit ? `import { tick } from "svelte";\n` : '';
  const contentProps = focusOnSafeExit
    ? ' bind:ref={panelEl} onOpenAutoFocus={focusSafeExit}'
    : '';
  const acaoProps = formId ? ` type="submit" form="${formId}"` : '';

  return svelteSnippet(
    `${importTick}${imports}

let open = $state(${isOpen});${focusOnSafeExit ? `\n${FOCUS_SCRIPT}` : ''}`,
    `<Drawer bind:open${rootProps}>
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${triggerLabel}</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent${contentProps}>
    <DrawerHeader>
      ${panelTitle(title, titleLevel)}
      <DrawerDescription>${description}</DrawerDescription>
    </DrawerHeader>${miolo}
    <DrawerFooter>
      <DrawerClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${cancelLabel}</Button>
        {/snippet}
      </DrawerClose>
      <Button${acaoProps}>${actionLabel}</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
  );
}

/** Forma canônica: painel deslizante com cabeçalho e par de ações no rodapé. */
export function drawerSource(_gerado?: string, ctx?: { args?: Partial<DrawerArgs> }): string {
  const {
    direction = 'bottom',
    defaultOpen = false,
    open,
    dismissible = true,
    triggerLabel = 'Abrir drawer',
    title = 'Editar perfil',
    description = 'Atualize seus dados pessoais e foto.',
    actionLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
  } = ctx?.args ?? {};

  return panel({
    isOpen: open ?? defaultOpen,
    direction,
    dismissible,
    triggerLabel,
    title,
    description,
    actionLabel,
    cancelLabel,
  });
}

/**
 * Painel aberto de dentro de uma seção que já está em `h2`: o título pede `h3`.
 *
 * A única diferença para a forma canônica é o nível do cabeçalho.
 */
export function drawerHeadingH3Source(): string {
  return panel({
    isOpen: true,
    titleLevel: 3,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seus dados.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
  });
}

/**
 * Composição com formulário curto no corpo, em painel lateral.
 *
 * Quem confirma é o ENVIO do formulário, e o elo é o par id ↔ `form`: ver a
 * nota de `formId` em `Frame`. Sem ele o botão fica inerte e o Enter num campo
 * não dispara nada — com dois campos não há submissão implícita que salve.
 */
export function drawerWithFormSource(): string {
  return panel({
    imports: IMPORT_WITH_FIELDS,
    isOpen: true,
    direction: 'right',
    triggerLabel: 'Editar dados',
    title: 'Editar dados pessoais',
    description: 'Atualize seu nome e e-mail.',
    body: `    <DrawerBody>
      <form
        id="drawer-form"
        class="nds-grid"
        data-spacing="sm"
        onsubmit={(event: SubmitEvent) => event.preventDefault()}
      >
        <div class="nds-grid" data-spacing="xs">
          <Label for="drawer-nome">Nome</Label>
          <Input id="drawer-nome" type="text" value="Maria Silva" />
        </div>
        <div class="nds-grid" data-spacing="xs">
          <Label for="drawer-email">E-mail</Label>
          <Input id="drawer-email" type="email" value="maria@exemplo.com" />
        </div>
      </form>
    </DrawerBody>`,
    formId: 'drawer-form',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  });
}

/**
 * Composição de confirmação reversível: mensagem curta e par de ações.
 *
 * Aqui a decisão É a tela, e por isso o painel abre com o foco no cancelar —
 * a mesma escolha do AlertDialog. No painel de formulário isso NÃO vale: ali o
 * assunto é editar, e o foco continua indo para o primeiro campo.
 */
export function drawerWithConfirmSource(): string {
  return panel({
    focusOnSafeExit: true,
    imports: IMPORT_WITH_BODY,
    isOpen: true,
    triggerLabel: 'Remover anexo',
    title: 'Remover anexo?',
    description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
    body: `    <DrawerBody class="nds-text-body nds-text-muted-foreground">
      <p>Confirme a ação para prosseguir. Esta operação pode ser desfeita depois.</p>
    </DrawerBody>`,
    actionLabel: 'Remover',
    cancelLabel: 'Cancelar',
  });
}

/**
 * Corpo mais alto que o painel.
 *
 * Sem altura cravada: o corpo já rola dentro do teto de altura do painel, e é
 * ele quem cede altura — o rodapé com as ações continua visível.
 */
export function drawerWithScrollSource(): string {
  return panel({
    imports: IMPORT_WITH_BODY,
    isOpen: true,
    triggerLabel: 'Ler termos',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    body: `    <DrawerBody class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm" aria-label="Termos de uso">
      <p>Parágrafo 1: conteúdo extenso o bastante para o corpo passar da altura do painel.</p>
      <p>Parágrafo 2: quem rola é o corpo, e o rodapé continua alcançável.</p>
    </DrawerBody>`,
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  });
}
