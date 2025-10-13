// Script de teste para verificar se o botão "Salvar Ficha de Referência" está funcionando
// Execute este script no console do navegador (F12) para diagnosticar problemas

(function() {
    console.log('🔍 === DIAGNÓSTICO DO BOTÃO SALVAR FICHA ===');
    
    // 1. Verificar se o botão existe
    const btnSalvar = document.getElementById('btn_salvar_ficha_referencia');
    console.log('1. Botão encontrado:', btnSalvar ? '✅ SIM' : '❌ NÃO');
    
    if (btnSalvar) {
        // 2. Verificar propriedades CSS do botão
        const computedStyle = window.getComputedStyle(btnSalvar);
        console.log('2. Propriedades CSS do botão:');
        console.log('   - display:', computedStyle.display);
        console.log('   - position:', computedStyle.position);
        console.log('   - zIndex:', computedStyle.zIndex);
        console.log('   - pointerEvents:', computedStyle.pointerEvents);
        console.log('   - cursor:', computedStyle.cursor);
        console.log('   - disabled:', btnSalvar.disabled);
        
        // 3. Verificar se há elementos sobrepostos
        const rect = btnSalvar.getBoundingClientRect();
        const elementUnder = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
        console.log('3. Elemento no centro do botão:', elementUnder);
        console.log('   - É o próprio botão?', elementUnder === btnSalvar ? '✅ SIM' : '❌ NÃO');
        
        if (elementUnder !== btnSalvar) {
            console.log('   - Elemento sobrepondo:', elementUnder.tagName, elementUnder.className, elementUnder.id);
        }
        
        // 4. Verificar event listeners
        const listeners = getEventListeners ? getEventListeners(btnSalvar) : 'Função getEventListeners não disponível';
        console.log('4. Event listeners:', listeners);
        
        // 5. Verificar modal pai
        const modal = btnSalvar.closest('.modal');
        if (modal) {
            const modalStyle = window.getComputedStyle(modal);
            console.log('5. Modal pai:');
            console.log('   - id:', modal.id);
            console.log('   - display:', modalStyle.display);
            console.log('   - zIndex:', modalStyle.zIndex);
        }
        
        // 6. Teste de clique programático
        console.log('6. Testando clique programático...');
        try {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            btnSalvar.dispatchEvent(clickEvent);
            console.log('   - Clique programático executado ✅');
        } catch (error) {
            console.log('   - Erro no clique programático ❌:', error);
        }
        
        // 7. Adicionar event listener de teste
        console.log('7. Adicionando event listener de teste...');
        btnSalvar.addEventListener('click', function testClick(e) {
            console.log('🎯 EVENT LISTENER DE TESTE ACIONADO!');
            console.log('   - Event object:', e);
            console.log('   - Target:', e.target);
            console.log('   - CurrentTarget:', e.currentTarget);
            
            // Remover este listener após o primeiro uso
            btnSalvar.removeEventListener('click', testClick);
        });
        
        // 8. Verificar função salvarFichaReferencia
        console.log('8. Função salvarFichaReferencia:');
        console.log('   - Existe?', typeof salvarFichaReferencia === 'function' ? '✅ SIM' : '❌ NÃO');
        if (typeof salvarFichaReferencia === 'function') {
            console.log('   - Código da função:', salvarFichaReferencia.toString().substring(0, 200) + '...');
        }
        
        // 9. Verificar elementos do formulário
        console.log('9. Elementos do formulário:');
        const form = document.getElementById('formFichaReferencia');
        console.log('   - Formulário encontrado:', form ? '✅ SIM' : '❌ NÃO');
        
        const textoRef = document.getElementById('texto_referencia');
        console.log('   - Campo texto_referencia:', textoRef ? '✅ SIM' : '❌ NÃO');
        
        const atendimentoId = document.getElementById('atendimento_id');
        console.log('   - Campo atendimento_id:', atendimentoId ? '✅ SIM' : '❌ NÃO');
        if (atendimentoId) {
            console.log('   - Valor atendimento_id:', atendimentoId.value);
        }
        
        // 10. Forçar correção do botão
        console.log('10. Aplicando correção forçada...');
        btnSalvar.style.position = 'relative';
        btnSalvar.style.zIndex = '1070';
        btnSalvar.style.pointerEvents = 'auto';
        btnSalvar.style.cursor = 'pointer';
        btnSalvar.style.display = 'inline-block';
        console.log('    - Correção aplicada ✅');
        
    }
    
    console.log('🔍 === FIM DO DIAGNÓSTICO ===');
    console.log('Para testar o botão, tente clicar nele agora.');
    console.log('Se ainda não funcionar, execute: document.getElementById("btn_salvar_ficha_referencia").click()');
})();
