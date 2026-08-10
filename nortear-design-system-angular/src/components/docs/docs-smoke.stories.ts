// Suíte de fumaça das docs pages (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.ts.
// Política: crash no mount → export fica FORA (listado no comentário); axe
// falhando → parameters.a11y.test:'todo' com as rules no comentário; página
// limpa → axe é portão.
//
// Um export por docs page implementada. O stack está em construção: a lista
// cresce a cada componente do roteiro em .pipeline-context/_ordem.md.

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { auditarPaginaDeDocs, descreverProblemas } from '@shared/testing/docs-page-contract';
import { NdsButtonDocs } from './ButtonDocs';
import { NdsSeparatorDocs } from './SeparatorDocs';
import { NdsLabelDocs } from './LabelDocs';
import { NdsCardDocs } from './CardDocs';
import { NdsBadgeDocs } from './BadgeDocs';
import { NdsSkeletonDocs } from './SkeletonDocs';
import { NdsAspectRatioDocs } from './AspectRatioDocs';
import { NdsInputDocs } from './InputDocs';

const meta: Meta = {
  title: 'QA/Docs Smoke',
  tags: ['!dev'],
  decorators: [moduleMetadata({ imports: [NdsButtonDocs, NdsSeparatorDocs, NdsLabelDocs, NdsCardDocs, NdsBadgeDocs, NdsSkeletonDocs, NdsAspectRatioDocs, NdsInputDocs] })],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

const play: Story['play'] = async ({ canvasElement, parameters }) => {
  // Prova que a página montou de verdade (crash = teste vermelho).
  // O axe do addon-a11y roda sozinho depois da play (preview: a11y.test = 'error').
  await expect(
    canvasElement.querySelector('section[id], section.nds-docs-section-divider'),
  ).not.toBeNull();

  // Contrato de conteúdo, compartilhado pelas stacks. Montar sem crashar e
  // passar no axe não alcança o que se vê na tela: preview encostado à
  // esquerda, bloco de código vazio, chave de tradução renderizada como texto.
  const problemas = auditarPaginaDeDocs(canvasElement, {
    ignorar: (parameters as { contratoDocs?: { ignorar?: Record<string, string> } }).contratoDocs
      ?.ignorar,
  });
  await expect(
    problemas,
    problemas.length ? `\n${descreverProblemas(problemas)}\n` : '',
  ).toEqual([]);

  // Idioma do documento QUE O LEITOR LÊ. Esta suíte roda dentro do iframe do
  // preview, servido como <html lang="en"> pelo template do Storybook: se o
  // applySeo voltar a escrever o lang só no documento pai, a prosa em português
  // volta a ser anunciada em inglês e ninguém percebe. WCAG 3.1.1.
  await waitFor(() => expect(document.documentElement.lang).toBe('pt-BR'));
};

export const Button: Story = {
  render: () => ({ template: '<nds-button-docs />' }),
  play,
};

export const Separator: Story = {
  render: () => ({ template: '<nds-separator-docs />' }),
  play,
};

export const Label: Story = {
  render: () => ({ template: '<nds-label-docs />' }),
  play,
};

export const Card: Story = {
  render: () => ({ template: '<nds-card-docs />' }),
  play,
};

export const Badge: Story = {
  render: () => ({ template: '<nds-badge-docs />' }),
  play,
};

export const Skeleton: Story = {
  render: () => ({ template: '<nds-skeleton-docs />' }),
  play,
};

export const AspectRatio: Story = {
  render: () => ({ template: '<nds-aspect-ratio-docs />' }),
  play,
};

export const Input: Story = {
  render: () => ({ template: '<nds-input-docs />' }),
  play,
};
