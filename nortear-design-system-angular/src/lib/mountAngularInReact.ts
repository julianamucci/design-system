// Ponte React → Angular para os invólucros `.mdx` das páginas de Foundations.
//
// Uma página de fundamento não tem story: ela é um `.mdx` com `<Meta title>` e
// nada mais, como nas outras quatro stacks. Só que a UI de docs do Storybook é
// React mesmo em projeto Angular — então o `.mdx` precisa de um componente
// React que monte o componente Angular dentro de si.
//
// A mecânica é a MESMA do `withAutoDocsTab`: `createApplication()` (um
// componente standalone precisa de um EnvironmentInjector, e o Storybook não
// expõe o da story), `createComponent()` no host, `detectChanges()` explícito
// (em modo zoneless nada agenda a detecção inicial de uma view recém-anexada) e
// `cancelled` para o caso de a Promise resolver depois do desmonte. Este módulo
// existe para as dezesseis páginas não repetirem esse mesmo bloco dezesseis
// vezes — e para uma correção na ponte valer para todas de uma vez.
//
// Escrito com `React.createElement` (sem JSX) de propósito, pelo mesmo motivo do
// `withAutoDocsTab`: `.tsx` exigiria configuração de parser no bundler, e o
// vite 8/rolldown parou de habilitar JSX implicitamente em projeto sem plugin
// React.
import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
  createComponent,
  provideZonelessChangeDetection,
  type ApplicationRef,
  type Type,
} from '@angular/core';
// createApplication vive em @angular/platform-browser, não em @angular/core.
import { createApplication } from '@angular/platform-browser';

const h = React.createElement;

/**
 * Devolve um componente React que monta `Componente` (Angular standalone).
 *
 * @example
 * // AccessibilityDocs.mdx
 * export const AccessibilityDocsPage = mountAngularInReact(NdsAccessibilityDocs);
 *
 * <AccessibilityDocsPage />
 */
export function mountAngularInReact(Componente: Type<unknown>) {
  return function PageAngular() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      // `cancelado` cobre o desmonte antes de a Promise de createApplication
      // resolver: sem ele a aplicação nasceria órfã, sem ninguém para destruí-la.
      let cancelado = false;
      let aplicacao: ApplicationRef | undefined;

      void createApplication({
        providers: [provideZonelessChangeDetection()],
      }).then((criada) => {
        if (cancelado) {
          criada.destroy();
          return;
        }
        aplicacao = criada;
        const refDoComponente = createComponent(Componente, {
          environmentInjector: criada.injector,
          hostElement: host,
        });
        criada.attachView(refDoComponente.hostView);
        refDoComponente.changeDetectorRef.detectChanges();
      });

      return () => {
        cancelado = true;
        // destroy() já desanexa as views e roda ngOnDestroy dos filhos.
        aplicacao?.destroy();
        host.innerHTML = '';
      };
    }, []);

    return h('div', { ref: hostRef, style: { flex: 1, width: '100%', height: '100%' } });
  };
}
