import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'jsonc-text-loader',
      transform(code, id) {
        if (id.endsWith('.jsonc')) {
          // Export the raw text content as default export
          // This simulates Cloudflare Workers Text Module rule
          return `export default ${JSON.stringify(code)};`;
        }
      }
    }
  ]
});
