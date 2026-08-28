<script lang="ts">
  // O par do primeiro Do & Don't: a mesma reprodução contada de dois jeitos.
  //
  // Com `listenTo="engine"` o contador escuta o MOTOR (`onplay`); com
  // `listenTo="click"`, o clique no botão da barra. Com um clique na barra os
  // dois marcam um — a diferença só aparece pelo botão "tocar por fora", que
  // chama `play()` no elemento como faria uma tecla de mídia, a janela
  // flutuante ou o controle do sistema. O contador do motor sobe; o do clique
  // fica onde estava.
  //
  // É componente, e não dois trechos na docs page, porque cada metade do par
  // precisa do PRÓPRIO contador — e estado local não cabe dentro de um snippet.
  import { Button } from '@/components/ui/button';
  import { locale } from '@/lib/i18n';
  import { MediaPlayer, type MediaPlayerRootElement } from './index';
  import { mediaPlayerLabelsFor, silentWav } from './media-player.fixtures';

  const {
    listenTo,
    countLabel,
    outsideLabel,
  }: {
    listenTo: 'engine' | 'click';
    countLabel: string;
    outsideLabel: string;
  } = $props();

  const labels = $derived(mediaPlayerLabelsFor($locale));
  // O WAV é montado uma vez: refazê-lo a cada troca de idioma remontaria o
  // player e zeraria o contador que o par existe para comparar.
  const src = silentWav(0.6);

  let plays = $state(0);
  let wrapEl = $state<HTMLDivElement | null>(null);

  function player(): MediaPlayerRootElement | null {
    return wrapEl?.querySelector('[data-slot="media-player"]') ?? null;
  }

  $effect(() => {
    if (listenTo !== 'click') return;
    // O contador errado: escuta o CLIQUE no botão da barra, e por isso não vê
    // nada do que não passa por ele.
    const button = wrapEl?.querySelector(
      '[data-slot="media-player-controls"] button',
    ) as HTMLButtonElement | null;
    if (!button) return;
    const count = (): void => { plays += 1; };
    button.addEventListener('click', count);
    return () => button.removeEventListener('click', count);
  });

  function playFromOutside(): void {
    const media = player()?.media;
    if (!media) return;
    media.muted = true;
    media.currentTime = 0;
    void media.play().catch(() => undefined);
  }
</script>

<div bind:this={wrapEl} class="nds-stack nds-w-full" data-spacing="sm">
  <MediaPlayer
    kind="audio"
    {src}
    {labels}
    onplay={listenTo === 'engine' ? () => { plays += 1; } : undefined}
    class="nds-w-full"
  />
  <p class="nds-text-body nds-text-muted-foreground">{countLabel}: {plays}</p>
  <Button variant="outline" size="sm" onclick={playFromOutside}>{outsideLabel}</Button>
</div>
