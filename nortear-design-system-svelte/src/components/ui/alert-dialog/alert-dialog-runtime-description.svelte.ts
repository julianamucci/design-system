/**
 * Descrição do Playground trocada EM EXECUÇÃO, sem remontar a story.
 *
 * É o caminho que o registro da descrição (`alert-dialog-description-registry.ts`)
 * existe para cobrir: a descrição sai com o painel ABERTO — como quando quem
 * lê apaga o texto no control. Mudar args de dentro da play não serve: o
 * ambiente da suíte remonta a story a cada render, e remontada ela nasce sem
 * descrição, que é outro caso (o da story WithoutDescription).
 *
 * Por isso o Playground entrega esta caixa reativa ao `AlertDialogStory`
 * (prop `descriptionOverride`), que a lê por dentro: escrever aqui muda a
 * descrição no MESMO componente, sem passar pelo render da story nem pelos
 * decorators. `undefined` = vale o arg; `''` = sem descrição.
 *
 * Só a play escreve, e ela devolve o valor a `undefined` antes de terminar.
 */
export const runtimeDescription = $state<{ current: string | undefined }>({ current: undefined });
