/**
 * Script para gerenciar a navegação entre abas da página
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando navegação das abas...');
    
    // Debugar todas as abas disponíveis
    const tabs = document.querySelectorAll('#menuTabs .nav-link');
    console.log(`Encontradas ${tabs.length} abas para navegação`);
    tabs.forEach((tab, index) => {
        const targetId = tab.getAttribute('data-target');
        console.log(`Aba #${index+1}: data-target="${targetId}", texto="${tab.textContent.trim()}"`);
    });
    
    // Debugar todas as seções de conteúdo
    const sections = document.querySelectorAll('.content-section');
    console.log(`Encontradas ${sections.length} seções de conteúdo`);
    sections.forEach((section, index) => {
        console.log(`Seção #${index+1}: id="${section.id}"`);
    });
    
    // Configurar navegação das abas
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('data-target');
            console.log(`Clique na aba com alvo: ${targetId}`);
            
            // Remover active de todas as abas
            document.querySelectorAll('#menuTabs .nav-link').forEach(t => {
                t.classList.remove('active');
            });
            
            // Adicionar active à aba clicada
            this.classList.add('active');
            console.log(`Classe 'active' adicionada à aba: ${this.textContent.trim()}`);
            
            // Esconder todas as seções de conteúdo
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
                console.log(`Removida classe 'active' da seção: ${section.id}`);
            });
            
            // Mostrar a seção alvo
            if (targetId) {
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    console.log(`Adicionada classe 'active' à seção alvo: ${targetId}`);
                } else {
                    console.error(`ERRO: Seção alvo não encontrada: ${targetId}`);
                }
            }
        });
    });
    
    // Ativar a primeira aba por padrão
    const firstTab = document.querySelector('#menuTabs .nav-link');
    if (firstTab) {
        console.log(`Ativando a primeira aba por padrão: ${firstTab.textContent.trim()}`);
        firstTab.click();
    } else {
        console.error('ERRO: Nenhuma aba encontrada para ativar por padrão');
    }
}); 