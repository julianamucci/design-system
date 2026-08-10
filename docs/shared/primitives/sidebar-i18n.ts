/**
 * Cola do lado do MANAGER: liga o idioma escolhido no preview aos rótulos da
 * sidebar.
 *
 * Manager e preview são frames diferentes, e o locale vive numa store do
 * preview que persiste em `localStorage`. A ponte é o evento nativo `storage`:
 * ele dispara nos OUTROS documentos da mesma origem, nunca no que escreveu.
 * O preview escreve, o manager ouve — sem canal do Storybook e sem acoplar o
 * código de aplicação ao addon.
 *
 * O React vem por parâmetro porque este arquivo é primitivo compartilhado e não
 * deve depender de framework; quem chama é o `manager.ts` de cada stack, que já
 * tem o React do próprio manager.
 */

import { negociarLocale, type Locale } from './locale-negotiation';
import { rotuloDaSidebar } from './sidebar-labels';

const CHAVE = 'ds-locale';

type Ouvinte = () => void;

/** Store mínima: valor + assinatura, no formato que `useSyncExternalStore` pede. */
function criarLoja() {
  let atual: Locale = negociarLocale(undefined, undefined, CHAVE);
  const ouvintes = new Set<Ouvinte>();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== CHAVE) return;
      const novo = negociarLocale(undefined, undefined, CHAVE);
      if (novo === atual) return;
      atual = novo;
      ouvintes.forEach((o) => o());
    });
  }

  return {
    ler: () => atual,
    assinar: (o: Ouvinte) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
  };
}

/**
 * A fatia do React que este arquivo usa. Adaptador estrutural para não puxar
 * `@types/react` numa pasta compartilhada por cinco stacks.
 *
 * Os parâmetros são `any` de propósito, e não `unknown`: parâmetro de função é
 * CONTRAVARIANTE, então uma função que aceita `unknown` não é atribuível a
 * partir do `createElement` real, que aceita tipos específicos. Com `unknown` o
 * tipo era impossível de satisfazer — o stack Angular, que tem `@types/react`
 * instalado pelo Storybook, não compilava; os outros passavam só porque lá o
 * `React` já chegava como `any`.
 */
type ReactMinimo = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createElement: (tipo: any, props?: any, ...filhos: any[]) => unknown;
  useSyncExternalStore: <T>(assinar: (o: Ouvinte) => () => void, ler: () => T) => T;
};

/**
 * `renderLabel` para o `addons.setConfig({ sidebar: { renderLabel } })`.
 *
 * Devolve um componente em vez de uma string: assim cada rótulo assina a loja e
 * se redesenha sozinho na troca de idioma. Devolver string exigiria redesenhar
 * a sidebar inteira, e o manager não expõe gatilho para isso.
 */
export function criarRenderLabel(React: ReactMinimo) {
  const loja = criarLoja();

  function Rotulo({ nome }: { nome: string }) {
    const locale = React.useSyncExternalStore(loja.assinar, loja.ler);
    return rotuloDaSidebar(nome, locale) as unknown as null;
  }

  return (item: { name?: string }) =>
    React.createElement(Rotulo, { nome: item?.name ?? '', key: item?.name });
}
