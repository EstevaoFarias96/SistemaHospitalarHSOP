// static/js/observer.js
// -------------------------------------------------------------
// Observador para manter o scroll do editor Quill sempre no fim
// quando o usuário está próximo da parte inferior.
// -------------------------------------------------------------

export function initQuillObservers() {
    document.querySelectorAll('.ql-editor').forEach(setupObserver);
  }
  
  function setupObserver(el) {
    // Se já existe um observer associado, desconecta para evitar leaks
    if (el._qObserver) {
      el._qObserver.disconnect();
    }
  
    const observer = new MutationObserver(() => {
      const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
      if (nearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    });
  
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  
    // Guarda referência para remoção futura, se necessário
    el._qObserver = observer;
  }
  
  // Inicializa automaticamente quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', initQuillObservers);
  