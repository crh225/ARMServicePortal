{%- if values.app_type == 'static' %}
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../${{ values.build_output_dir }}',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
{%- else %}
// Not used for server apps
export default {};
{%- endif %}
