export const registerSW = () => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js'); };
