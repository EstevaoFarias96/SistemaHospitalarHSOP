/**
 * FIX DEFINITIVO para o Modal de Adicionar RN
 * Usa MutationObserver e interceptação de eventos no nível do DOM
 */

console.log('🔧 Modal RN Fix Ultimate carregado!');

// Estado global do modal
window.modalRNUltimateState = {
    isTransitioning: false,
    currentTab: 'dados-gerais',
    formData: {},
    eventsInitialized: false
};

// Função para interceptar eventos de submit no nível mais alto do DOM
function interceptarEventosSubmit() {
    // Evitar duplicação de event listeners
    if (window.modalRNUltimateState.eventsInitialized) {
        console.log('🔧 Event listeners já inicializados, pulando...');
        return;
    }
    
    console.log('🛡️ Interceptando eventos de submit...');
    
    // Interceptar no nível do documento com useCapture
    document.addEventListener('submit', function(event) {
        const form = event.target;
        const isRNForm = form.closest('#modalAdicionarRN') !== null;
        
        if (isRNForm) {
            console.log('🚫 Submit interceptado no modal RN - Form ID:', form.id);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Verificar se estamos em transição
            if (window.modalRNUltimateState.isTransitioning) {
                console.log('⚠️ Submit bloqueado - transição em andamento');
                return false;
            }
            
            // Verificar qual botão foi clicado
            const submitButton = document.activeElement;
            console.log('🔍 Botão ativo:', submitButton ? submitButton.textContent : 'nenhum');
            
            const isProximoButton = submitButton && (
                submitButton.textContent.includes('Próximo') || 
                submitButton.id === 'proximoRN' ||
                submitButton.classList.contains('proximo-btn') ||
                submitButton.type === 'submit'
            );
            
            if (isProximoButton) {
                console.log('📍 Botão Próximo detectado - iniciando transição');
                handleProximoClick();
            } else {
                console.log('⚠️ Submit de formulário não reconhecido, bloqueando');
            }
            
            return false;
        }
    }, true); // useCapture = true para interceptar antes
    
    // Interceptar clicks em botões específicos
    document.addEventListener('click', function(event) {
        const target = event.target;
        const isInModalRN = target.closest('#modalAdicionarRN') !== null;
        
        if (isInModalRN) {
            console.log('🎯 Click no modal RN:', target.textContent || target.tagName);
            
            const isProximoButton = target.textContent.includes('Próximo') || 
                                   target.id === 'proximoRN' ||
                                   target.classList.contains('proximo-btn') ||
                                   (target.type === 'submit' && target.closest('#dadosRNForm'));
            
            if (isProximoButton) {
                console.log('🎯 Click direto no botão Próximo interceptado');
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                handleProximoClick();
                return false;
            }
        }
    }, true);
    
    // Marcar como inicializados
    window.modalRNUltimateState.eventsInitialized = true;
    console.log('✅ Event listeners configurados com sucesso!');
}

// Função para lidar com o click no botão Próximo
function handleProximoClick() {
    console.log('=== PROCESSAMENTO BOTÃO PRÓXIMO ===');
    
    // Se já está em transição, ignorar
    if (window.modalRNUltimateState.isTransitioning) {
        console.log('⚠️ Transição já em andamento, ignorando click...');
        return false;
    }
    
    // Marcar que estamos em transição
    window.modalRNUltimateState.isTransitioning = true;
    console.log('🔒 Estado de transição ativado');
    
    // Validar dados da primeira aba
    if (!validarDadosGeraisRN()) {
        console.log('❌ Validação falhou, cancelando transição');
        window.modalRNUltimateState.isTransitioning = false;
        return false;
    }
    
    // Salvar dados da primeira aba
    salvarDadosRN();
    
    // Fazer a transição para a segunda aba com delay adequado
    setTimeout(() => {
        console.log('🔄 Executando transição...');
        transicionarParaInternacao();
        
        // Resetar estado após um delay para garantir que a transição seja concluída
        setTimeout(() => {
            window.modalRNUltimateState.isTransitioning = false;
            console.log('🔓 Estado de transição desativado');
        }, 500);
    }, 200);
    
    return true;
}

// Função para validar dados da primeira aba
function validarDadosGeraisRN() {
    console.log('🔍 Validando dados gerais do RN...');
    
    const nomeRN = $('#nomeRN').val().trim();
    const sexoRN = $('#sexoRN').val();
    const dataNascimentoRN = $('#dataNascimentoRN').val();
    const corRN = $('#corRN').val();
    
    // Validar apenas campos obrigatórios (que têm required no HTML)
    if (!nomeRN) {
        alert('Por favor, informe o nome do RN.');
        $('#nomeRN').focus();
        return false;
    }
    
    if (!sexoRN) {
        alert('Por favor, selecione o sexo do RN.');
        $('#sexoRN').focus();
        return false;
    }
    
    if (!dataNascimentoRN) {
        alert('Por favor, informe a data de nascimento do RN.');
        $('#dataNascimentoRN').focus();
        return false;
    }
    
    if (!corRN) {
        alert('Por favor, selecione a raça/cor do RN.');
        $('#corRN').focus();
        return false;
    }
    
    // Validar data de nascimento (não pode ser futura)
    if (dataNascimentoRN) {
        const dataHoje = new Date();
        const dataNasc = new Date(dataNascimentoRN);
        
        if (dataNasc > dataHoje) {
            alert('A data de nascimento não pode ser no futuro.');
            $('#dataNascimentoRN').focus();
            return false;
        }
        
        // Verificar se não é muito antiga (mais de 1 mês)
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        
        if (dataNasc < umMesAtras) {
            alert('Data muito antiga para um RN. Verifique a data informada.');
            $('#dataNascimentoRN').focus();
            return false;
        }
    }
    
    console.log('✅ Dados gerais válidos!');
    return true;
}

// Função para salvar dados do RN
function salvarDadosRN() {
    console.log('💾 Salvando dados do RN...');
    
    const dadosRN = {
        nome: $('#nomeRN').val().trim(),
        sexo: $('#sexoRN').val(),
        data_nascimento: $('#dataNascimentoRN').val(),
        hora_nascimento: $('#horaNascimentoRN').val(),
        cor: $('#corRN').val(),
        peso: $('#pesoRN').val(),
        altura: $('#alturaRN').val(),
        apgar: $('#apgarRN').val(),
        observacoes: $('#observacoesRN').val(),
        // Dados herdados da mãe
        filiacao: $('#filiacaoRN').val(),
        telefone: $('#telefoneRN').val(),
        endereco: $('#enderecoRN').val(),
        bairro: $('#bairroRN').val(),
        municipio: $('#municipioRN').val()
    };
    
    // Salvar no sessionStorage para persistência
    sessionStorage.setItem('dadosRN', JSON.stringify(dadosRN));
    window.modalRNUltimateState.formData = dadosRN;
    
    console.log('✅ Dados salvos:', dadosRN);
}

// Função para fazer a transição para a segunda aba
function transicionarParaInternacao() {
    console.log('🔄 Transicionando para aba de internação...');
    
    try {
        // Método 1: Usar Bootstrap 5 Tab API
        const tabElement = document.querySelector('#internacao-rn-tab');
        if (tabElement && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            console.log('🔄 Tentando método 1: Bootstrap Tab API');
            
            // Remover classe disabled primeiro
            tabElement.classList.remove('disabled');
            tabElement.removeAttribute('disabled');
            
            const tab = new bootstrap.Tab(tabElement);
            tab.show();
            console.log('✅ Transição realizada via Bootstrap Tab API');
            window.modalRNUltimateState.currentTab = 'internacao';
            return;
        }
        
        // Método 2: Simular click no tab
        const tabLink = document.querySelector('#internacao-rn-tab');
        if (tabLink) {
            console.log('🔄 Tentando método 2: Click simulation');
            
            // Remover classe disabled primeiro
            tabLink.classList.remove('disabled');
            tabLink.removeAttribute('disabled');
            
            tabLink.click();
            console.log('✅ Transição realizada via click simulation');
            window.modalRNUltimateState.currentTab = 'internacao';
            return;
        }
        
        // Método 3: Manipulação manual das classes
        console.log('🔄 Tentando método 3: Manipulação manual');
        const dadosTab = document.querySelector('#dados-rn');
        const internacaoTab = document.querySelector('#internacao-rn');
        const dadosTabLink = document.querySelector('#dados-rn-tab');
        const internacaoTabLink = document.querySelector('#internacao-rn-tab');
        
        console.log('🔍 Elementos encontrados:', {
            dadosTab: !!dadosTab,
            internacaoTab: !!internacaoTab,
            dadosTabLink: !!dadosTabLink,
            internacaoTabLink: !!internacaoTabLink
        });
        
        if (dadosTab && internacaoTab && dadosTabLink && internacaoTabLink) {
            // Remover classe disabled da aba de internação
            internacaoTabLink.classList.remove('disabled');
            internacaoTabLink.removeAttribute('disabled');
            
            // Desativar primeira aba
            dadosTab.classList.remove('show', 'active');
            dadosTabLink.classList.remove('active');
            dadosTabLink.setAttribute('aria-selected', 'false');
            
            // Ativar segunda aba
            internacaoTab.classList.add('show', 'active');
            internacaoTabLink.classList.add('active');
            internacaoTabLink.setAttribute('aria-selected', 'true');
            
            console.log('✅ Transição realizada via manipulação manual');
            window.modalRNUltimateState.currentTab = 'internacao';
            return;
        }
        
        console.error('❌ Falha em todos os métodos de transição - elementos não encontrados');
        
    } catch (error) {
        console.error('❌ Erro na transição:', error);
    }
    
    // Se chegou aqui, algo deu errado
    console.error('❌ Transição falhou - resetando estado');
    window.modalRNUltimateState.isTransitioning = false;
    alert('Erro na transição entre abas. Os dados foram salvos. Tente fechar e abrir o modal novamente.');
}

// Função para processar dados da internação (segunda aba)
function processarInternacaoRN() {
    console.log('=== PROCESSAMENTO INTERNAÇÃO RN ===');
    
    // Verificar se um leito foi selecionado
    const leitoSelecionado = $('#leitoRN').val();
    if (!leitoSelecionado) {
        alert('Por favor, selecione um leito para o RN.');
        return false;
    }
    
    // Verificar se a primeira evolução foi preenchida
    const primeiraEvolucao = $('#primeiraEvolucaoRN').val().trim();
    if (!primeiraEvolucao) {
        alert('Por favor, preencha a Primeira Evolução do RN.');
        $('#primeiraEvolucaoRN').focus();
        return false;
    }
    
    // Recuperar dados da primeira aba
    const dadosRN = JSON.parse(sessionStorage.getItem('dadosRN') || '{}');
    
    // Coletar dados da internação
    const dadosInternacao = {
        leito_id: leitoSelecionado,
        carater_internacao: $('#caraterInternacaoRN').val(),
        hda: $('#hdaRN').val(),
        diagnostico_inicial: $('#diagnosticoInicialRN').val(),
        anamnese_exame_fisico: $('#anamneseExameFisicoRN').val(),
        conduta_inicial: $('#condutaInicialRN').val(),
        primeira_evolucao: $('#primeiraEvolucaoRN').val(),
        cid_principal: $('#cidPrincipalRN').val(),
        cid_10_secundario: $('#cid10SecundarioRN').val(),
        cid_10_causas_associadas: $('#cid10CausasAssociadasRN').val(),
        exames_realizados: $('#examesRealizadosRN').val()
    };
    
    // Combinar dados das duas abas
    const dadosCompletos = Object.assign({}, dadosRN, dadosInternacao);
    
    console.log('📋 Dados completos do RN:', dadosCompletos);
    
    // Enviar dados via AJAX
    enviarDadosRN(dadosCompletos);
}

// Função para enviar dados do RN
function enviarDadosRN(dados) {
    console.log('📤 Enviando dados do RN...');
    const responsavelId = $('#paciente_id').val();

    // Mapear campos para o payload esperado pelo backend /api/rn-internacao
    const payload = {
        // RN
        nome: dados.nome || '',
        data_nascimento: dados.data_nascimento || '',
        sexo: dados.sexo || '',
        peso_ao_nascer: dados.peso || '',
        altura: dados.altura || '',
        apgar: dados.apgar || '',
        responsavel_id: responsavelId,
        // Contatos/endereços (herdados da mãe já estão no formulário, mas backend também replica se ausentes)
        telefone: dados.telefone || $('#telefoneRN').val() || '',
        endereco: dados.endereco || $('#enderecoRN').val() || '',
        municipio: dados.municipio || $('#municipioRN').val() || '',
        bairro: dados.bairro || $('#bairroRN').val() || '',
        filiacao: dados.filiacao || $('#filiacaoRN').val() || '',
        cor: dados.cor || $('#corRN').val() || 'Não informada',
        // Internação
        hda: dados.hda || $('#hdaRN').val() || '',
        diagnostico_inicial: dados.diagnostico_inicial || $('#diagnosticoInicialRN').val() || '',
        exame_fisico: dados.anamnese_exame_fisico || $('#anamneseExameFisicoRN').val() || '',
        cid_principal: dados.cid_principal || $('#cidPrincipalRN').val() || '',
        cid_secundario: dados.cid_10_secundario || $('#cid10SecundarioRN').val() || '',
        leito: dados.leito_id || $('#leitoRN').val() || 'Berçário',
        conduta: dados.conduta_inicial || $('#condutaInicialRN').val() || 'Internação em berçário - Acompanhamento médico',
        primeira_evolucao: dados.primeira_evolucao || $('#primeiraEvolucaoRN').val() || '',
        parametros: dados.parametros || ''
    };

    fetch('/api/rn-internacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
            const msg = data && data.message ? data.message : `Erro ${res.status}`;
            throw new Error(msg);
        }
        return data;
    })
    .then((data) => {
        alert('RN adicionado à internação com sucesso!');
        sessionStorage.removeItem('dadosRN');
        $('#modalAdicionarRN').modal('hide');
        // Recarregar para refletir novo atendimento/internação
        setTimeout(() => window.location.reload(), 600);
    })
    .catch((err) => {
        console.error('❌ Erro ao adicionar RN:', err);
        alert('Erro ao adicionar RN: ' + err.message);
    });
}

// Observer para mudanças no DOM
function setupMutationObserver() {
    console.log('👀 Configurando MutationObserver...');
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Verificar se o modal foi adicionado
                        if (node.id === 'modalAdicionarRN' || node.querySelector('#modalAdicionarRN')) {
                            console.log('🔍 Modal RN detectado no DOM');
                            setTimeout(setupModalEvents, 100);
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Configurar eventos do modal
function setupModalEvents() {
    console.log('⚙️ Configurando eventos do modal...');
    
    // Interceptar eventos de submit/click
    interceptarEventosSubmit();
    
    // Event listener para impedir fechamento durante transição
    $('#modalAdicionarRN').off('hide.bs.modal').on('hide.bs.modal', function(e) {
        console.log('🚨 Tentativa de fechamento do modal detectada');
        console.log('🔍 Estado de transição:', window.modalRNUltimateState.isTransitioning);
        console.log('🔍 Elemento que causou o evento:', e.relatedTarget);
        
        if (window.modalRNUltimateState.isTransitioning) {
            console.log('🛡️ Bloqueando fechamento do modal durante transição');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
        
        // Verificar se é um fechamento não intencional
        const activeElement = document.activeElement;
        const isCloseButton = activeElement && (
            activeElement.classList.contains('btn-close') || 
            activeElement.getAttribute('data-bs-dismiss') === 'modal' ||
            activeElement.classList.contains('btn-secondary')
        );
        
        if (!isCloseButton && activeElement && activeElement.closest('#modalAdicionarRN')) {
            console.log('🛡️ Possível fechamento não intencional detectado, verificando...');
            console.log('🔍 Elemento ativo:', activeElement.tagName, activeElement.className, activeElement.textContent);
            
            // Se não é um botão de fechar explícito, bloquear
            if (!activeElement.textContent.includes('Cancelar') && !activeElement.textContent.includes('Fechar')) {
                console.log('🛡️ Bloqueando fechamento não intencional do modal');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }
        
        console.log('✅ Permitindo fechamento do modal');
    });
    
    // Event listener para quando o modal é mostrado
    $('#modalAdicionarRN').on('shown.bs.modal', function() {
        console.log('📱 Modal RN mostrado');
        window.modalRNUltimateState.currentTab = 'dados-gerais';
        window.modalRNUltimateState.isTransitioning = false;
        
        // Garantir que a primeira aba esteja ativa
        const dadosTab = document.querySelector('#dados-rn-tab');
        const internacaoTab = document.querySelector('#internacao-rn-tab');
        
        if (dadosTab && internacaoTab) {
            dadosTab.classList.add('active');
            dadosTab.setAttribute('aria-selected', 'true');
            
            internacaoTab.classList.remove('active');
            internacaoTab.setAttribute('aria-selected', 'false');
            internacaoTab.classList.add('disabled');
            internacaoTab.setAttribute('disabled', 'true');
        }
        
        // Focar no primeiro campo
        setTimeout(() => {
            $('#nomeRN').focus();
        }, 100);
    });
    
    // Event listener para quando o modal é escondido
    $('#modalAdicionarRN').on('hidden.bs.modal', function() {
        console.log('📱 Modal RN escondido');
        
        // Limpar estado
        window.modalRNUltimateState.currentTab = 'dados-gerais';
        window.modalRNUltimateState.isTransitioning = false;
        
        // Limpar sessionStorage
        sessionStorage.removeItem('dadosRN');
        
        // Resetar formulários
        $('#dadosRNForm')[0].reset();
        $('#internacaoRNForm')[0].reset();
        
        // Remover classes de validação
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').remove();
        
        // Resetar abas
        setTimeout(() => {
            const dadosTab = document.querySelector('#dados-rn');
            const internacaoTab = document.querySelector('#internacao-rn');
            const dadosTabLink = document.querySelector('#dados-rn-tab');
            const internacaoTabLink = document.querySelector('#internacao-rn-tab');
            
            if (dadosTab && internacaoTab && dadosTabLink && internacaoTabLink) {
                // Ativar primeira aba
                dadosTab.classList.add('show', 'active');
                dadosTabLink.classList.add('active');
                dadosTabLink.setAttribute('aria-selected', 'true');
                
                // Desativar segunda aba
                internacaoTab.classList.remove('show', 'active');
                internacaoTabLink.classList.remove('active');
                internacaoTabLink.setAttribute('aria-selected', 'false');
                internacaoTabLink.classList.add('disabled');
                internacaoTabLink.setAttribute('disabled', 'true');
            }
        }, 100);
    });
    
    // Event listener para botão de finalizar na segunda aba
    $(document).on('click', '#finalizarRN', function(e) {
        e.preventDefault();
        e.stopPropagation();
        processarInternacaoRN();
    });
}

// Inicialização quando o DOM estiver pronto
$(document).ready(function() {
    console.log('🚀 Inicializando Modal RN Fix Ultimate...');
    console.log('🔍 Verificando elementos do DOM...');
    
    // Verificar se Bootstrap está disponível
    if (typeof bootstrap === 'undefined') {
        console.warn('⚠️ Bootstrap não encontrado, usando métodos alternativos');
    } else {
        console.log('✅ Bootstrap disponível');
    }
    
    // Verificar se jQuery está disponível
    if (typeof $ === 'undefined') {
        console.error('❌ jQuery não encontrado!');
        return;
    } else {
        console.log('✅ jQuery disponível');
    }
    
    // Configurar observer
    setupMutationObserver();
    
    // Se o modal já existir, configurar eventos
    if ($('#modalAdicionarRN').length > 0) {
        console.log('✅ Modal RN encontrado no DOM');
        setupModalEvents();
    } else {
        console.log('⏳ Modal RN não encontrado, aguardando...');
    }
    
    // Interceptar eventos globalmente
    interceptarEventosSubmit();
    
    console.log('✅ Modal RN Fix Ultimate inicializado!');
    
    // Debug: listar elementos relevantes
    setTimeout(() => {
        console.log('🔍 Debug: Elementos encontrados:');
        console.log('- Modal:', $('#modalAdicionarRN').length > 0 ? '✅' : '❌');
        console.log('- Aba dados:', $('#dados-rn-tab').length > 0 ? '✅' : '❌');
        console.log('- Aba internação:', $('#internacao-rn-tab').length > 0 ? '✅' : '❌');
        console.log('- Form dados:', $('#dadosRNForm').length > 0 ? '✅' : '❌');
        console.log('- Form internação:', $('#internacaoRNForm').length > 0 ? '✅' : '❌');
        console.log('- Botão próximo:', $('button:contains("Próximo")').length);
    }, 1000);
});

// Exportar funções para debug
window.modalRNDebug = {
    state: () => window.modalRNUltimateState,
    transicionar: transicionarParaInternacao,
    validar: validarDadosGeraisRN,
    salvar: salvarDadosRN,
    processar: processarInternacaoRN
};
