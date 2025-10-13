
console.log('🧪 Testando interceptação DOMNodeInserted...');

// Teste para confirmar que a interceptação está funcionando
setTimeout(() => {
    const testElement = document.createElement('div');
    document.body.appendChild(testElement);
    
    // Tentar adicionar listener DOMNodeInserted - deve ser interceptado
    testElement.addEventListener('DOMNodeInserted', function() {
        console.log('✅ MutationObserver funcionando corretamente');
    });
    
    // Adicionar elemento filho para triggerar o evento
    const childElement = document.createElement('span');
    testElement.appendChild(childElement);
    
    // Limpar teste
    setTimeout(() => {
        document.body.removeChild(testElement);
        console.log('🧹 Teste de interceptação concluído');
    }, 100);
}, 1000);

