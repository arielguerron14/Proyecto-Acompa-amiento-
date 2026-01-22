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
    const msgLower = msg.toLowerCase();
    
    // Patrones de errores que vienen de extensiones del navegador
    const extensionErrorPatterns = [
      'message channel',
      'asynchronous response',
      'listener indicated',
      'closed before a response',
      'port was disconnected',
      'extension context invalidated'
    ];

    // Verificar si es un error conocido de extensión
    const isExtensionError = extensionErrorPatterns.some(pattern => 
      msgLower.includes(pattern)
    );

    if (isExtensionError) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      console.debug('[ExtensionErrorHandler] Suppressed extension error:', {
        type: error?.name || 'Unknown',
        message: msg
      });
    }
  });

  // Capturar errores genéricos que muestren el mismo patrón
  window.addEventListener('error', function(event) {
    try {
      const msgLower = String(event.message || '').toLowerCase();
      const isExtensionError = [
        'message channel',
        'asynchronous response',
        'listener indicated',
        'closed before a response',
        'port was disconnected',
        'extension context invalidated'
      ].some(pattern => msgLower.includes(pattern));

      // También suprimir errores cuyo filename provenga de chrome-extension://
      const isFromExtension = String(event.filename || '').startsWith('chrome-extension://');

      if (isExtensionError || isFromExtension) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        console.debug('[ExtensionErrorHandler] Suppressed window.error:', {
          message: event.message,
          source: event.filename
        });
      }
    } catch (_) {
      // no-op
    }
  }, true);

  // También capturar errores de console para extensiones problemáticas
  const originalError = console.error;
  console.error = function(...args) {
    const msg = String(args[0] || '');
    const msgLower = msg.toLowerCase();
    const isExtensionError = [
      'message channel',
      'asynchronous response',
      'listener indicated'
    ].some(pattern => msgLower.includes(pattern));

    if (!isExtensionError) {
      originalError.apply(console, args);
    }
  };
})();
