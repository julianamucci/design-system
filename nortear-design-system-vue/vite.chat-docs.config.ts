// O bundle do chat de documentação, para o MANAGER do Storybook.
//
// A receita inteira — e o porquê de cada decisão, inclusive o `@` apontar para
// a implementação de referência em DOM — vive em um lugar só:
// ../docs/shared/bundler/config-chat.mjs. Cinco cópias divergiriam, e a
// divergência só apareceria no CI de uma stack.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { configDoChat } from '../docs/shared/bundler/config-chat.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(configDoChat(dirname));
