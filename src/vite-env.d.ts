/// <reference types="vite/client" />

interface Window {
  junocash: import('./electron/preload').JunoCashAPI;
}
