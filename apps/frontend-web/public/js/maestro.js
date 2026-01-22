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

  // Load auth and, if needed, horarios script (avoid double include)
  const loaders = [loadScript('js/auth.js')];
  if (!(typeof initApp === 'function' || typeof initAppOnce === 'function')) {
    loaders.push(loadScript('js/horarios.js'));
  }

  Promise.all(loaders).then(() => {
    console.log('[maestro.js] Dependencies loaded');

    const runInit = () => {
      // Call initialization functions only after DOM is ready
      if (typeof initAppOnce === 'function') {
        try { initAppOnce(); } catch (err) { console.error('[maestro.js] initAppOnce error', err); }
        return; // initAppOnce internally triggers loading flows
      }
      if (typeof initApp === 'function') {
        try { initApp(); } catch (err) { console.error('[maestro.js] initApp error', err); }
        return; // initApp will handle loading of horarios/reportes
      }
      // Fallback: call loaders individually if init isn't available
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
