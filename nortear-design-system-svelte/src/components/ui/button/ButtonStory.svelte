<script lang="ts">
  import { Button } from './index';
  import type { ButtonVariant, ButtonSize } from './index';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Pencil from '@lucide/svelte/icons/pencil';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Download from '@lucide/svelte/icons/download';
  import Loader2 from '@lucide/svelte/icons/loader-circle';

  type IconKind = 'plus' | 'trash' | 'pencil' | 'chevron-right' | 'download' | 'loader' | 'none';

  interface Props {
    variant?: ButtonVariant;
    size?: ButtonSize;
    label?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    href?: string;
    ariaLabel?: string;
    ariaBusy?: boolean;
    ariaInvalid?: boolean;
    iconStart?: IconKind;
    iconEnd?: IconKind;
    iconOnly?: IconKind;
    spinIcon?: boolean;
    onclick?: (e: MouseEvent) => void;
  }

  let {
    variant = 'default',
    size = 'default',
    label = 'Botão',
    disabled = false,
    type = 'button',
    href,
    ariaLabel,
    ariaBusy,
    ariaInvalid,
    iconStart = 'none',
    iconEnd = 'none',
    iconOnly = 'none',
    spinIcon = false,
    onclick,
  }: Props = $props();

  const ICONS = {
    plus: Plus,
    trash: Trash2,
    pencil: Pencil,
    'chevron-right': ChevronRight,
    download: Download,
    loader: Loader2,
  } as const;

  const StartIcon = $derived(iconStart !== 'none' ? ICONS[iconStart] : null);
  const EndIcon = $derived(iconEnd !== 'none' ? ICONS[iconEnd] : null);
  const OnlyIcon = $derived(iconOnly !== 'none' ? ICONS[iconOnly] : null);
</script>

<Button
  {variant}
  {size}
  {type}
  {disabled}
  {href}
  aria-label={ariaLabel}
  aria-busy={ariaBusy ? 'true' : undefined}
  aria-invalid={ariaInvalid ? 'true' : undefined}
  {onclick}
>
  <!-- `nds-button-icon-svg` e não `nds-icon`: as duas existem e dão 16px, mas
       só esta acompanha o tamanho do botão pelos modificadores `-sm`/`-lg`, e é
       a que a factory Vanilla aplica. O spin usa `.nds-spin` (button.css), que
       tem guarda de prefers-reduced-motion — `.nds-animate-spin` não tem. -->
  {#if OnlyIcon}
    <OnlyIcon class={spinIcon ? 'nds-button-icon-svg nds-spin' : 'nds-button-icon-svg'} aria-hidden="true" />
  {:else}
    {#if StartIcon}
      <StartIcon class={spinIcon ? 'nds-button-icon-svg nds-spin' : 'nds-button-icon-svg'} aria-hidden="true" />
    {/if}
    {label}
    {#if EndIcon}
      <EndIcon class="nds-button-icon-svg" aria-hidden="true" />
    {/if}
  {/if}
</Button>
