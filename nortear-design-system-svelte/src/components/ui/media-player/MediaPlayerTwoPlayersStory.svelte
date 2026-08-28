<script lang="ts">
  // Dois players na mesma página, para a composição `TwoPlayers`.
  //
  // Mora num componente à parte porque o `render` de uma story desta stack
  // devolve UM componente e as props dele — dois irmãos precisam de uma
  // marcação, e marcação de story vive em `<Slug><Caso>Story.svelte`.
  //
  // Os espiões chegam por prop, e não são criados aqui: espião montado dentro
  // do render é inalcançável pela play, e a aba Actions ficaria vazia.
  import { MediaPlayer, type MediaPauseInfo } from './index';
  import { YOUTUBE_VIDEO_ID, mediaPlayerLabels } from './media-player.fixtures';

  const {
    onFirstPlay,
    onFirstPause,
    onSecondPause,
  }: {
    onFirstPlay?: () => void;
    onFirstPause?: (info: MediaPauseInfo) => void;
    onSecondPause?: (info: MediaPauseInfo) => void;
  } = $props();

  const labels = mediaPlayerLabels();
</script>

<div class="nds-stack nds-w-full" data-spacing="md">
  <MediaPlayer
    embed={{ provider: 'youtube', videoId: YOUTUBE_VIDEO_ID }}
    {labels}
    onplay={onFirstPlay}
    onpause={onFirstPause}
  />
  <MediaPlayer
    embed={{ provider: 'youtube', videoId: YOUTUBE_VIDEO_ID }}
    {labels}
    onpause={onSecondPause}
  />
</div>
