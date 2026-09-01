/**
 * Rótulos falados do CodeBlock, por idioma.
 *
 * Existem porque três textos do componente NÃO são escritos por quem compõe: o
 * nome acessível da ação de copiar (o botão só carrega um ícone), a confirmação
 * que a região de status anuncia, e o nome da região que rola — que tem
 * `tabindex="0"` e, sem nome, era uma parada de teclado que o leitor de tela
 * anunciava sem dizer onde a pessoa entrou.
 *
 * Moram no compartilhado, e não copiados em cada stack, pelo mesmo motivo de
 * `sidebar-a11y-labels.ts` e `calendar-labels.ts`: é texto que o usuário final
 * OUVE, e cinco cópias divergem na primeira revisão de conteúdo. Até aqui os
 * dois primeiros estavam cravados em português nas CINCO fábricas — mesma
 * cadeia, cinco lugares, e nenhum deles alcançável por quem monta um produto em
 * outra língua sem editar o componente.
 *
 * O padrão é o português, como na sidebar: não há lib por trás trazendo texto
 * traduzido, o texto é do design system, e a regra do projeto é que o que o
 * usuário lê ou ouve sai em português comum. As outras duas línguas existem
 * para quem monta produto multilíngue e passa o rótulo adiante pela API do
 * componente (prop, opção de fábrica ou input, conforme a stack).
 *
 * O conteúdo compartilhado (`docs/shared/content/code-block/translations.json`)
 * descreve estes textos em `accessibility.*` de forma API-neutra e aponta para
 * cá; as cadeias em si vivem só neste arquivo, para que não exista uma segunda
 * cópia para divergir.
 */

export interface CodeBlockLabels {
  /** Nome acessível da ação de copiar, no estado inicial. */
  copy: string;
  /** Confirmação: rótulo do botão e texto anunciado pela região de status. */
  copied: string;
  /**
   * Nome da região que rola.
   *
   * Genérico de propósito. O nome do arquivo, quando existe, já está no
   * cabeçalho e é lido separadamente; repeti-lo aqui só duplicaria a leitura.
   * Quem tiver mais de um bloco na mesma tela e quiser distingui-los passa o
   * nome pela API do componente.
   */
  region: string;
  /** Palavra que o leitor recebe na calha de uma linha adicionada. */
  lineAdded: string;
  /** Palavra que o leitor recebe na calha de uma linha removida. */
  lineRemoved: string;
}

const LABELS: Record<string, CodeBlockLabels> = {
  'pt-BR': {
    copy: 'Copiar código',
    copied: 'Copiado!',
    region: 'Bloco de código',
    lineAdded: 'Linha adicionada',
    lineRemoved: 'Linha removida',
  },
  en: {
    copy: 'Copy code',
    copied: 'Copied!',
    region: 'Code block',
    lineAdded: 'Line added',
    lineRemoved: 'Line removed',
  },
  es: {
    copy: 'Copiar código',
    copied: '¡Copiado!',
    region: 'Bloque de código',
    lineAdded: 'Línea añadida',
    lineRemoved: 'Línea eliminada',
  },
};

/** O que o componente usa quando quem compõe não passa nada. */
export const LABELS_CODE_BLOCK_DEFAULT: CodeBlockLabels = LABELS['pt-BR'];

/**
 * Aceita a tag BCP-47 inteira ("pt-BR", "es-ES") e cai na língua base quando a
 * região não tem entrada própria. Idioma desconhecido usa o padrão do design
 * system, que é o português.
 */
export function codeBlockLabels(locale: string | undefined): CodeBlockLabels {
  if (!locale) return LABELS_CODE_BLOCK_DEFAULT;
  return LABELS[locale] ?? LABELS[locale.split('-')[0]] ?? LABELS_CODE_BLOCK_DEFAULT;
}
