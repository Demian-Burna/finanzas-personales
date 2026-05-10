'use client'

// Zero-render client component — imported by the dashboard page only to ensure
// Next.js generates page_client-reference-manifest.js for the (dashboard) route group.
// Without at least one 'use client' in the page's direct import tree, the RSC
// manifest file is not emitted, causing an ENOENT during Vercel's file tracing step.
export function RefMarker() {
  return null
}
