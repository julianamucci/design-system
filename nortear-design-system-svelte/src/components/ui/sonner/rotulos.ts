/**
 * Rótulos em português — o design system é escrito em pt-BR, e os defaults da
 * lib ("Notifications", "Close toast") chegariam à tela em inglês.
 *
 * Vivem num `.ts` à parte, e não no `.svelte`, porque as stories precisam do
 * valor para afirmar sobre ele: importar de um componente Svelte arrastaria o
 * runtime do componente para dentro do arquivo de teste.
 */
export const ROTULO_REGIAO = 'Notificações';
export const ROTULO_FECHAR = 'Fechar notificação';
