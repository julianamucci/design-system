// Botão "Chromatic" na toolbar — abre a regressão visual do componente aberto.
//
// Por que não o painel do @chromatic-com/storybook: ele é travado pelo próprio
// addon em `CONFIG_TYPE !== 'DEVELOPMENT'`, e no build estático mostra só
// "Visual tests only runs locally". O painel precisa do lado Node do addon para
// disparar build e da autenticação — nada disso existe num estático.
//
// O appId sai do chromatic.config.json, que já é a fonte de verdade do projeto:
// nada de repetir o id aqui e deixar os dois divergirem. Ele não é segredo — é
// o mesmo id que aparece em toda permalink pública do Chromatic; o segredo é o
// CHROMATIC_PROJECT_TOKEN, que vive no ambiente de CI.
import React from 'react';
import { addons, types, useStorybookApi } from 'storybook/manager-api';

import chromaticConfig from '../chromatic.config.json';

const APP_ID = chromaticConfig.projectId.split(':')[1];
const ADDON_ID = 'nortear/chromatic-link';

/**
 * A URL de componente do Chromatic recebe o id do COMPONENTE, não o da story:
 * `ui-button`, e não `ui-button--playground`. Sem story aberta (índice, erro),
 * cai na lista de builds do projeto, que sempre existe.
 */
function urlDoChromatic(componentId?: string): string {
  return componentId
    ? `https://www.chromatic.com/component?appId=${APP_ID}&csfId=${componentId}`
    : `https://www.chromatic.com/builds?appId=${APP_ID}`;
}

function ChromaticLink(): React.ReactElement {
  const api = useStorybookApi();
  const current = api.getCurrentStoryData();
  // `componentId` existe nas entradas de índice do Storybook 7+; o fallback
  // cobre entrada de docs autônoma, que não tem componente associado.
  const componentId =
    (current as { componentId?: string } | undefined)?.componentId ??
    current?.id?.split('--')[0];

  return React.createElement(
    'a',
    {
      href: urlDoChromatic(componentId),
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Abrir a regressão visual deste componente no Chromatic',
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 28,
        padding: '0 10px',
        marginInlineStart: 6,
        borderRadius: 4,
        color: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        textDecoration: 'none',
      },
    },
    React.createElement(
      'svg',
      { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true },
      React.createElement('path', {
        d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.5a5.5 5.5 0 0 1 4.77 2.76l-3.9 2.25A2 2 0 0 0 12 10.5a2 2 0 0 0 0 4 2 2 0 0 0 .87-.2l3.9 2.25A5.5 5.5 0 1 1 12 6.5Z',
      }),
    ),
    'Chromatic',
  );
}

addons.add(ADDON_ID, {
  type: types.TOOL,
  title: 'Chromatic',
  // Fica fora do índice e da tela de erro, onde não há componente para abrir.
  match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
  render: ChromaticLink,
});
