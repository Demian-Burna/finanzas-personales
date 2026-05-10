/**
 * Workaround for Next.js 14 bug: when the root page of a route group (e.g.
 * app/(dashboard)/page.tsx) renders only Server Components in its direct tree,
 * Next.js sometimes omits the page_client-reference-manifest.js file.
 * Vercel's file tracer then throws ENOENT when collecting build traces.
 *
 * This script ensures the file exists after the build. Its presence (not content)
 * is what satisfies the lstat() check in the tracer.
 */

import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const manifest = join(
  '.next',
  'server',
  'app',
  '(dashboard)',
  'page_client-reference-manifest.js',
)

if (!existsSync(manifest)) {
  mkdirSync(join('.next', 'server', 'app', '(dashboard)'), { recursive: true })
  writeFileSync(
    manifest,
    // Minimal valid RSC client reference manifest
    'self.__RSC_MANIFEST=(self.__RSC_MANIFEST||{});self.__RSC_MANIFEST["(dashboard)/page"]={"ssrModuleMapping":{},"edgeSSRModuleMapping":{},"clientModules":{},"entryCSSFiles":{}};',
  )
  console.log('[fix-rsc-manifest] Created missing page_client-reference-manifest.js')
} else {
  console.log('[fix-rsc-manifest] page_client-reference-manifest.js already exists, skipping.')
}
