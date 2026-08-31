<script setup lang="ts">
/**
 * As etiquetas do que vai junto com a pergunta sem ser carga.
 *
 * Desenho em `nds/composer.css`, no bloco de contexto, que também guarda as
 * cinco decisões de acessibilidade. O vocabulário — `ContextItem`,
 * `ContextKind`, `isContextRemovable` — vem de
 * `@shared/primitives/chat-protocol`.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: contexto não é anexo, ainda que a geometria
 * seja quase a mesma. O anexo é CARGA — sobe, tem bytes, tem progresso e pode
 * falhar no meio, e por isso a fila de anexos desenha estado e barra. O
 * contexto é REFERÊNCIA: aponta para o que já está lá, não sobe nada e não tem
 * o que esperar. É por isso que aqui não há `state` nem `progress`: não existe
 * espera para comunicar, e uma barra parada seria uma barra mentindo.
 *
 * O QUE O COMPONENTE NÃO FAZ: decidir o que entra na pergunta, o quanto um
 * item abrange, ou tirar coisa alguma. Ele desenha a lista que recebe e avisa
 * que alguém pediu para tirar um item. Quem consome monta a pergunta e decide —
 * mesma divisão de `approval` no `chat-thread`.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": o aviso de
 * remoção é um EVENTO (`@remove`), e não um retorno que se passa por prop. O
 * conceito é o mesmo dos dois lados — quem monta a pergunta é quem tira o item;
 * o que muda é por onde o pedido sai.
 */
import type { Component } from 'vue'
import { AppWindow, File, Folder, FolderGit2, TextSelect } from 'lucide-vue-next'
import {
  isContextRemovable,
  type ContextItem,
  type ContextKind,
} from '@shared/primitives/chat-protocol'
import { Button } from '@/components/ui/button'
import type { ComposerContextLabels } from './index'

const props = defineProps<{
  items: ContextItem[]
  labels: ComposerContextLabels
}>()

const emit = defineEmits<{
  /** Alguém pediu para tirar. Tirar de verdade é de quem monta a pergunta. */
  remove: [item: ContextItem]
}>()

/**
 * O ícone de cada espécie.
 *
 * Ele é DECORATIVO, e a espécie viaja em texto no nome acessível do item
 * (decisão 2 da folha): o ícone é a única pista visual de que aquilo é um
 * trecho e não o arquivo inteiro, e pista que só existe em desenho não chega a
 * quem ouve (WCAG 1.1.1).
 *
 * O mapa é `Record<ContextKind, …>` de propósito: espécie nova no vocabulário
 * compartilhado reprova a compilação aqui, em vez de cair num ícone genérico
 * que ninguém repara que está errado.
 *
 * `TextSelect` é o nome com que o pacote de ícones desta stack publica o
 * quadrado tracejado com texto — o mesmo desenho, outro nome de export.
 */
const KIND_ICONS: Record<ContextKind, Component> = {
  selection: TextSelect,
  file: File,
  directory: Folder,
  page: AppWindow,
  repository: FolderGit2,
}

/**
 * O nome acessível leva o NOME DO ITEM: uma lista de botões chamados "Remover"
 * é um botão só para quem navega por audição (decisão 4 da folha).
 */
function removeLabel(item: ContextItem): string {
  return props.labels.remove.replace('{label}', item.label)
}

/**
 * A decisão 3 da folha, e a máquina dela mora no protocolo: contexto automático
 * não ganha botão de remover — ele voltaria na próxima pergunta, e botão que
 * desfaz o que se refaz sozinho é armadilha.
 *
 * A pergunta vai ao vocabulário compartilhado, e não a um `if (item.automatic)`
 * escrito aqui: cinco stacks escreveriam cinco versões da mesma regra, e uma
 * delas discordaria.
 */
function isRemovable(item: ContextItem): boolean {
  return isContextRemovable(item)
}

function requestRemove(item: ContextItem): void {
  emit('remove', item)
}
</script>

<template>
  <!-- `<ul>`: é o que faz o leitor de tela dizer QUANTOS itens a pergunta leva
       antes de percorrê-los, e aqui a contagem é a informação — saber que são
       sete arquivos muda o que se pergunta. Uma pilha de `div` não anuncia
       nada. -->
  <ul
    data-slot="composer-context"
    class="nds-composer-context"
    :aria-label="labels.list"
  >
    <li
      v-for="(item, index) in items"
      :key="item.id ?? index"
      class="nds-composer-context-item"
      data-slot="composer-context-item"
      :data-kind="item.kind"
      :data-context-id="item.id"
      :data-automatic="item.automatic ? 'true' : undefined"
    >
      <!-- O ícone é DESENHO, e sai do que é lido em voz. -->
      <component
        :is="KIND_ICONS[item.kind]"
        class="nds-composer-context-icon"
        aria-hidden="true"
      />

      <!-- A espécie em TEXTO, dentro do item (decisão 2 da folha). Ela não vai
           num `aria-label` do `<li>`: rótulo em item de lista SUBSTITUI o
           conteúdo no anúncio, e o recorte — que é o que separa um pedaço do
           todo — sairia junto. Escondida do olho, presente para o ouvido, e na
           frente do nome porque é assim que a frase se lê: "Trecho
           relatorio.ts, linhas 12–48". -->
      <span class="nds-sr-only">{{ labels.kind[item.kind] }}</span>

      <span class="nds-composer-context-label">{{ item.label }}</span>

      <!-- O recorte, quando o item é um PEDAÇO. Sem ele, um trecho seria o nome
           de um arquivo repetido. -->
      <span
        v-if="item.detail"
        class="nds-composer-context-detail"
      >{{ item.detail }}</span>

      <!-- A marca ocupa o lugar do botão, e é TEXTO: a moldura tracejada
           sozinha não descreve estado (WCAG 1.4.1). -->
      <Button
        v-if="isRemovable(item)"
        class="nds-composer-context-remove"
        data-slot="composer-context-remove"
        variant="ghost"
        size="icon-sm"
        :aria-label="removeLabel(item)"
        @click="requestRemove(item)"
      >
        ×
      </Button>
      <span
        v-else
        class="nds-composer-context-detail"
        data-slot="composer-context-automatic"
      >{{ labels.automatic }}</span>
    </li>
  </ul>
</template>
