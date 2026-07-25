// HOC para Vue 3: monta o componente Vue de docs na aba "Documentação" e o
// autodocs do Storybook na aba "API Reference".
//
// A UI de docs do Storybook é React mesmo em projetos Vue — por isso o React
// aqui. Escrito com React.createElement (sem JSX) de propósito: arquivos .tsx
// com JSX exigem configuração de parser no bundler, e o vite 8/rolldown parou
// de habilitar JSX implicitamente em projetos sem plugin React (quebrou o
// build). createElement é imune a config de bundler em qualquer versão.
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createApp, type Component } from 'vue';
import { createPinia } from 'pinia';
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
    { style: { padding: '2rem', maxWidth: '75rem', margin: '0 auto' } },
    h(Title, null),
    h(Description, null),
    h(Primary, null),
    h(Controls, null),
    h(Stories, { includePrimary: false }),
  );
}

/**
 * @example
 * // alert.stories.ts
 * parameters: {
 *   docs: { page: withAutoDocsTab(AlertDocs) },
 * }
 */
export function withAutoDocsTab(VueComponent: Component) {
  return function DocsPageWithApiTab() {
    const [activeTab, setActiveTab] = useState<TabKey>('docs');
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<ReturnType<typeof createApp> | null>(null);

    useEffect(() => {
      if (!containerRef.current || activeTab !== 'docs') return;
      const app = createApp(VueComponent);
      app.use(createPinia());
      app.mount(containerRef.current);
      appRef.current = app;
      return () => {
        if (appRef.current) {
          appRef.current.unmount();
          appRef.current = null;
        }
        if (containerRef.current) containerRef.current.innerHTML = '';
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
      activeTab === 'docs' &&
        h('div', {
          ref: containerRef,
          style: { flex: 1, minHeight: '100%', maxWidth: '100%', minWidth: 0 },
        }),
      activeTab === 'api' && h(ApiReferencePage, null),
    );
  };
}
