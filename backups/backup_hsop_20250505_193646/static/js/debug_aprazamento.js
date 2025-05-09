// Arquivo: debug_aprazamento.js
// Responsável por funções de depuração para o aprazamento (usado apenas em ambiente de desenvolvimento)

// Indicar que o módulo foi carregado
console.log('✅ Debug de Aprazamento carregado');

// Função para debugar o ID de internação
function diagnosticarId() {
    console.log('🔍 Diagnóstico de ID de internação:');
    
    // Verificar valor bruto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    console.log('Valor raw de internacao.id:', rawId);
    
    // Verificar valor parseado
    const parsedId = parseInt(rawId, 10);
    console.log('Valor de internacaoId após parse:', parsedId, typeof parsedId);
    
    // Verificar valor global
    console.log('Valor de window.internacaoId:', window.internacaoId, typeof window.internacaoId);
    
    // Verificar se é válido
    const isValid = !isNaN(parsedId) && parsedId > 0;
    console.log('internacaoId válido:', isValid ? parsedId : 'INVÁLIDO');
    
    return isValid ? parsedId : null;
}

// Função para definir manualmente o ID de internação
function definirId(novoId) {
    if (!novoId || isNaN(parseInt(novoId, 10))) {
        console.error('⚠️ ID inválido, não foi possível definir');
        return false;
    }
    
    const idAnterior = window.internacaoId;
    window.internacaoId = parseInt(novoId, 10);
    
    console.log(`✅ ID alterado de ${idAnterior} para ${window.internacaoId}`);
    
    // Recarregar dados com o novo ID
    if (typeof carregarPrescricoes === 'function') {
        console.log('🔄 Recarregando prescrições...');
        carregarPrescricoes(window.internacaoId);
    }
    
    if (typeof carregarEvolucoes === 'function') {
        console.log('🔄 Recarregando evoluções...');
        carregarEvolucoes();
    }
    
    if (typeof carregarEvolucoesEnfermagem === 'function') {
        console.log('🔄 Recarregando evoluções de enfermagem...');
        carregarEvolucoesEnfermagem();
    }
    
    return true;
}

// Função para listar todos os dados importantes
function listarDados() {
    console.log('📊 Dados do sistema:');
    
    // ID de internação
    console.log('ID de internação:', window.internacaoId);
    
    // Sessão de usuário
    if (window.session) {
        console.log('Sessão:', {
            user_id: window.session.user_id,
            nome: window.session.nome,
            cargo: window.session.cargo
        });
    } else {
        console.log('Sessão: Não definida');
    }
    
    // Prescrições
    if (typeof window.prescricoesAtivas !== 'undefined') {
        console.log('Total de prescrições:', window.prescricoesAtivas.length);
    }
    
    // Estado do editor Quill
    if (window.quill) {
        console.log('Editor Quill inicializado:', true);
        console.log('Conteúdo do editor:', window.quill.getText().substring(0, 50) + '...');
    } else {
        console.log('Editor Quill inicializado:', false);
    }
    
    // Mostrar elementos de página
    console.log('Elementos importantes:', {
        'editor-container': !!document.getElementById('editor-container'),
        'listaPrescricoes': !!document.getElementById('listaPrescricoes'),
        'listaEvolucoes': !!document.getElementById('listaEvolucoes'),
        'listaSAE': !!document.getElementById('listaSAE')
    });
}

// Função para debugar tabela de prescrições
function debugTabelaPrescricoes() {
    console.log('🔍 Debugando tabela de prescrições');
    
    // Verificar todas as tabelas
    const tabelas = document.querySelectorAll('table');
    console.log('Total de tabelas:', tabelas.length);
    
    // Verificar botões de aprazamento
    const botoesAprazamento = document.querySelectorAll('.btn-aprazar');
    console.log('Células com botão de aprazamento:', botoesAprazamento.length);
    
    if (botoesAprazamento.length === 0) {
        // Verificar se existem botões sem a classe correta
        const botoesAlternativos = document.querySelectorAll('button[onclick*="abrirModalAprazamento"]');
        console.log('Botões com onclick de aprazamento:', botoesAlternativos.length);
        
        // Verificar condição da sessão
        if (window.session) {
            console.log('Cargo do usuário:', window.session.cargo);
            console.log('Condição de exibição:', window.session.cargo === 'Enfermeiro');
        } else {
            console.log('⚠️ Sessão não definida - botões de aprazamento não serão exibidos');
        }
    }
    
    // Verificar células de aprazamento
    const celulasAprazamento = document.querySelectorAll('.aprazamento-cell');
    console.log('Células de aprazamento:', celulasAprazamento.length);
    
    if (celulasAprazamento.length > 0) {
        // Analisar conteúdo das células
        let vazias = 0;
        let preenchidas = 0;
        
        celulasAprazamento.forEach(celula => {
            const texto = celula.textContent.trim();
            if (texto === 'Não aprazado' || texto === '') {
                vazias++;
            } else {
                preenchidas++;
            }
        });
        
        console.log('Células vazias/não aprazadas:', vazias);
        console.log('Células com aprazamento:', preenchidas);
    }
}

// Função para simular um aprazamento
function simularAprazamento(prescricaoId, medicamentoIndex, texto) {
    if (!prescricaoId || !medicamentoIndex) {
        console.error('⚠️ ID de prescrição ou índice de medicamento inválido');
        return false;
    }
    
    const aprazamentoTexto = texto || `${new Date().toLocaleDateString('pt-BR')}: 08:00, 12:00, 16:00, 20:00;`;
    
    console.log(`🔄 Simulando aprazamento para prescricaoId=${prescricaoId}, medicamentoIndex=${medicamentoIndex}`);
    console.log('Texto de aprazamento:', aprazamentoTexto);
    
    // Criar dados para simular requisição
    const dados = {
        prescricao_id: prescricaoId,
        medicamento_index: medicamentoIndex,
        enfermeiro_id: window.session?.user_id || 1,
        aprazamento: aprazamentoTexto
    };
    
    // Mostrar na console o que seria enviado
    console.log('Dados para API:', dados);
    
    // Perguntar se deve enviar realmente
    const confirmar = confirm('Deseja realmente enviar este aprazamento para a API?');
    
    if (confirmar) {
        $.ajax({
            url: '/api/prescricoes/aprazamento',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function(response) {
                console.log('✅ Aprazamento registrado com sucesso:', response);
                alert('Aprazamento registrado com sucesso!');
                
                // Recarregar lista de prescrições
                if (typeof carregarPrescricoes === 'function') {
                    carregarPrescricoes(window.internacaoId);
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ Erro ao registrar aprazamento:', xhr.responseText);
                alert('Erro ao registrar aprazamento: ' + error);
            }
        });
    } else {
        console.log('❌ Envio de aprazamento cancelado pelo usuário');
    }
    
    return true;
}

// Adicionar API de debug ao objeto window
console.log('🔧 Adicionando API de debug ao window...');

window.debugAprazamento = {
    diagnosticarId: diagnosticarId,
    definirId: definirId,
    listarDados: listarDados,
    debugTabelaPrescricoes: debugTabelaPrescricoes,
    simularAprazamento: simularAprazamento
};

console.log('✅ API de debug disponível via "window.debugAprazamento"');
console.log('👉 Exemplo de uso: window.debugAprazamento.diagnosticarId() ou window.debugAprazamento.definirId(123)');

// Iniciar diagnóstico automático
$(document).ready(function() {
    console.log('🔍 Iniciando módulo de debug de aprazamento');
    
    // Aguardar um momento para que todas as variáveis estejam carregadas
    setTimeout(() => {
        // Executar diagnóstico de ID
        diagnosticarId();
        
        // Verificar tabela de prescrições depois que o DOM estiver completamente carregado
        setTimeout(() => {
            debugTabelaPrescricoes();
        }, 2000);
    }, 1000);
}); 