// HOC para Svelte 5: monta o componente Svelte de docs (via mount/unmount) na
// aba "Documentação" e o autodocs do Storybook na aba "API Reference".
//
// A UI de docs do Storybook é React mesmo em projetos Svelte. Escrito com
// React.createElement (sem JSX) de propósito: .tsx com JSX exige configuração
// de parser no bundler, e o vite 8/rolldown parou de habilitar JSX
// implicitamente em projetos sem plugin React. createElement é imune a config
// de bundler em qualquer versão.
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { mount, unmount } from 'svelte';
import type { Component } from 'svelte';
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
  children: React.ReactNode;
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
export function withAutoDocsTab(SvelteComponent: Component) {
  return function DocsPageWithApiTab() {
    const [activeTab, setActiveTab] = useState<TabKey>('docs');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!ref.current || activeTab !== 'docs') return;
      const app = mount(SvelteComponent, { target: ref.current });
      return () => {
        try { unmount(app); } catch { /* já desmontado */ }
        if (ref.current) ref.current.innerHTML = '';
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
