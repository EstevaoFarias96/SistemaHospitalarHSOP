/**
 * Debug de Aprazamento
 * 
 * Este arquivo contém funções para diagnóstico e depuração do sistema de aprazamento.
 * Inclua-o temporariamente quando precisar diagnosticar problemas no módulo de aprazamento.
 */

console.log('✅ Debug de Aprazamento carregado');

// Função para verificar estado atual de prescrição
function debugPrescrição(prescricaoId) {
    console.log(`🔍 Debugando prescrição ID: ${prescricaoId}`);
    
    $.ajax({
        url: `/api/prescricoes/aprazamento/${prescricaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API:', response);
            
            if (response.success) {
                console.log('✅ Aprazamento encontrado:', response.aprazamento);
                
                // Verificar formato
                const formatoValido = validarFormatoAprazamento(response.aprazamento);
                console.log(`Formato válido: ${formatoValido ? '✅ Sim' : '❌ Não'}`);
                
                // Se tiver formato inválido, tentar corrigir
                if (!formatoValido && response.aprazamento) {
                    const corrigido = corrigirFormatoAprazamento(response.aprazamento);
                    console.log('Formato corrigido:', corrigido);
                    
                    // Sugerir atualização
                    console.log('Para corrigir, execute:');
                    console.log(`atualizarAprazamento(${prescricaoId}, "${corrigido}")`);
                }
                
                return response.aprazamento;
            } else {
                console.log('❌ Aprazamento não encontrado');
                return null;
            }
        },
        error: function(xhr) {
            console.error('❌ Erro ao verificar aprazamento:', xhr.responseText);
            return null;
        }
    });
}

// Função para verificar medicamentos de uma prescrição
function debugMedicamentos(prescricaoId) {
    console.log(`🔍 Debugando medicamentos da prescrição ID: ${prescricaoId}`);
    
    $.ajax({
        url: `/api/prescricoes/${prescricaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.prescricao) {
                console.log('✅ Prescrição encontrada');
                
                // Verificar medicamentos
                if (response.prescricao.medicamentos && response.prescricao.medicamentos.length > 0) {
                    console.log(`Quantidade de medicamentos: ${response.prescricao.medicamentos.length}`);
                    
                    response.prescricao.medicamentos.forEach((med, idx) => {
                        console.log(`\nMedicamento #${idx + 1}: ${med.nome_medicamento || 'Sem nome'}`);
                        console.log(`Uso: ${med.descricao_uso || 'Não especificado'}`);
                        console.log(`Aprazamento: ${med.aprazamento || 'Não aprazado'}`);
                        console.log(`Enfermeiro: ${med.enfermeiro_nome || 'Não informado'}`);
                        
                        if (med.aprazamento) {
                            const formatoValido = validarFormatoAprazamento(med.aprazamento);
                            console.log(`Formato válido: ${formatoValido ? '✅ Sim' : '❌ Não'}`);
                            
                            if (!formatoValido) {
                                const corrigido = corrigirFormatoAprazamento(med.aprazamento);
                                console.log('Formato corrigido:', corrigido);
                            }
                        }
                    });
                } else {
                    console.log('❌ Nenhum medicamento encontrado');
                }
                
                // Verificar aprazamento geral da prescrição
                if (response.prescricao.aprazamento) {
                    console.log('\nAprazamento geral da prescrição:', response.prescricao.aprazamento);
                    const formatoValido = validarFormatoAprazamento(response.prescricao.aprazamento);
                    console.log(`Formato válido: ${formatoValido ? '✅ Sim' : '❌ Não'}`);
                }
                
                return response.prescricao;
            } else {
                console.log('❌ Prescrição não encontrada');
                return null;
            }
        },
        error: function(xhr) {
            console.error('❌ Erro ao verificar medicamentos:', xhr.responseText);
            return null;
        }
    });
}

// Função para verificar tabela de prescrições
function debugTabelaPrescricoes() {
    console.log('🔍 Debugando tabela de prescrições');
    
    const table = $('table');
    if (table.length === 0) {
        console.log('❌ Nenhuma tabela encontrada');
        return;
    }
    
    console.log(`Total de tabelas: ${table.length}`);
    
    // Verificar células com aprazamento
    const celulasAprazamento = $('td:contains("Ver Aprazamentos")');
    console.log(`Células com botão de aprazamento: ${celulasAprazamento.length}`);
    
    celulasAprazamento.each(function(idx) {
        const btnAprazamento = $(this).find('.btn-visualizar-aprazamento');
        if (btnAprazamento.length > 0) {
            const aprazamento = btnAprazamento.data('aprazamento');
            const medicamento = btnAprazamento.data('medicamento');
            
            console.log(`\nAprazamento #${idx + 1}: ${medicamento}`);
            console.log(`Texto: ${aprazamento || 'Vazio'}`);
            
            if (aprazamento) {
                const formatoValido = validarFormatoAprazamento(aprazamento);
                console.log(`Formato válido: ${formatoValido ? '✅ Sim' : '❌ Não'}`);
                
                if (!formatoValido) {
                    const corrigido = corrigirFormatoAprazamento(aprazamento);
                    console.log('Formato corrigido:', corrigido);
                }
            }
        }
    });
}

// Função de diagnóstico completo da obtenção do ID da internação
function diagnosticarIdInternacao() {
    console.log('🔎 DIAGNÓSTICO COMPLETO DO ID DE INTERNAÇÃO');
    console.log('------------------------------------------');
    
    // Checar variáveis globais conhecidas
    const variaveisGlobais = [
        'internacaoId', 
        'idInternacao', 
        'id', 
        'atendimentoId', 
        'idAtendimento',
        'internacao_id',
        'atendimento_id'
    ];
    
    console.log('1. Verificando variáveis globais:');
    variaveisGlobais.forEach(varName => {
        if (typeof window[varName] !== 'undefined') {
            console.log(`   ✓ Variável ${varName} encontrada com valor: ${window[varName]}`);
        } else {
            console.log(`   ✗ Variável ${varName} não encontrada`);
        }
    });
    
    // Checar URL atual
    console.log('\n2. Analisando URL atual:');
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;
    
    console.log(`   URL completa: ${currentUrl}`);
    console.log(`   Caminho: ${currentPath}`);
    
    // Padrões comuns em URLs
    const regexPatterns = [
        /\/internacao\/(\d+)/,               // /internacao/123
        /\/paciente\/(\d+)\/internacao/,     // /paciente/123/internacao
        /\/atendimento[\/\-\_](\d+)/,        // /atendimento/123, /atendimento-123, /atendimento_123
        /\/evolucao\-paciente\-[^\/]+\/(\d+)/,  // /evolucao-paciente-medico/123
        /\/(clinica|enfermeiro|medico)\/(\d+)/, // /clinica/123, /enfermeiro/123, /medico/123
        /\/(\d+)$/                           // qualquer URL terminando com número
    ];
    
    regexPatterns.forEach((pattern, index) => {
        const matches = currentPath.match(pattern);
        if (matches) {
            console.log(`   ✓ Padrão #${index+1} encontrou: ${matches[matches.length-1]}`);
        } else {
            console.log(`   ✗ Padrão #${index+1} não encontrou correspondência`);
        }
    });
    
    // Checar parâmetros de URL
    console.log('\n3. Verificando parâmetros da URL:');
    const urlParams = new URLSearchParams(window.location.search);
    const paramNames = ['id', 'internacao_id', 'internacaoId', 'atendimento_id', 'atendimentoId'];
    
    paramNames.forEach(param => {
        if (urlParams.has(param)) {
            console.log(`   ✓ Parâmetro ${param} encontrado com valor: ${urlParams.get(param)}`);
        } else {
            console.log(`   ✗ Parâmetro ${param} não encontrado`);
        }
    });
    
    // Checar elementos DOM com IDs ou data attributes
    console.log('\n4. Verificando elementos DOM:');
    const idSelectors = [
        '[data-internacao-id]',
        '[data-id]',
        '[data-atendimento-id]',
        '#internacao-id',
        '#internacaoId',
        '#internacao_id',
        '#atendimento-id',
        '#atendimentoId',
        '#atendimento_id',
        '[name="internacao_id"]',
        '[name="internacaoId"]',
        '[name="atendimento_id"]',
        'input[value*="internacao_id"]',
        '#prescricao_enfermagem_internacao_id',
        '#internacao_id_evolucao'
    ];
    
    let elementosEncontrados = 0;
    
    idSelectors.forEach(selector => {
        const elements = $(selector);
        if (elements.length > 0) {
            const element = elements.first();
            let valor = null;
            
            // Tentar obter de diferentes formas
            if (element.data('internacao-id')) valor = element.data('internacao-id');
            else if (element.data('id')) valor = element.data('id');
            else if (element.data('atendimento-id')) valor = element.data('atendimento-id');
            else if (element.val()) valor = element.val();
            else if (element.text() && !isNaN(parseInt(element.text().trim()))) valor = element.text().trim();
            
            if (valor) {
                console.log(`   ✓ Seletor "${selector}" encontrou elemento com valor: ${valor}`);
                elementosEncontrados++;
            } else {
                console.log(`   ~ Seletor "${selector}" encontrou elemento, mas sem valor identificável`);
            }
        } else {
            console.log(`   ✗ Seletor "${selector}" não encontrou elementos`);
        }
    });
    
    if (elementosEncontrados === 0) {
        console.log('   ❗ Nenhum elemento DOM com ID de internação encontrado');
    }
    
    // Verificar ID na sessão
    console.log('\n5. Verificando dados de sessão:');
    if (window.session) {
        console.log('   ✓ Objeto session encontrado');
        
        if (window.session.internacao_id) {
            console.log(`   ✓ session.internacao_id encontrado: ${window.session.internacao_id}`);
        } else {
            console.log('   ✗ session.internacao_id não encontrado');
        }
        
        if (window.session.atendimento_id) {
            console.log(`   ✓ session.atendimento_id encontrado: ${window.session.atendimento_id}`);
        } else {
            console.log('   ✗ session.atendimento_id não encontrado');
        }
        
        // Listar outras possíveis propriedades da sessão
        console.log('   Outras propriedades da sessão:');
        Object.keys(window.session).forEach(key => {
            console.log(`     - ${key}: ${window.session[key]}`);
        });
    } else {
        console.log('   ✗ Objeto session não encontrado');
    }
    
    // Usar a função getInternacaoIdFromPage se disponível
    console.log('\n6. Tentando obter ID via função getInternacaoIdFromPage:');
    if (typeof getInternacaoIdFromPage === 'function') {
        const id = getInternacaoIdFromPage();
        if (id) {
            console.log(`   ✓ ID obtido: ${id}`);
        } else {
            console.log('   ✗ Função não retornou ID válido');
        }
    } else {
        console.log('   ✗ Função getInternacaoIdFromPage não está disponível');
    }
    
    // Conclusão
    console.log('\n🔬 CONCLUSÃO:');
    console.log('------------------------------------------');
    console.log('Para resolver problemas com o ID da internação:');
    console.log('1. Certifique-se de que o ID está presente em algum dos métodos acima');
    console.log('2. Adicione window.internacaoId = [ID_CORRETO] antes de chamar carregarPrescricoes()');
    console.log('3. Adicione um elemento oculto na página: <input type="hidden" id="internacao_id" value="[ID_CORRETO]">');
    console.log('------------------------------------------');
}

// Função para forçar o ID da internação e recarregar prescrições
function forcarIdInternacao(id) {
    if (!id || isNaN(parseInt(id))) {
        console.error('❌ ID inválido fornecido:', id);
        alert(`ID inválido: "${id}". Por favor, forneça um número válido.`);
        return false;
    }

    id = parseInt(id);
    console.log(`🔧 Forçando ID da internação para: ${id}`);
    
    // Definir ID globalmente
    window.internacaoId = id;
    
    // Adicionar um elemento hidden como backup
    if (!$('#internacao_id').length) {
        $('body').append(`<input type="hidden" id="internacao_id" value="${id}">`);
        console.log('✓ Elemento hidden adicionado ao DOM');
    } else {
        $('#internacao_id').val(id);
        console.log('✓ Valor do elemento hidden atualizado');
    }
    
    // Verificar se há outro elemento com nome similar
    const outrosElementos = [
        '#internacaoId',
        '#atendimento_id',
        '#atendimentoId',
        '#internacao-id',
        '#internacao_id_evolucao',
        '#prescricao_enfermagem_internacao_id'
    ];
    
    outrosElementos.forEach(selector => {
        if ($(selector).length) {
            $(selector).val(id);
            console.log(`✓ Valor do elemento ${selector} atualizado`);
        }
    });
    
    // Tentar recarregar as prescrições
    if (typeof carregarPrescricoes === 'function') {
        console.log('✓ Recarregando prescrições com o novo ID...');
        carregarPrescricoes(id);
        alert(`ID da internação definido como ${id}. Prescrições recarregadas.`);
    } else if (typeof carregarPrescricoesComAprazamento === 'function') {
        console.log('✓ Recarregando prescrições com aprazamento com o novo ID...');
        carregarPrescricoesComAprazamento(id);
        alert(`ID da internação definido como ${id}. Prescrições recarregadas com aprazamento.`);
    } else {
        console.warn('⚠️ Função de carregamento de prescrições não encontrada.');
        alert(`ID da internação definido como ${id}, mas não foi possível recarregar prescrições automaticamente. Recarregue a página manualmente.`);
    }
    
    return true;
}

// Função para criar um botão de debug na página
function criarApiDebug() {
    console.log('🔧 Adicionando API de debug ao window...');
    
    window.debugAprazamento = {
        verificarPrescricao: debugPrescrição,
        verificarMedicamentos: debugMedicamentos,
        verificarTabela: debugTabelaPrescricoes,
        testarConversao: testarConversãoAprazamento,
        corrigirAprazamento: corrigirFormatoAprazamento,
        atualizarAprazamento: atualizarAprazamento,
        diagnosticarId: diagnosticarIdInternacao,
        definirId: forcarIdInternacao
    };
    
    console.log('✅ API de debug disponível via "window.debugAprazamento"');
    console.log('👉 Exemplo de uso: window.debugAprazamento.diagnosticarId() ou window.debugAprazamento.definirId(123)');
}

// Função para testar conversão de formatos de aprazamento
function testarConversãoAprazamento(texto) {
    console.log('🔍 Testando conversão de formato de aprazamento');
    console.log('Original:', texto);
    
    const formatoValido = validarFormatoAprazamento(texto);
    console.log(`Formato válido: ${formatoValido ? '✅ Sim' : '❌ Não'}`);
    
    const corrigido = corrigirFormatoAprazamento(texto);
    console.log('Formato corrigido:', corrigido);
    
    return {
        original: texto,
        formatoValido,
        corrigido
    };
}

// Função para corrigir o formato de aprazamento
function corrigirFormatoAprazamento(texto) {
    if (!texto) return '';
    
    try {
        // Remover espaços extras e quebras de linha
        let corrigido = texto.trim()
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ');
        
        // Se não tiver o formato "DD/MM/YYYY:", adicionar o formato da data atual
        if (!corrigido.match(/\d{2}\/\d{2}\/\d{4}:/)) {
            const hoje = new Date();
            const dia = String(hoje.getDate()).padStart(2, '0');
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const ano = hoje.getFullYear();
            corrigido = `${dia}/${mes}/${ano}: ${corrigido}`;
        }
        
        // Verificar se as seções (separadas por ';') estão no formato "DD/MM/YYYY: HH:MM, HH:MM, ..."
        const secoes = corrigido.split(';');
        const secoesCorrigidas = secoes.map(secao => {
            secao = secao.trim();
            if (!secao) return '';
            
            // Verificar se a seção tem o formato "DD/MM/YYYY: HH:MM, HH:MM, ..."
            const partes = secao.split(':');
            if (partes.length < 2) return '';
            
            const data = partes[0].trim();
            // Verificar se a data está no formato DD/MM/YYYY
            if (!data.match(/\d{2}\/\d{2}\/\d{4}/)) return '';
            
            // O resto é considerado horários separados por vírgula
            const horarios = partes.slice(1).join(':').split(',').map(h => h.trim()).filter(h => h);
            
            // Verificar se os horários estão no formato HH:MM
            const horariosCorrigidos = horarios.map(h => {
                // Se já estiver no formato HH:MM, manter
                if (h.match(/^\d{2}:\d{2}$/)) return h;
                
                // Tentar extrair horas e minutos
                const match = h.match(/(\d{1,2}):(\d{1,2})/);
                if (match) {
                    const hora = String(parseInt(match[1], 10)).padStart(2, '0');
                    const minuto = String(parseInt(match[2], 10)).padStart(2, '0');
                    return `${hora}:${minuto}`;
                }
                
                return h;
            });
            
            return `${data}: ${horariosCorrigidos.join(', ')}`;
        }).filter(s => s);
        
        return secoesCorrigidas.join('; ');
    } catch (error) {
        console.error('Erro ao corrigir formato de aprazamento:', error);
        return texto;
    }
}

// Função para validar formato de aprazamento
function validarFormatoAprazamento(texto) {
    if (!texto) return false;
    
    try {
        // Verificar se o texto tem o formato "DD/MM/YYYY: HH:MM, HH:MM, ...; DD/MM/YYYY: HH:MM, ..."
        const secoes = texto.split(';');
        if (secoes.length === 0) return false;
        
        // Verificar se cada seção tem o formato "DD/MM/YYYY: HH:MM, HH:MM, ..."
        return secoes.every(secao => {
            secao = secao.trim();
            if (!secao) return true; // Ignora seções vazias
            
            // Verificar se a seção tem o formato "DD/MM/YYYY: HH:MM, HH:MM, ..."
            const partes = secao.split(':');
            if (partes.length < 2) return false;
            
            const data = partes[0].trim();
            // Verificar se a data está no formato DD/MM/YYYY
            if (!data.match(/\d{2}\/\d{2}\/\d{4}/)) return false;
            
            // O resto é considerado horários separados por vírgula
            const horarios = partes.slice(1).join(':').split(',').map(h => h.trim()).filter(h => h);
            
            // Verificar se os horários estão no formato HH:MM
            return horarios.every(h => h.match(/\d{1,2}:\d{1,2}/));
        });
    } catch (error) {
        console.error('Erro ao validar formato de aprazamento:', error);
        return false;
    }
}

// Função para atualizar o aprazamento de uma prescrição
function atualizarAprazamento(prescricaoId, aprazamento) {
    console.log(`🔧 Atualizando aprazamento da prescrição ID: ${prescricaoId}`);
    console.log('Novo aprazamento:', aprazamento);
    
    $.ajax({
        url: `/api/prescricoes/aprazamento/${prescricaoId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            aprazamento: aprazamento
        }),
        success: function(response) {
            if (response.success) {
                console.log('✅ Aprazamento atualizado com sucesso');
                alert('Aprazamento atualizado com sucesso!');
                
                // Recarregar a página para mostrar os novos dados
                if (typeof window.carregarPrescricoes === 'function') {
                    window.carregarPrescricoes();
                } else {
                    location.reload();
                }
            } else {
                console.log('❌ Erro ao atualizar aprazamento:', response.message);
                alert(`Erro ao atualizar aprazamento: ${response.message || 'Erro desconhecido'}`);
            }
        },
        error: function(xhr) {
            console.error('❌ Erro ao atualizar aprazamento:', xhr.responseText);
            alert('Erro de comunicação ao atualizar aprazamento.');
        }
    });
}

// Inicializar a API de debug quando a página carregar
$(document).ready(function() {
    console.log('🔍 Iniciando módulo de debug de aprazamento');
    
    // Adicionar handlers para botões de visualização de aprazamento
    $(document).on('click', '.btn-visualizar-aprazamento', function() {
        const aprazamento = $(this).data('aprazamento');
        const medicamento = $(this).data('medicamento');
        
        console.log(`🔍 Clicou em botão de aprazamento para: ${medicamento}`);
        console.log('Dados de aprazamento:', aprazamento);
        
        // Verificar formato
        const formatoValido = validarFormatoAprazamento(aprazamento);
        console.log(`Formato válido: ${formatoValido ? '✅ Sim' : '❌ Não'}`);
        
        if (!formatoValido) {
            console.log('Formato corrigido:', corrigirFormatoAprazamento(aprazamento));
        }
    });
    
    criarApiDebug();
    
    // Verificar se há prescrições que precisam de verificação
    setTimeout(function() {
        debugTabelaPrescricoes();
    }, 2000);
}); 