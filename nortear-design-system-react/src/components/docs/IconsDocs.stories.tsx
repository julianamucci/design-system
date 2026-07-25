/**
 * Este arquivo foi substituído por IconsDocs.mdx.
 * A página de Foundations usa o padrão "unattached" (Meta sem prop "of").
 *
 * tags: ['!dev', '!autodocs', '!test'] excluem este stub do sidebar,
 * do autodocs e da suite de testes — ele existe apenas para evitar
 * erros de lint em projetos que exigem default export em *.stories.* files.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: '_internal/foundations-icons-legacy',
  tags: ['!dev', '!autodocs', '!test'],
} satisfies Meta;

export default meta;

// Story stub obrigatório (regra storybook/story-exports). Marcado com !test
// pelas tags do meta — não aparece no sidebar nem roda nos testes.
export const _Stub: StoryObj<typeof meta> = {
  render: () => <></>,
};
