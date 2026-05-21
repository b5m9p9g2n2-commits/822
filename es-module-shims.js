// es-module-shims - Minimal version for import map support
(function(global) {
  'use strict';

  if (global.__esModuleShimsLoaded) return;
  global.__esModuleShimsLoaded = true;

  const importMap = {};
  let currentScript;

  function getCurrentScript() {
    if (document.currentScript) return document.currentScript;
    const scripts = document.querySelectorAll('script');
    return scripts[scripts.length - 1];
  }

  function parseImportMap(text) {
    try {
      const map = JSON.parse(text);
      if (map.imports) {
        Object.keys(map.imports).forEach(key => {
          importMap[key] = new URL(map.imports[key], document.baseURI).href;
        });
      }
    } catch (e) {
      console.error('Failed to parse import map:', e);
    }
  }

  function resolveSpecifier(specifier) {
    if (importMap[specifier]) return importMap[specifier];
    if (importMap[specifier + '/']) return importMap[specifier + '/'];
    
    for (const key of Object.keys(importMap)) {
      if (key.endsWith('/') && specifier.startsWith(key)) {
        return importMap[key] + specifier.slice(key.length);
      }
    }
    return specifier;
  }

  function interceptImports() {
    const originalResolve = global.__resolveModuleSpecifier;
    
    global.__resolveModuleSpecifier = function(specifier, context, defaultResolve) {
      const resolved = resolveSpecifier(specifier);
      if (resolved !== specifier) {
        return Promise.resolve(resolved);
      }
      if (originalResolve) {
        return originalResolve(specifier, context, defaultResolve);
      }
      return defaultResolve(specifier, context, defaultResolve);
    };
  }

  function loadImportMaps() {
    const maps = document.querySelectorAll('script[type="importmap"]');
    maps.forEach(script => {
      if (script.textContent) {
        parseImportMap(script.textContent);
      } else if (script.src) {
        fetch(script.src)
          .then(res => res.text())
          .then(text => parseImportMap(text));
      }
    });
  }

  function init() {
    loadImportMaps();
    interceptImports();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);