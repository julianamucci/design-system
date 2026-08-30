/**
 * Andaime das demonstrações do rascunho recuperado — os rótulos e os exemplos.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface.
 *
 * O RASCUNHO e o CARIMBO, não: eles são a FALA de quem escreveu, e a guideline
 * 17 §3.3 já decidiu que exemplo de conversa não se traduz — o que é traduzido
 * são os rótulos da interface. Também é o que a foto do Chromatic compara: um
 * texto diferente por idioma faria as cinco stacks fotografarem faixas de
 * alturas diferentes, e a divergência apareceria como diferença de layout que
 * ninguém consegue atribuir a nada.
 *
 * DOIS acessos ao mesmo dicionário, como em `composer.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 *
 * Os rótulos do CAMPO não moram aqui: eles já vivem em `composer.fixtures.tsx`,
 * nos dois acessos, e uma segunda cópia divergiria da primeira sem nenhum
 * sinal. Quem monta a faixa acima do campo importa
 * `useComposerLabels`/`composerLabels` de lá.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import draftTranslations from "@shared/content/draft-restore/translations.json"
import type { DraftRestoreLabels } from "./draft-restore"

type DraftContent = { labels: DraftRestoreLabels }

const CONTENT = draftTranslations as unknown as Record<string, DraftContent>

function read(locale: Locale): DraftRestoreLabels {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos da faixa, no idioma corrente. Para dentro de um componente. */
export function useDraftLabels(): DraftRestoreLabels {
  const { locale } = useTranslation(draftTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function draftLabels(): DraftRestoreLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * O rascunho de exemplo — curto o bastante para caber nas duas linhas.
 *
 * Ele existe para provar o caso comum: a prévia inteira aparece, e não há
 * corte nenhum para confundir com o do desenho.
 */
export const SAMPLE_DRAFT =
  "Sobre o orçamento de agosto: separei os três itens que estouraram."

/**
 * O rascunho longo — o que a folha corta.
 *
 * É o único que prova a decisão 2 da folha: o texto inteiro continua no
 * documento, e quem corta é `line-clamp`. Um exemplo curto passaria verde numa
 * implementação que cortasse o texto em código, porque não haveria o que
 * cortar.
 */
export const SAMPLE_DRAFT_LONG =
  "Sobre o orçamento de agosto: separei os três itens que estouraram e queria " +
  "entender se o desvio veio do câmbio ou do contrato novo de infraestrutura. " +
  "Também vale olhar a linha de viagens, que dobrou sem nenhuma aprovação nova, " +
  "e a de licenças, que subiu junto com o número de pessoas na equipe. Se der, " +
  "traga a comparação com julho lado a lado, porque a diferença mês a mês diz " +
  "mais do que o total do trimestre."

/**
 * O carimbo de exemplo, JÁ ESCRITO — quem formata é quem consome.
 *
 * Ele é dado de exemplo, como o rascunho, e pela mesma razão: o componente não
 * formata data, então o que aparece aqui é a escrita de quem chamou.
 */
export const SAMPLE_TIMESTAMP = "ontem, 14:32"
