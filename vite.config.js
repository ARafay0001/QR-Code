import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function inlineEntryStylesheet() {
  return {
    name: 'inline-entry-stylesheet',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const stylesheets = Object.values(bundle).filter(
        (asset) =>
          asset.type === 'asset' && asset.fileName.endsWith('.css'),
      )

      for (const output of Object.values(bundle)) {
        if (output.type !== 'asset' || !output.fileName.endsWith('.html')) {
          continue
        }

        let html = String(output.source)
        const inlinedStylesheets = new Set()

        html = html.replace(
          /<link\b[^>]*rel="stylesheet"[^>]*>/g,
          (link) => {
            const href = link.match(/\bhref="([^"]+)"/)?.[1]
            if (!href) return link

            const fileName = decodeURIComponent(
              new URL(href, 'https://vite.invalid').pathname,
            ).replace(/^\/+/, '')
            const stylesheet = stylesheets.find(
              (asset) => asset.fileName === fileName,
            )
            if (!stylesheet) return link

            inlinedStylesheets.add(stylesheet.fileName)
            const css =
              typeof stylesheet.source === 'string'
                ? stylesheet.source
                : new TextDecoder().decode(stylesheet.source)
            return `<style>${css}</style>`
          },
        )

        output.source = html
        for (const fileName of inlinedStylesheets) {
          delete bundle[fileName]
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineEntryStylesheet()],
})