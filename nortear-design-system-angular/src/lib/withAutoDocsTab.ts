// HOC para Angular: monta o componente Angular de docs na aba "Documentação"
// e o autodocs do Storybook na aba "API Reference".
//
// A UI de docs do Storybook é React mesmo em projetos Angular. Escrito com
// React.createElement (sem JSX) de propósito: .tsx com JSX exige configuração
// de parser no bundler, e o vite 8/rolldown parou de habilitar JSX
// implicitamente em projetos sem plugin React. createElement é imune a config
// de bundler em qualquer versão.
//
// A ponte Angular é assíncrona — `createApplication()` devolve Promise. Ela
// existe porque um componente Angular standalone precisa de um
// EnvironmentInjector, e o Storybook não expõe o da story para a docs page.
// Cada aba "Documentação" monta uma aplicação própria e a destrói no cleanup;
// a alternativa (reaproveitar uma app global) vazaria estado de locale entre
// docs pages.
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  createComponent,
  provideZonelessChangeDetection,
  type ApplicationRef,
  type Type,
} from '@angular/core';
// createApplication vive em @angular/platform-browser, não em @angular/core.
import { createApplication } from '@angular/platform-browser';
import {
  Title,
  Description,
  Primary,
  Controls,
  Stories,
} from '@storybook/addon-docs/blocks';

const h = React.createElement;

type TabKey = 'docs' | 'api';

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return h(
    'button',
    {
      onClick,
      style: {
        padding: '0.625rem 1.25rem',
        fontSize: '0.8125rem',
        fontWeight: active ? 600 : 400,
        color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
        background: 'none',
        border: 'none',
        borderBottom: `2px solid ${active ? 'hsl(var(--primary))' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
        outline: 'none',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap' as const,
      },
    },
    children,
  );
}

function ApiReferencePage() {
  return h(
    'div',
    { className: 'nds-p-8', style: { maxWidth: '75rem', margin: '0 auto' } },
    h(Title, null),
    h(Description, null),
    h(Primary, null),
    h(Controls, null),
    h(Stories, { includePrimary: false }),
  );
}

/**
 * @example
 * // button.stories.ts
 * parameters: {
 *   docs: { page: withAutoDocsTab(ButtonDocsComponent) },
 * }
 */
export function withAutoDocsTab(DocsComponent: Type<unknown>) {
  return function DocsPageWithApiTab() {
    const [activeTab, setActiveTab] = useState<TabKey>('docs');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!ref.current || activeTab !== 'docs') return;

      const host = ref.current;
      // `cancelled` cobre a troca de aba (ou desmonte) antes de a Promise de
      // createApplication resolver: sem ele, a app resolveria depois do
      // cleanup e ficaria órfã, sem ninguém para destruí-la.
      let cancelled = false;
      let appRef: ApplicationRef | undefined;

      void createApplication({
        providers: [provideZonelessChangeDetection()],
      }).then((app) => {
        if (cancelled) {
          app.destroy();
          return;
        }
        appRef = app;
        const componentRef = createComponent(DocsComponent, {
          environmentInjector: app.injector,
          hostElement: host,
        });
        app.attachView(componentRef.hostView);
        // Primeiro ciclo explícito: em modo zoneless nada agenda a detecção
        // inicial de uma view recém-anexada fora de um evento do Angular.
        componentRef.changeDetectorRef.detectChanges();
      });

      return () => {
        cancelled = true;
        // destroy() já desanexa as views e roda ngOnDestroy dos filhos.
        appRef?.destroy();
        host.innerHTML = '';
      };
    }, [activeTab]);

    return h(
      React.Fragment,
      null,
      h(
        'div',
        {
          style: {
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'flex-end',
            borderBottom: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
            paddingLeft: '0.75rem',
          },
        },
        h(TabButton, { active: activeTab === 'docs', onClick: () => setActiveTab('docs') }, 'Documentação'),
        h(TabButton, { active: activeTab === 'api', onClick: () => setActiveTab('api') }, 'API Reference'),
      ),
      activeTab === 'docs' && h('div', { ref, style: { flex: 1, minHeight: '100%' } }),
      activeTab === 'api' && h(ApiReferencePage, null),
    );
  };
}
