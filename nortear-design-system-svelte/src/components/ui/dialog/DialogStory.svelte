<script lang="ts">
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { useTranslation } from '@/lib/i18n';
  import dialogTranslations from '@shared/content/dialog/translations.json';

  // Os rótulos padrão saem do conteúdo compartilhado, e não de literais em
  // pt-BR: cravados aqui, a story mostrava português com a barra de idiomas em
  // inglês ou espanhol, e o mesmo texto vivia em cinco arquivos desta stack.
  const { t } = useTranslation(dialogTranslations);

  type Variant =
    | 'default'
    | 'withForm'
    | 'withScrollContent'
    | 'noFooter'
    | 'withDestructiveAction'
    | 'customCloseInFooter';

  interface Props {
    open?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    /** Texto corrido do corpo, entre o cabeçalho e o rodapé. */
    bodyText?: string;
    actionLabel?: string;
    cancelLabel?: string;
    /**
     * Rótulo do fechar que desce para o RODAPÉ quando o X do canto está
     * desligado. Não é o `closeLabel` do Content, que nomeia o X — aqui o X não
     * existe, e o fechar é uma ação como as outras duas.
     */
    footerCloseLabel?: string;
    showCloseButton?: boolean;
    /**
     * Nível do cabeçalho do título. Ausente, o título fica no nível padrão do
     * primitivo — é o que todas as outras stories deste andaime exercitam.
     */
    titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    variant?: Variant;
    onAction?: () => void;
    onCancel?: () => void;
  }

  let {
    open = $bindable(false),
    triggerLabel = t('demonstration.labels.triggerLabel'),
    title = t('demonstration.labels.title'),
    description = t('demonstration.labels.description'),
    bodyText,
    actionLabel = t('demonstration.labels.action'),
    cancelLabel = t('demonstration.labels.cancel'),
    footerCloseLabel = t('demonstration.labels.close'),
    showCloseButton = true,
    titleLevel,
    variant = 'default',
    onAction,
    onCancel,
  }: Props = $props();
</script>

{#key `${variant}-${showCloseButton}`}
  <Dialog bind:open>
    <DialogTrigger>
      {#snippet child({ props })}
        <Button variant="outline" {...props}>{triggerLabel}</Button>
      {/snippet}
    </DialogTrigger>
    <DialogContent {showCloseButton}>
      <DialogHeader>
        <!--
          O nível do cabeçalho vai pelo snippet `child`, e não pelo `level`
          sozinho. MEDIDO em 2026-09-09, bits-ui 2.19.0: o `dialog-title.svelte`
          da lib renderiza `<div {...mergedProps}>` e expressa o nível em
          `role="heading"` + `aria-level` — então `level={3}` sozinho deixa a
          TAG em `div`. O leitor de tela anuncia certo, mas não há heading na
          árvore do documento, e a asserção de `tagName` reprova com
          `expected 'DIV' to be 'H3'`. Os quatro painéis modais desta stack
          caem no MESMO arquivo da lib (o alert-dialog o reexporta; o drawer
          chega nele pelo vaul-svelte), então não é particularidade de um slug.

          `child` é a API de delegação de elemento do bits-ui — a mesma função
          que as outras libs cumprem sob outro nome —, e é ela que devolve a
          tag. O `level` vai JUNTO: sem ele o padrão da lib é 2, e o `<h3>`
          sairia com `aria-level="2"`, com a tag e o ARIA discordando.
        -->
        {#if titleLevel}
          <DialogTitle level={titleLevel}>
            {#snippet child({ props })}
              <svelte:element this={`h${titleLevel}`} {...props}>{title}</svelte:element>
            {/snippet}
          </DialogTitle>
        {:else}
          <DialogTitle>{title}</DialogTitle>
        {/if}
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {#if variant === 'withForm'}
        <!--
          `<Input>` do sistema e não `<input>` cru com `style`: o cru trazia
          `height: var(--height-default)` inline, que é altura cravada em
          primitivo de texto (WCAG 1.4.4), e `defaultValue`, que no Svelte não
          é prop nenhuma — virava atributo inerte e os campos renderizavam
          VAZIOS enquanto a story dizia mostrar dados preenchidos.
        -->
        <!--
          O `<form>` envolve o corpo E o RODAPÉ (PRD D10), e a primária é
          `type="submit"` dentro dele. Fora do form o `submit` é botão inerte:
          não submete, o Enter num campo não dispara nada, e nada na tela
          denuncia — o botão continua clicável e com a aparência certa. Por isso
          esta variante monta o próprio rodapé, em vez de cair no bloco genérico
          logo abaixo, que o deixaria como IRMÃO do formulário.
        -->
        <form class="nds-grid" data-spacing="sm" onsubmit={(e) => { e.preventDefault(); onAction?.(); }}>
          <div class="nds-grid" data-spacing="xs">
            <Label for="dialog-name">{t('demonstration.labels.fieldName')}</Label>
            <Input id="dialog-name" value={t('demonstration.labels.samplePersonName')} />
          </div>
          <div class="nds-grid" data-spacing="xs">
            <Label for="dialog-email">{t('demonstration.labels.fieldEmail')}</Label>
            <Input id="dialog-email" type="email" value="maria@exemplo.com" />
          </div>
          <DialogFooter>
            <DialogClose>
              {#snippet child({ props })}
                <!--
                  `type="button"` explícito: dentro de um `<form>` o padrão do
                  HTML é `submit`, e o Cancelar submeteria o formulário antes de
                  fechar. Encadear o `onclick` do primitivo preserva o
                  fechamento, como no bloco genérico abaixo.
                -->
                <Button
                  type="button"
                  variant="outline"
                  {...props}
                  onclick={(event: MouseEvent) => {
                    (props.onclick as ((e: MouseEvent) => void) | undefined)?.(event);
                    onCancel?.();
                  }}
                >
                  {cancelLabel}
                </Button>
              {/snippet}
            </DialogClose>
            <Button type="submit">{actionLabel}</Button>
          </DialogFooter>
        </form>
      {:else if variant === 'withScrollContent'}
        <!-- Story, e não primitivo — mas story é o que se copia, e esta ensinava
             duas coisas erradas. `region` DENTRO de um diálogo já nomeado vira
             marco aninhado: não acrescenta navegação, só entrada na lista. E
             "Conteúdo rolável" nomeia o MECANISMO — quem chegou por Tab já sabe
             que rola; o que não sabe é o que rola.

             A diretiva cala um falso positivo: a regra do compilador só aceita
             papel de widget. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
          data-slot="dialog-body"
          data-spacing="sm"
          tabindex="0"
          role="group"
          aria-label={t('demonstration.labels.termsTitle')}
        >
          {#each Array.from({ length: 14 }) as _, i (i)}
            <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar o scroll interno do Dialog quando o body excede a height disponível em viewport.</p>
          {/each}
        </div>
      {:else if bodyText}
        <div class="nds-dialog-body nds-text-body nds-text-muted-foreground" data-slot="dialog-body">
          {bodyText}
        </div>
      {/if}

      {#if variant === 'customCloseInFooter'}
        <!--
          Três ações, e a ordem é a do sistema: secundários primeiro, primária
          por último no DOM. `.nds-dialog-footer` é `column-reverse` no estreito
          e vira `row` + `flex-end` a partir de 40rem — das duas leituras sai a
          primária em cima e à direita, a partir desta MESMA ordem de DOM. O
          "Fechar" é a de menor ênfase das três, então abre a lista.

          Quem emite o fechar é o `showCloseButton` do próprio rodapé: ele o
          põe antes do conteúdo e em `ghost`, a variante da ação terciária pela
          tabela da guideline 06. "Voltar" e "Continuar" seguiriam para outra
          etapa do fluxo, e fechar não é o que elas fazem.
        -->
        <DialogFooter showCloseButton closeLabel={footerCloseLabel}>
          <Button variant="outline" onclick={onCancel}>{cancelLabel}</Button>
          <Button onclick={onAction}>{actionLabel}</Button>
        </DialogFooter>
      {:else if variant !== 'noFooter' && variant !== 'withForm'}
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}
              <!--
                `onclick` DEPOIS do spread sobrescrevia o handler que o
                primitivo entrega em `props` — o que fecha o diálogo. O Cancelar
                avisava o callback e não fechava nada, e nenhuma asserção
                reparava porque ninguém verificava o fechamento por ali.
                Encadear os dois preserva o comportamento do primitivo.
              -->
              <Button
                variant="outline"
                {...props}
                onclick={(event: MouseEvent) => {
                  (props.onclick as ((e: MouseEvent) => void) | undefined)?.(event);
                  onCancel?.();
                }}
              >
                {cancelLabel}
              </Button>
            {/snippet}
          </DialogClose>
          <!--
            `variant="destructive"` e não classes soltas: `bg-destructive`,
            `text-destructive-foreground` e `nds-hover-bg-destructive-90` não
            existem no CSS, então a ação destrutiva renderizava no visual
            padrão e a story mostrava o contrário do que documentava.
          -->
          <Button
            variant={variant === 'withDestructiveAction' ? 'destructive' : 'default'}
            onclick={onAction}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      {/if}
    </DialogContent>
  </Dialog>
{/key}
