/// <reference types="vite/client" />

import type { SlingshotApi } from '../preload/index'

declare global {
  interface Window {
    slingshot: SlingshotApi
  }
}
