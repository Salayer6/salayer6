import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you are deploying to GitHub Pages, you might need to set the base path.
  // For example, if your repository is at https://<username>.github.io/<repo-name>/,
  // then you should set base to '/<repo-name>/'.
  base: '/your-repo-name/',
})
