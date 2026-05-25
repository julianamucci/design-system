import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  Title,
  Description,
  Primary,
  Controls,
  Stories,
} from '@storybook/addon-docs/blocks';

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
  return (
    <button
      onClick={onClick}
      style={{
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
      }}
    >
      {children}
    </button>
  );
}

function ApiReferencePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '75rem', margin: '0 auto' }}>
      <Title />
      <Description />
      <Primary />
      <Controls />
      <Stories includePrimary={false} />
    </div>
  );
}

/**
 * HOC para Basecoat (Vanilla TS): monta um elemento HTMLElement criado por `createDocs`
 * na aba "Documentação" e mostra o autodocs na aba "API Reference".
 *
 * @example
 * // alert.stories.ts
 * parameters: {
 *   docs: { page: withAutoDocsTab(createAlertDocs) },
 * }
 */
export function withAutoDocsTab(createDocs: () => HTMLElement) {
  return function DocsPageWithApiTab() {
    const [activeTab, setActiveTab] = useState<TabKey>('docs');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!ref.current || activeTab !== 'docs') return;
      const el = createDocs();
      ref.current.appendChild(el);
      return () => {
        if (ref.current) ref.current.innerHTML = '';
      };
    }, [activeTab]);

    return (
      <>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'flex-end',
            borderBottom: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
            paddingLeft: '0.75rem',
          }}
        >
          <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')}>
            Documentação
          </TabButton>
          <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')}>
            API Reference
          </TabButton>
        </div>

        {activeTab === 'docs' && (
          <div ref={ref} style={{ flex: 1, minHeight: '100%' }} />
        )}
        {activeTab === 'api' && <ApiReferencePage />}
      </>
    );
  };
}
