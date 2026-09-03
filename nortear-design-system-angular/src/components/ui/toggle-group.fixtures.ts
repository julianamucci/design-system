/**
 * Fixture do ToggleGroup — os nomes acessíveis dos três botões de alinhamento.
 *
 * Os botões são só ícone: sem `aria-label` eles não têm nome nenhum, e é por
 * esse nome que a play os encontra. Literal escrito duas vezes é o defeito
 * clássico aqui — a busca deixa de casar com o markup e a story lança em vez de
 * reprovar.
 *
 * Mora FORA do `.stories.ts` porque ali todo export nomeado vira story na barra
 * lateral do Storybook — e fora do `.source.ts` porque a guarda transversal do
 * painel Code cobra que todo export de lá seja construtor de snippet. O snippet
 * e a story leem daqui, e por isso ensinam o mesmo nome que o teste procura.
 */
export const LABELS = {
  left: 'Alinhar à esquerda',
  center: 'Centralizar',
  right: 'Alinhar à direita',
};
