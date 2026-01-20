/**
 * Global Error Handler para suprimir errores de extensiones del navegador
 * Previene que errores de comunicación entre content scripts y background scripts 
 * causen problemas en la consola de desarrollo
 */

(function() {
  'use strict';

  // Suprimir errores de extensiones que fallan al comunicarse
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    const msg = String(error?.message || error || '');
    
    // Patrones de errores que vienen de extensiones del navegador
    const extensionErrorPatterns = [
      'message channel',
      'asynchronous response',
      'listener indicated',
      'closed before a response',
      'port was disconnected',
      'Extension context invalidated'
    ];

    // Verificar si es un error conocido de extensión
    const isExtensionError = extensionErrorPatterns.some(pattern => 
      msg.includes(pattern)
    );

    if (isExtensionError) {
      event.preventDefault();
      console.debug('[ExtensionErrorHandler] Suppressed extension error:', {
        type: error?.name || 'Unknown',
        message: msg
      });
    }
  });

  // También capturar errores de console para extensiones problemáticas
  const originalError = console.error;
  console.error = function(...args) {
    const msg = String(args[0] || '');
    const isExtensionError = [
      'message channel',
      'asynchronous response',
      'listener indicated'
    ].some(pattern => msg.includes(pattern));

    if (!isExtensionError) {
      originalError.apply(console, args);
    }
  };
})();
