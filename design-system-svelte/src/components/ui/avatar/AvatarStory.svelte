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
      <User class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </AvatarFallback>
  </Avatar>
{:else if variant === 'group'}
  <div class="flex -space-x-2" role="group" aria-label="Participantes">
    {#each groupImages as item}
      <Avatar class={`ring-2 ring-background ${sizeClass}`}>
        {#if item.src}
          <AvatarImage src={item.src} alt={item.alt} />
        {/if}
        <AvatarFallback class="text-xs">{item.initials}</AvatarFallback>
      </Avatar>
    {/each}
  </div>
{:else if variant === 'withStatus'}
  <div class="relative inline-block">
    <Avatar class={sizeClass}>
      <AvatarImage {src} {alt} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
    <span
      role="status"
      aria-label={statusLabel}
      class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
    ></span>
  </div>
{/if}
