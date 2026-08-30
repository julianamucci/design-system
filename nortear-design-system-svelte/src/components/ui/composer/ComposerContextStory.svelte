<script lang="ts">
  /**
   * Andaime do Playground do contexto.
   *
   * Os três controles da story — espécie, recorte e a marca de automático — NÃO
   * são props do campo: são os eixos de UM item da lista. Nesta stack os args da
   * story precisam servir ao componente que o `render` devolve, e o campo não
   * tem prop chamada "espécie"; sem o invólucro, o andaime da story vazaria para
   * a API do componente só para o tipo fechar. Mesma decisão do andaime do
   * seletor de gatilho, ao lado.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * espécie é texto de interface.
   */
  import { locale } from '@/lib/i18n';
  import type { ContextItem, ContextKind } from '@shared/primitives/chat-protocol';
  import { Composer } from './index';
  import { composerLabelsFor } from './composer.fixtures';
  import { contextLabelsFor } from './composer-context.fixtures';

  const {
    kind,
    detail,
    automatic,
    onRemoveContext,
  }: {
    /** De onde o item veio. Decide o ícone e a palavra do nome acessível. */
    kind: ContextKind;
    /** O recorte. Vazio quando o item é o todo. */
    detail: string;
    /** O item entrou sem ninguém pedir? */
    automatic: boolean;
    onRemoveContext?: (item: ContextItem) => void;
  } = $props();

  const labels = $derived(composerLabelsFor($locale));
  const contextLabels = $derived(contextLabelsFor($locale));

  const context = $derived<ContextItem[]>([
    {
      id: 'c1',
      label: 'relatorio.ts',
      kind,
      // Campo de texto vazio é ausência de recorte, e não um recorte em branco:
      // um `detail` de string vazia desenharia um vão sem palavra.
      detail: detail || undefined,
      automatic,
    },
  ]);
</script>

<Composer {labels} {contextLabels} {context} {onRemoveContext} class="nds-max-w-lg" />
