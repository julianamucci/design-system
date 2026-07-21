<script lang="ts">
  import { Avatar, AvatarImage, AvatarFallback } from './index';
  import { User } from 'lucide-svelte';

  type Variant = 'image' | 'initials' | 'icon' | 'group' | 'withStatus';

  interface Props {
    variant?: Variant;
    src?: string;
    alt?: string;
    initials?: string;
    sizeClass?: string;
    delayMs?: number;
    statusLabel?: string;
  }

  let {
    variant = 'image',
    src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
    alt = 'Foto de perfil de Maria Rodrigues',
    initials = 'MR',
    sizeClass = '',
    delayMs,
    statusLabel = 'online',
  }: Props = $props();

  const groupImages = [
    { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60', alt: 'Maria', initials: 'MR' },
    { src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60', alt: 'João', initials: 'JP' },
    { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60', alt: 'Ana', initials: 'AS' },
    { src: '', alt: '', initials: '+2' },
  ];
</script>

{#if variant === 'image'}
  <Avatar class={sizeClass}>
    <AvatarImage {src} {alt} />
    <AvatarFallback {delayMs}>{initials}</AvatarFallback>
  </Avatar>
{:else if variant === 'initials'}
  <Avatar class={sizeClass}>
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
{:else if variant === 'icon'}
  <Avatar class={sizeClass}>
    <AvatarFallback role="img" aria-label="Usuário genérico">
      <User class="nds-text-muted-foreground" style="height: 1rem; width: 1rem" aria-hidden="true" />
    </AvatarFallback>
  </Avatar>
{:else if variant === 'group'}
  <div class="nds-cluster -space-x-2" role="group" aria-label="Participantes">
    {#each groupImages as item}
      <Avatar class={`ring-2 ring-background ${sizeClass}`}>
        {#if item.src}
          <AvatarImage src={item.src} alt={item.alt} />
        {/if}
        <AvatarFallback class="nds-text-caption">{item.initials}</AvatarFallback>
      </Avatar>
    {/each}
  </div>
{:else if variant === 'withStatus'}
  <div class="nds-inline-block" style="position: relative">
    <Avatar class={sizeClass}>
      <AvatarImage {src} {alt} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
    <span
      role="status"
      aria-label={statusLabel}
      class="bottom-0 right-0 nds-rounded-full nds-bg-primary nds-ring-background" style="position: absolute; height: 0.625rem; width: 0.625rem"
    ></span>
  </div>
{/if}
