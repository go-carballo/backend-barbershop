
import { transform } from '@swc/core';
import { readFileSync } from 'fs';

export default {
  name: 'swc-transpiler',
  enforce: 'pre',
  async load(id) {
    if (id.endsWith('.ts') || id.endsWith('.tsx')) {
      const content = readFileSync(id.replace(/\?#.*$/, ''), 'utf-8');
      const result = await transform(content, {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
            legacyDecorator: true,
          },
          target: 'es2022',
          loose: false,
        },
        module: {
          type: 'commonjs',
        },
        sourcemap: true,
      });
      return result.code;
    }
  },
};
