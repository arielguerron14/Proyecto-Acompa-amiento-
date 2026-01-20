(function() {
  // Global handler to capture unhandled promise rejections and log useful debug info
  // Helps identify origins of messages like:
  // "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"
  window.addEventListener('unhandledrejection', (event) => {
    try {
      console.error('[unhandledrejection] reason:', event.reason);
      if (event.reason && event.reason.stack) console.error('[unhandledrejection] stack:', event.reason.stack);
    } catch (err) {
      console.error('[unhandledrejection] error while logging reason:', err);
    }
  });
  // Maestro page loader: dynamically load required scripts and kick off horario loading
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve(src);
      s.onerror = (e) => reject(new Error(`Failed to load script ${src}: ${e.message}`));
      document.head.appendChild(s);
    });
  }

  // Load auth and horarios scripts, then call loadHorarios if available
  Promise.all([
    loadScript('js/auth.js'),
    loadScript('js/horarios.js')
  ]).then(() => {
    console.log('[maestro.js] Dependencies loaded');

    const runInit = () => {
      // Call initialization functions only after DOM is ready
      if (typeof initApp === 'function') {
        try { initApp(); } catch (err) { console.error('[maestro.js] initApp error', err); }
      }
      if (typeof loadHorarios === 'function') {
        try { loadHorarios(); } catch (err) { console.error('[maestro.js] loadHorarios error', err); }
      }
      if (typeof loadReportes === 'function') {
        try { loadReportes(); } catch (err) { console.error('[maestro.js] loadReportes error', err); }
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runInit);
    } else {
      runInit();
    }
  }).catch(err => {
    console.error('[maestro.js] Failed to load dependencies:', err);
  });
})();
