import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 주소가 /shelter-lambda/ 아래에 있어서 경로 앞에 붙여 줌
  base: '/shelter-lambda/',
})