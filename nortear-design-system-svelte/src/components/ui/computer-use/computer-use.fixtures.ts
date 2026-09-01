/**
 * Andaime das demonstrações da tela do computador.
 *
 * Existe pelo mesmo motivo do andaime do bloco de terminal: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — a
 * palavra que apresenta o endereço e o molde da contagem. Os PASSOS e o
 * ENDEREÇO saem de `@shared/primitives/computer-use-examples`, porque não são
 * idioma: o ponto que o agente clicou é o mesmo nos três, e escrever pontos
 * diferentes por idioma faria as fotos mostrarem marcas em lugares diferentes.
 *
 * A TELA NÃO PODE SER COMPARTILHADA, e é a única parte do andaime que não é.
 * Ela é ESPAÇO de quem consome (§1 e §2 da guideline 17), e nesta stack o tipo
 * desse espaço é `Snippet` — marcação, que não entra em primitivo compartilhado.
 * Cada stack monta a sua com os próprios primitivos; o que se compartilha é onde
 * as marcas caem sobre ela. A desta stack é `ComputerUseDemoScreen.svelte`, ao
 * lado deste arquivo.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import computerUseTranslations from '@shared/content/computer-use/translations.json';
import type { ComputerUseLabels } from './index';

/** O texto da tela de demonstração — uma página de entrada qualquer. */
export interface ComputerUseDemoScreenText {
  title: string;
  email: string;
  password: string;
  submit: string;
}

/**
 * A anotação de tipo é o PORTÃO: as duas seções são lidas em CADA idioma, então
 * rótulo que sumir do JSON — ou idioma que ficar para trás — reprova no
 * type-check, e não na tela. Um endereço sem a palavra que o apresenta deixaria
 * quem ouve com uma cadeia solta no começo da figura, que é exatamente o que a
 * decisão 8 da folha existe para não acontecer.
 */
const CONTENT: Record<
  Locale,
  { labels: ComputerUseLabels; demonstration: { screen: ComputerUseDemoScreenText } }
> = computerUseTranslations;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function computerUseLabelsFor(target: Locale): ComputerUseLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function computerUseLabels(): ComputerUseLabels {
  return computerUseLabelsFor(get(locale));
}

/** O texto da tela de demonstração num idioma. */
export function computerUseDemoScreenTextFor(target: Locale): ComputerUseDemoScreenText {
  return CONTENT[target].demonstration.screen;
}
