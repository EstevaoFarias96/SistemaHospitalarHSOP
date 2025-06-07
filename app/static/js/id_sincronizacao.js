/**
 * id_sincronizacao.js
 * 
 * Este arquivo provê funções para sincronização de IDs entre diferentes partes do sistema HSOP,
 * resolvendo problemas com IDs de internação/atendimento inconsistentes entre scripts.
 */

// Executar sincronização ao carregar o script
(function() {
    // Registrar evento para quando o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", sincronizarIds);
    } else {
        // Se o DOM já estiver carregado, executar imediatamente
        sincronizarIds();
    }
})();

/**
 * Sincroniza todos os IDs relevantes no sistema, garantindo consistência
 */
function sincronizarIds() {
    console.log('[Debug] Iniciando sincronização de IDs...');
    
    // Passo 1: Coletar IDs de todas as fontes possíveis
    const fontes = {
        windowAtendimentoId: window.ATENDIMENTO_ID,
        windowInternacaoId: window.internacaoId,
        domInternacaoId: document.getElementById('internacao_id')?.value,
        domAtendimentoId: document.getElementById('atendimento_id')?.value,
        urlPathId: extrairIdDaUrl()
    };
    
    console.log('[Debug] IDs encontrados:', fontes);
    
    // Passo 2: Encontrar o ID mais confiável entre todas as fontes
    const idFinal = escolherIdMaisConfiavel(fontes);
    
    if (!idFinal) {
        console.warn('[Debug] Nenhum ID válido encontrado durante a sincronização');
        return;
    }
    
    console.log(`[Debug] ID final escolhido para sincronização: ${idFinal}`);
    
    // Passo 3: Sincronizar IDs em todas as fontes
    sincronizarTodasFontes(idFinal);
    
    // Passo 4: Garantir que qualquer carregamento posterior use o ID correto
    adicionarListenerAjax();
    
    console.log('[Debug] Sincronização de IDs concluída');
}

/**
 * Extrai o ID da URL atual, se possível
 */
function extrairIdDaUrl() {
    const partes = window.location.pathname.split('/');
    const ultimaParte = partes[partes.length - 1];
    
    // Se a última parte for um número e não parecer uma data (não muito longo)
    if (!isNaN(ultimaParte) && ultimaParte.length < 10) {
        return ultimaParte;
    }
    
    return null;
}

/**
 * Verifica se um ID é válido para uso como atendimento/internação
 */
function ehIdValido(id) {
    if (!id) return false;
    
    // Converter para string e verificar se é numérico
    const idStr = String(id);
    
    // Verificar se é um número e se tem comprimento razoável
    if (isNaN(parseInt(idStr)) || idStr.length > 10) return false;
    
    // Verificar se não contém caracteres suspeitos como '/'
    if (idStr.includes('/')) return false;
    
    return true;
}

/**
 * Escolhe o ID mais confiável entre todas as fontes
 */
function escolherIdMaisConfiavel(fontes) {
    // Ordem de prioridade: windowAtendimentoId > domInternacaoId > windowInternacaoId > urlPathId
    const ordem = ['windowAtendimentoId', 'domInternacaoId', 'windowInternacaoId', 'domAtendimentoId', 'urlPathId'];
    
    for (const fonte of ordem) {
        if (ehIdValido(fontes[fonte])) {
            return fontes[fonte];
        }
    }
    
    // Se nenhuma fonte prioritária tem um ID válido, procurar em qualquer fonte
    for (const fonte in fontes) {
        if (ehIdValido(fontes[fonte])) {
            return fontes[fonte];
        }
    }
    
    return null;
}

/**
 * Sincroniza o ID em todas as fontes importantes
 */
function sincronizarTodasFontes(idFinal) {
    // Sincronizar variáveis globais
    window.ATENDIMENTO_ID = idFinal;
    window.internacaoId = idFinal;
    
    // Sincronizar elementos do DOM
    const idElementos = ['internacao_id', 'atendimento_id', 'atendimentos_clinica_id'];
    
    idElementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (elemento.tagName === 'INPUT') {
                elemento.value = idFinal;
            } else {
                // Para outros tipos de elementos
                elemento.textContent = idFinal;
                if (!elemento.hasAttribute('data-id')) {
                    elemento.setAttribute('data-id', idFinal);
                }
            }
        } else {
            // Se o elemento não existir, criá-lo como hidden input
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = id;
            hiddenInput.value = idFinal;
            document.body.appendChild(hiddenInput);
        }
    });
    
    // Adicionar data attributes para elementos que podem consumir o ID
    document.querySelectorAll('[data-usa-internacao-id]').forEach(elem => {
        elem.dataset.internacaoId = idFinal;
    });
}

/**
 * Adiciona interceptador para requisições AJAX para garantir que usem o ID correto
 */
function adicionarListenerAjax() {
    if (!window.jQuery) return;
    
    const originalAjax = $.ajax;
    
    $.ajax = function(url, options) {
        // Normalizar parâmetros
        if (typeof url === 'object') {
            options = url;
            url = undefined;
        }
        
        options = options || {};
        options.url = options.url || url;
        
        // Se a URL contém padrão de ID inválido, tentar corrigir
        if (options.url && typeof options.url === 'string') {
            // Padrões como "api/prescricoes/undefined" ou "api/internacoes/null"
            const urlInvalida = options.url.match(/\/(undefined|null|NaN)\/?/i);
            
            if (urlInvalida) {
                console.warn(`[Debug] URL com ID inválido detectada: ${options.url}`);
                
                if (window.ATENDIMENTO_ID) {
                    // Substituir o ID inválido pelo ATENDIMENTO_ID
                    options.url = options.url.replace(/(undefined|null|NaN)/i, window.ATENDIMENTO_ID);
                    console.log(`[Debug] URL corrigida: ${options.url}`);
                }
            }
        }
        
        return originalAjax.apply(this, [options]);
    };
}
