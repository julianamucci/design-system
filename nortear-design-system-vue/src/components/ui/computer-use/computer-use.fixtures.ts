/**
 * Andaime das demonstrações da tela do computador.
 *
 * Existe pelo mesmo motivo do andaime do bloco de terminal: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a montagem para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — a
 * palavra que apresenta o endereço e o molde da contagem. Os PASSOS e o
 * ENDEREÇO saem de `@shared/primitives/computer-use-examples`, porque não são
 * idioma: o ponto que o agente clicou é o mesmo nos três, e escrever pontos
 * diferentes por idioma faria as fotos mostrarem marcas em lugares diferentes.
 *
 * A TELA NÃO PODE SER COMPARTILHADA, e é a única parte do andaime que não é.
 * Ela é interface — e interface não entra em primitivo compartilhado —, e é
 * ESPAÇO de quem consome (§1 e §2 da guideline 17). Cada stack monta a sua com
 * os próprios primitivos; o que se compartilha é onde as marcas caem sobre ela.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, defineComponent, h, useId, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import computerUseTranslations from '@shared/content/computer-use/translations.json';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputerUseLabels } from './ComputerUse.vue';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ComputerUseLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela.
 */
const CONTENT: Record<Locale, { labels: ComputerUseLabels }> = computerUseTranslations;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function computerUseLabelsFor(target: Locale): ComputerUseLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a peça desenha.
 */
export function computerUseLabels(): ComputerUseLabels {
  return computerUseLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da peça no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a peça no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useComputerUseLabels(): ComputedRef<ComputerUseLabels> {
  const { locale } = useTranslation(computerUseTranslations);
  return computed(() => computerUseLabelsFor(locale.value as Locale));
}

/**
 * A tela de demonstração: uma página de entrada qualquer.
 *
 * NENHUMA CAPTURA DE SISTEMA REAL, e é a §1 da guideline 17 aplicada: uma
 * fotografia de produto de terceiro traz marca registrada e conteúdo que não é
 * nosso. A saída é desenhar a tela com os PRÓPRIOS primitivos do design system
 * — o que, de quebra, mostra o contrato certo: a peça recebe um espaço, e
 * qualquer coisa cabe nele.
 *
 * ELA É INERTE, e essa é a decisão que se leva daqui para quem consome. A tela
 * dentro da moldura é uma FOTO: ninguém está preenchendo aquele formulário. Sem
 * `inert`, o teclado entraria em campos de uma tela que não é a de quem navega
 * — parada de tabulação para dentro de um retrato — e o leitor de tela leria um
 * formulário que não existe. Com ele, a figura volta a ser o que a legenda diz
 * que é.
 *
 * OS CAMPOS TÊM RÓTULO DE VERDADE, ainda que inertes. É cinto e suspensório: se
 * a ferramenta de auditoria não honrar `inert`, um campo sem rótulo reprovaria,
 * e o defeito seria do andaime — não da peça.
 *
 * ESCOPO DE ID POR INSTÂNCIA. A demonstração monta várias telas na mesma
 * página, e cada uma tem dois campos rotulados. Ids derivados só do nome do
 * campo colidiriam, e `for` passaria a resolver para o PRIMEIRO campo do
 * documento — dando ao segundo formulário o rótulo do primeiro. Mesma precaução
 * do bloco de terminal, pelo mesmo motivo.
 *
 * FUNÇÃO DE RENDER, e não `template`: o compilador de template só existe em
 * tempo de execução dentro do Storybook, e este módulo é lido também pela docs
 * page. O que é montado por função sobrevive aos dois caminhos.
 */
export const ComputerUseDemoScreen = defineComponent({
  name: 'ComputerUseDemoScreen',
  setup() {
    const { t } = useTranslation(computerUseTranslations);
    const scope = useId();
    const emailId = `${scope}email`;
    const passwordId = `${scope}password`;

    const field = (id: string, label: string, type: string, value: string) =>
      h('div', { class: 'nds-stack', 'data-spacing': 'xs' }, [
        h(Label, { for: id }, () => label),
        h(Input, { id, type, modelValue: value }),
      ]);

    return () =>
      // A FOTO NÃO SE OPERA (ver o docblock acima). `inert` tira a tela inteira
      // da ordem de foco e da árvore de acessibilidade de uma vez só, sem
      // precisar desabilitar controle por controle — e desabilitar mudaria o
      // DESENHO da tela, que é justamente o que a demonstração quer mostrar
      // intacto.
      h('div', { inert: true }, [
        h(Card, { class: 'nds-h-full nds-w-full' }, () => [
          h(CardHeader, null, () => [h(CardTitle, null, () => t('demonstration.screen.title'))]),
          h(CardContent, { class: 'nds-stack', 'data-spacing': 'sm' }, () => [
            field(emailId, t('demonstration.screen.email'), 'email', 'agente@exemplo.com'),
            field(passwordId, t('demonstration.screen.password'), 'password', 'ainda-nao-digitada'),
            h(Button, { class: 'nds-w-full' }, () => t('demonstration.screen.submit')),
          ]),
        ]),
      ]);
  },
});
