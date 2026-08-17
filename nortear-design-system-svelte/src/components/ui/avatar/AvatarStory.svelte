<script lang="ts">
  import {
    Avatar,
    AvatarImage,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarBadge,
  } from './index';
  import User from '@lucide/svelte/icons/user';

  type Variant = 'image' | 'initials' | 'icon' | 'group' | 'withStatus';
  type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  interface Props {
    variant?: Variant;
    src?: string;
    alt?: string;
    initials?: string;
    size?: Size;
    class?: string;
    delayMs?: number;
    statusLabel?: string;
  }

  let {
    variant = 'image',
    src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
    alt = 'Foto de perfil de Maria Rodrigues',
    initials = 'MR',
    size = 'md',
    class: className = '',
    delayMs,
    statusLabel = 'Online',
  }: Props = $props();

  const groupImages = [
    { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60', initials: 'MR' },
    { src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60', initials: 'JP' },
    { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60', initials: 'AS' },
  ];
</script>

{#if variant === 'image'}
  <Avatar {size} {delayMs} class={className}>
    <AvatarImage {src} {alt} />
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
{:else if variant === 'initials'}
  <Avatar {size}>
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
{:else if variant === 'icon'}
  <Avatar {size}>
    <AvatarFallback role="img" aria-label="Usuário genérico">
      <User class="nds-icon-lg" aria-hidden="true" />
    </AvatarFallback>
  </Avatar>
{:else if variant === 'group'}
  <!-- Grupo e contador saem dos componentes: o recuo e a borda são do
       .nds-avatar-group. Antes a fila era montada à mão com -space-x-2 e
       ring-2, classes do Tailwind que saíram do projeto e não empurravam nada. -->
  <AvatarGroup role="group" aria-label="Participantes">
    {#each groupImages as item (item.initials)}
      <Avatar {size}>
        <AvatarImage src={item.src} alt="" />
        <AvatarFallback>{item.initials}</AvatarFallback>
      </Avatar>
    {/each}
    <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
  </AvatarGroup>
{:else if variant === 'withStatus'}
  <Avatar {size}>
    <AvatarImage {src} {alt} />
    <AvatarFallback>{initials}</AvatarFallback>
    <AvatarBadge role="img" aria-label={statusLabel} />
  </Avatar>
{/if}
