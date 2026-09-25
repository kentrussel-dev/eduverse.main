// Loads the Excalidraw drawing library on demand (only when someone opens the board).
// It lives in a plain JS file because Excalidraw's type files need a newer TypeScript.
export const loadExcalidraw = () => Promise.all([import('@excalidraw/excalidraw'), import('@excalidraw/excalidraw/index.css')]).then(([m]) => m);
