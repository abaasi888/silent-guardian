self.addEventListener('message', (e) => { self.postMessage({ processed: e.data }); });
