import { execSync } from 'node:child_process'

/**
 * Builds the extension once per run into .output/chrome-mv3-e2e, so tests
 * never touch the dev or production build.
 */
export default function setup() {
  execSync('pnpm exec wxt build --mode e2e', { stdio: 'inherit' })
}
