import * as React from 'react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Title,
  Description,
  Primary,
  Controls,
  Stories,
} from '@storybook/addon-docs/blocks';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TabKey = 'docs' | 'api';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: TabButtonProps) {
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
        whiteSpace: 'nowrap',
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

// ─── HOC principal ────────────────────────────────────────────────────────────

/**
 * Adiciona uma aba "API Reference" (autodocs) à página de documentação customizada.
 * A aba "Documentação" mantém o componente original intacto.
 *
 * @example
 * // alert.stories.tsx
 * parameters: {
 *   docs: { page: withAutoDocsTab(AlertDocs) },
 * }
 */
export function withAutoDocsTab(CustomDocs: () => React.JSX.Element) {
  return function DocsPageWithApiTab() {
    const [activeTab, setActiveTab] = useState<TabKey>('docs');

    return (
      <>
        {/* Barra de abas */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0,
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

        {/* Conteúdo da aba ativa */}
        {activeTab === 'docs' && <CustomDocs />}
        {activeTab === 'api' && <ApiReferencePage />}
      </>
    );
  };
}
