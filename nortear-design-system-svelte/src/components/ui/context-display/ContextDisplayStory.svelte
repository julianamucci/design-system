<script lang="ts">
  /**
   * Andaime do Playground do uso do contexto.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * nível é texto de interface. Sem o invólucro, o `render` montaria os rótulos
   * no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O invólucro também é onde o teto zero vira AUSÊNCIA de teto: é o que o
   * primitivo compartilhado já decide, e é o único caminho para esse caso por
   * control numérico.
   */
  import { locale } from '@/lib/i18n';
  import { ContextDisplay, type ContextDisplayForm } from './index';
  import { contextDisplayLabelsFor } from './context-display.fixtures';

  const {
    input,
    output,
    limit,
    form,
  }: {
    /** Quanto a pergunta consumiu. */
    input: number;
    /** Quanto a resposta consumiu. */
    output: number;
    /** Teto da janela. Zero é a ausência de teto: sem ele não há fração. */
    limit: number;
    /** Como desenhar o mesmo número. */
    form: ContextDisplayForm;
  } = $props();

  const labels = $derived(contextDisplayLabelsFor($locale));
</script>

<ContextDisplay usage={{ input, output, limit: limit || undefined }} {form} {labels} />
