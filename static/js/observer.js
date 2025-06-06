export function initQuillObservers() {
  document.querySelectorAll('.ql-editor').forEach(setupObserver);
}

function setupObserver(el) {
  const obs = new MutationObserver(muts => {
    muts.forEach(() => {
      const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
      if (nearBottom) el.scrollTop = el.scrollHeight;
    });
  });
  obs.observe(el, { childList: true, subtree: true, characterData: true });
}

document.addEventListener('DOMContentLoaded', initQuillObservers); 