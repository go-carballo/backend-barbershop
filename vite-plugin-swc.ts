import { transform } from '@swc/core';
import { readFileSync } from 'fs';

export function swcPlugin() {
  return {
    name: 'swc-transform',
    enforce: 'pre',
    async transform(code: string, id: string) {
      if (id.endsWith('.ts') && !id.includes('node_modules')) {
        const result = await transform(code, {
          jsc: {
            parser: { syntax: 'typescript', decorators: true },
            transform: { decoratorMetadata: true, legacyDecorator: true },
            target: 'es2022',
          },
          module: { type: 'commonjs' },
        });
        return { code: result.code };
      }
    },
  };
}
