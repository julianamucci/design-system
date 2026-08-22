/**
 * Rótulos acessíveis da Sidebar, por idioma.
 *
 * Existem porque três textos do componente NÃO são escritos por quem compõe: o
 * nome acessível do gatilho (o botão só carrega um ícone), a dica de ponteiro da
 * faixa, e o par nome/descrição da gaveta sobreposta — que é um diálogo, e um
 * diálogo sem nome é anunciado como "diálogo" e mais nada.
 *
 * Estavam cravados em inglês nas cinco implementações. Num produto em português,
 * quem usa leitor de tela ouvia o controle principal do componente como "Toggle
 * Sidebar", e a gaveta como "Sidebar / Displays the mobile sidebar." — texto que
 * ninguém tinha como trocar sem editar o componente.
 *
 * Mora no compartilhado, e não copiado em cada stack, pelo mesmo motivo de
 * `calendar-labels.ts`: é texto que o usuário final OUVE, e cinco cópias
 * divergem na primeira revisão de conteúdo. O padrão é o português; as outras
 * duas línguas existem para quem monta um produto multilíngue e passa o rótulo
 * adiante pela API do componente (prop, opção de fábrica ou input, conforme a
 * stack).
 *
 * O conteúdo compartilhado (`docs/shared/content/sidebar/translations.json`)
 * descreve estes três textos em `accessibility.*` de forma API-neutra e aponta
 * para cá; as strings em si vivem só neste arquivo, para que não exista uma
 * segunda cópia para divergir.
 */

export interface SidebarLabels {
  /**
   * Nome acessível do gatilho e dica de ponteiro da faixa.
   *
   * Um texto só para os dois de propósito: eles fazem exatamente a mesma coisa,
   * e a faixa é `aria-hidden` justamente para não virar um segundo controle com
   * o mesmo nome.
   */
  alternar: string;
  /** Nome da gaveta sobreposta, só para leitor de tela. */
  tituloMovel: string;
  /** Descrição da gaveta sobreposta, só para leitor de tela. */
  descricaoMovel: string;
}

const LABELS: Record<string, SidebarLabels> = {
  'pt-BR': {
    alternar: 'Alternar barra lateral',
    tituloMovel: 'Barra lateral',
    descricaoMovel: 'Exibe a barra lateral como gaveta sobreposta.',
  },
  en: {
    alternar: 'Toggle sidebar',
    tituloMovel: 'Sidebar',
    descricaoMovel: 'Displays the sidebar as an overlay drawer.',
  },
  es: {
    alternar: 'Alternar barra lateral',
    tituloMovel: 'Barra lateral',
    descricaoMovel: 'Muestra la barra lateral como panel superpuesto.',
  },
};

/**
 * O que o componente usa quando quem compõe não passa nada.
 *
 * Português, e não inglês como em `calendar-labels`: lá o padrão acompanha o
 * que a lib de calendário já entrega traduzido; aqui não há lib nenhuma, o texto
 * é do design system, e a regra do projeto é que o que o usuário lê ou ouve sai
 * em português comum.
 */
export const ROTULOS_SIDEBAR_PADRAO: SidebarLabels = LABELS['pt-BR'];

/**
 * Aceita a tag BCP-47 inteira ("pt-BR", "es-ES") e cai na língua base quando a
 * região não tem entrada própria. Idioma desconhecido usa o padrão do design
 * system, que é o português.
 */
export function sidebarLabels(locale: string | undefined): SidebarLabels {
  if (!locale) return ROTULOS_SIDEBAR_PADRAO;
  return LABELS[locale] ?? LABELS[locale.split('-')[0]] ?? ROTULOS_SIDEBAR_PADRAO;
}
