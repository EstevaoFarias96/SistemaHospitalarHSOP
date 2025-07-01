// Substituir EventTarget.prototype.addEventListener para monitorar eventos depreciados
const originalAddEventListener = EventTarget.prototype.addEventListener;

/**
 * SISTEMA DE CONVERSÃO FORÇADA PARA HORÁRIO BRASILEIRO (UTC-3)
 * Essas funções garantem que TODOS os horários sejam exibidos no horário de Brasília
 */

// Função que força conversão UTC-3 (horário de Brasília) - VERSÃO PARA PRODUÇÃO
function forcarHorarioBrasileiro(dateTimeString) {
    if (!dateTimeString) return '-';
    
    try {
        // Criar objeto Date da string recebida (assumindo que vem como UTC)
        let data;
        
        // Se a string não tem 'Z' no final, adiciona para indicar UTC
        if (!dateTimeString.includes('Z') && !dateTimeString.includes('+') && !dateTimeString.includes('-')) {
            data = new Date(dateTimeString + 'Z');
        } else {
            data = new Date(dateTimeString);
        }
        
        // Forçar subtração de 3 horas (UTC-3 = horário de Brasília)
        data.setHours(data.getHours() - 3);
        
        // Formatação brasileira
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        const hora = data.getHours().toString().padStart(2, '0');
        const minuto = data.getMinutes().toString().padStart(2, '0');
        
        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    } catch (error) {
        console.warn('Erro ao converter horário:', dateTimeString, error);
        return dateTimeString; // Retorna original se der erro
    }
}

// Função que força conversão UTC-3 apenas para a data
function forcarDataBrasileira(dateString) {
    if (!dateString) return '-';
    
    try {
        let data;
        if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-')) {
            data = new Date(dateString + 'Z');
        } else {
            data = new Date(dateString);
        }
        
        data.setHours(data.getHours() - 3);
        
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        
        return `${dia}/${mes}/${ano}`;
    } catch (error) {
        console.warn('Erro ao converter data:', dateString, error);
        return dateString;
    }
}

// Função que força conversão UTC-3 apenas para o horário
function forcarHoraBrasileira(dateTimeString) {
    if (!dateTimeString) return '-';
    
    try {
        let data;
        if (!dateTimeString.includes('Z') && !dateTimeString.includes('+') && !dateTimeString.includes('-')) {
            data = new Date(dateTimeString + 'Z');
        } else {
            data = new Date(dateTimeString);
        }
        
        data.setHours(data.getHours() - 3);
        
        const hora = data.getHours().toString().padStart(2, '0');
        const minuto = data.getMinutes().toString().padStart(2, '0');
        
        return `${hora}:${minuto}`;
    } catch (error) {
        console.warn('Erro ao converter hora:', dateTimeString, error);
        return dateTimeString;
    }
}

// Função para aplicar conversão automática em qualquer texto que contenha horários
function aplicarConversaoAutomatica(texto) {
    if (!texto) return texto;
    
    // Regex para capturar formatos de data/hora comuns
    const regexDateTime = /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/g;
    const regexDate = /(\d{4}-\d{2}-\d{2})/g;
    
    // Substituir horários completos
    texto = texto.replace(regexDateTime, (match) => {
        return forcarHorarioBrasileiro(match);
    });
    
    // Substituir datas
    texto = texto.replace(regexDate, (match) => {
        return forcarDataBrasileira(match);
    });
    
    return texto;
}

EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'DOMNodeInserted') {
        console.warn('Evento depreciado DOMNodeInserted detectado - usando MutationObserver em seu lugar');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        listener.call(this, { target: node });
                    });
                }
            });
        });
        
        observer.observe(this, {
            childList: true,
            subtree: true
        });
        
        // Armazenar o observer para limpeza posterior se necessário
        if (!this._mutationObservers) {
            this._mutationObservers = [];
        }
        this._mutationObservers.push(observer);
        
        return;
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Função para limpar observadores
function limparObservadores(elemento) {
    if (elemento._mutationObservers) {
        elemento._mutationObservers.forEach(observer => observer.disconnect());
        elemento._mutationObservers = [];
    }
    
    if (elemento._scrollObservers) {
        if (elemento._scrollObservers.resize) {
            elemento._scrollObservers.resize.disconnect();
        }
        if (elemento._scrollObservers.mutation) {
            elemento._scrollObservers.mutation.disconnect();
        }
        delete elemento._scrollObservers;
    }
}

// Função para configurar observadores modernos
function configurarObservadoresModernos(elemento) {
    // Limpar observadores existentes primeiro
    limparObservadores(elemento);
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                // Atualizar scroll se necessário
                const shouldScrollToBottom = elemento.scrollHeight - elemento.scrollTop <= elemento.clientHeight + 50;
                if (shouldScrollToBottom) {
                    elemento.scrollTop = elemento.scrollHeight;
                }
            }
        });
    });
    
    observer.observe(elemento, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    if (!elemento._mutationObservers) {
        elemento._mutationObservers = [];
    }
    elemento._mutationObservers.push(observer);
}

// Função para inicializar todos os observadores necessários
function inicializarObservadores() {
    const editores = document.querySelectorAll('.ql-editor');
    editores.forEach(editor => {
        configurarObservadoresModernos(editor);
    });
}

// Executar quando o Quill for inicializado

// Função para montar HTML das informações de internamento (visualização ou edição)
function renderizarInternamentoInfo(data, modoEdicao = false) {
    if (!modoEdicao) {
        return `
        <div class="informacoes-internamento-container">
            <!-- Seção: Informações Básicas -->
            <div class="info-section mb-4">
                <div class="section-header">
                    <i class="fas fa-info-circle text-primary me-2"></i>
                    <h6 class="section-title mb-0">Informações Básicas do Internamento</h6>
                </div>
                <div class="section-content">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="info-card">
                                <div class="info-label">Leito</div>
                                <div class="info-value" data-campo="leito">${data.leito || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-card">
                                <div class="info-label">Data de Internação</div>
                                <div class="info-value" data-campo="data_internacao">${data.data_internacao ? new Date(data.data_internacao).toLocaleString('pt-BR') : '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-card">
                                <div class="info-label">Caráter da Internação</div>
                                <div class="info-value" data-campo="carater_internacao">${data.carater_internacao || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-card">
                                <div class="info-label">Acidente de Trabalho</div>
                                <div class="info-value" data-campo="acidente_de_trabalho">
                                    ${data.acidente_de_trabalho ? 
                                        '<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i>Sim</span>' : 
                                        '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Não</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Seção: Diagnóstico e CID -->
            <div class="info-section mb-4">
                <div class="section-header">
                    <i class="fas fa-stethoscope text-success me-2"></i>
                    <h6 class="section-title mb-0">Diagnóstico e Classificação</h6>
                </div>
                <div class="section-content">
                    <div class="row g-3">
                        <div class="col-md-12">
                            <div class="info-card">
                                <div class="info-label">Diagnóstico Inicial</div>
                                <div class="info-value" data-campo="diagnostico_inicial">${data.diagnostico_inicial || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="info-card">
                                <div class="info-label">Diagnóstico Atual</div>
                                <div class="info-value" data-campo="diagnostico">${data.diagnostico || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-card">
                                <div class="info-label">CID Principal</div>
                                <div class="info-value" data-campo="cid_principal">${data.cid_principal || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-card">
                                <div class="info-label">CID Secundário</div>
                                <div class="info-value" data-campo="cid_10_secundario">${data.cid_10_secundario || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-card">
                                <div class="info-label">CID Causas Associadas</div>
                                <div class="info-value" data-campo="cid_10_causas_associadas">${data.cid_10_causas_associadas || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Seção: Anamnese e Conduta -->
            <div class="info-section mb-4">
                <div class="section-header">
                    <i class="fas fa-notes-medical text-info me-2"></i>
                    <h6 class="section-title mb-0">Anamnese e Conduta Médica</h6>
                </div>
                <div class="section-content">
                    <div class="row g-3">
                        <div class="col-md-12">
                            <div class="info-card expandable">
                                <div class="info-label">Anamnese e Exame Físico</div>
                                <div class="info-value expandable-content" data-campo="anamnese_exame_fisico">
                                    ${data.anamnese_exame_fisico ? 
                                        `<div class="clinical-text">${data.anamnese_exame_fisico.replace(/\n/g, '<br>')}</div>` : 
                                        '<span class="text-muted">Não registrado</span>'}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="info-card expandable">
                                <div class="info-label">Conduta Médica</div>
                                <div class="info-value expandable-content" data-campo="conduta">
                                    ${data.conduta ? 
                                        `<div class="clinical-text">${data.conduta.replace(/\n/g, '<br>')}</div>` : 
                                        '<span class="text-muted">Não registrado</span>'}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="info-card expandable">
                                <div class="info-label">Antibióticos Prescritos</div>
                                <div class="info-value expandable-content" data-campo="antibiotico">
                                    ${data.antibiotico ? 
                                        `<div class="clinical-text medication-info">${data.antibiotico.replace(/\n/g, '<br>')}</div>` : 
                                        '<span class="text-muted">Nenhum antibiótico prescrito</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Seção: Justificativas da Internação -->
            <div class="info-section mb-4">
                <div class="section-header">
                    <i class="fas fa-clipboard-list text-warning me-2"></i>
                    <h6 class="section-title mb-0">Justificativas da Internação</h6>
                </div>
                <div class="section-content">
                    <div class="row g-3">
                        <div class="col-md-12">
                            <div class="info-card expandable">
                                <div class="info-label">Sinais e Sintomas</div>
                                <div class="info-value expandable-content" data-campo="justificativa_internacao_sinais_e_sintomas">
                                    ${data.justificativa_internacao_sinais_e_sintomas ? 
                                        `<div class="clinical-text">${data.justificativa_internacao_sinais_e_sintomas.replace(/\n/g, '<br>')}</div>` : 
                                        '<span class="text-muted">Não informado</span>'}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="info-card expandable">
                                <div class="info-label">Condições Justificativas</div>
                                <div class="info-value expandable-content" data-campo="justificativa_internacao_condicoes">
                                    ${data.justificativa_internacao_condicoes ? 
                                        `<div class="clinical-text">${data.justificativa_internacao_condicoes.replace(/\n/g, '<br>')}</div>` : 
                                        '<span class="text-muted">Não informado</span>'}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="info-card expandable">
                                <div class="info-label">Principais Resultados de Diagnóstico</div>
                                <div class="info-value expandable-content" data-campo="justificativa_internacao_principais_resultados_diagnostico">
                                    ${data.justificativa_internacao_principais_resultados_diagnostico ? 
                                        `<div class="clinical-text">${data.justificativa_internacao_principais_resultados_diagnostico.replace(/\n/g, '<br>')}</div>` : 
                                        '<span class="text-muted">Não informado</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Seção: Procedimentos -->
            <div class="info-section mb-4">
                <div class="section-header">
                    <i class="fas fa-procedures text-danger me-2"></i>
                    <h6 class="section-title mb-0">Procedimentos e Códigos</h6>
                </div>
                <div class="section-content">
                    <div class="row g-3">
                        <div class="col-md-8">
                            <div class="info-card">
                                <div class="info-label">Descrição do Procedimento Solicitado</div>
                                <div class="info-value" data-campo="descr_procedimento_solicitado">${data.descr_procedimento_solicitado || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-card">
                                <div class="info-label">Código do Procedimento</div>
                                <div class="info-value" data-campo="codigo_procedimento">${data.codigo_procedimento || '<span class="text-muted">Não informado</span>'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
        .informacoes-internamento-container {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1.5rem;
        }

        .info-section {
            background: white;
            border-radius: 10px;
            border: 1px solid #e9ecef;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
        }

        .info-section:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .section-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 1rem 1.25rem;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            align-items: center;
        }

        .section-title {
            font-weight: 600;
            color: #495057;
            font-size: 1rem;
        }

        .section-content {
            padding: 1.25rem;
        }

        .info-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.3s ease;
            height: 100%;
        }

        .info-card:hover {
            background: #e9ecef;
            border-color: #007bff;
            transform: translateY(-1px);
        }

        .info-card.expandable {
            cursor: pointer;
        }

        .info-card.expandable:hover {
            background: #e3f2fd;
        }

        .info-label {
            font-weight: 600;
            color: #6c757d;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            color: #495057;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .clinical-text {
            background: white;
            padding: 0.75rem;
            border-radius: 6px;
            border-left: 4px solid #007bff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .medication-info {
            border-left-color: #28a745;
            background: #f8fff9;
        }

        .expandable-content {
            max-height: 120px;
            overflow: hidden;
            transition: max-height 0.3s ease;
            position: relative;
        }

        .info-card.expandable.expanded .expandable-content {
            max-height: none;
            overflow: visible;
        }

        .expandable-content::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: linear-gradient(transparent, #f8f9fa);
            pointer-events: none;
        }

        .info-card.expandable.expanded .expandable-content::after {
            display: none;
        }

        .badge {
            font-size: 0.8rem;
            padding: 0.5rem 0.75rem;
        }

        @media (max-width: 768px) {
            .informacoes-internamento-container {
                padding: 1rem;
            }
            
            .section-content {
                padding: 1rem;
            }
            
            .info-card {
                padding: 0.75rem;
            }
        }
        </style>

        <script>
        // Adicionar funcionalidade de expansão para cards expandáveis
        document.addEventListener('click', function(e) {
            const expandableCard = e.target.closest('.info-card.expandable');
            if (expandableCard) {
                expandableCard.classList.toggle('expanded');
                
                const content = expandableCard.querySelector('.expandable-content');
                if (expandableCard.classList.contains('expanded')) {
                    expandableCard.style.cursor = 'pointer';
                } else {
                    expandableCard.style.cursor = 'pointer';
                }
            }
        });
        </script>
        `;
    } else {
        // Renderizar campos editáveis com design melhorado
        return `
        <div class="edicao-internamento-container">
            <form id="formEditarInternamentoInfo">
                <!-- Seção: Informações Básicas -->
                <div class="edit-section mb-4">
                    <div class="section-header">
                        <i class="fas fa-info-circle text-primary me-2"></i>
                        <h6 class="section-title mb-0">Informações Básicas do Internamento</h6>
                    </div>
                    <div class="section-content">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control" value="${data.leito || ''}" placeholder="Leito" readonly disabled>
                                    <label>Leito (não editável)</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control" 
                                           value="${data.data_internacao ? new Date(data.data_internacao).toLocaleString('pt-BR') : 'Não informado'}" 
                                           placeholder="Data de Internação" readonly disabled>
                                    <label>Data de Internação (não editável)</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <select class="form-select" name="carater_internacao" id="edit_carater_internacao">
                                        <option value="">Selecione...</option>
                                        <option value="eletiva" ${data.carater_internacao === 'eletiva' ? 'selected' : ''}>Eletiva</option>
                                        <option value="urgencia" ${data.carater_internacao === 'urgencia' ? 'selected' : ''}>Urgência</option>
                                        <option value="emergencia" ${data.carater_internacao === 'emergencia' ? 'selected' : ''}>Emergência</option>
                                    </select>
                                    <label for="edit_carater_internacao">Caráter da Internação</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <select class="form-select" name="acidente_de_trabalho" id="edit_acidente_trabalho">
                                        <option value="false" ${!data.acidente_de_trabalho ? 'selected' : ''}>Não</option>
                                        <option value="true" ${data.acidente_de_trabalho ? 'selected' : ''}>Sim</option>
                                    </select>
                                    <label for="edit_acidente_trabalho">Acidente de Trabalho</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção: Diagnóstico e CID -->
                <div class="edit-section mb-4">
                    <div class="section-header">
                        <i class="fas fa-stethoscope text-success me-2"></i>
                        <h6 class="section-title mb-0">Diagnóstico e Classificação</h6>
                    </div>
                    <div class="section-content">
                        <div class="row g-3">
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control" name="diagnostico_inicial" id="edit_diagnostico_inicial" 
                                              style="height: 80px" placeholder="Diagnóstico Inicial">${data.diagnostico_inicial || ''}</textarea>
                                    <label for="edit_diagnostico_inicial">Diagnóstico Inicial</label>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control" name="diagnostico" id="edit_diagnostico" 
                                              style="height: 80px" placeholder="Diagnóstico Atual">${data.diagnostico || ''}</textarea>
                                    <label for="edit_diagnostico">Diagnóstico Atual</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-floating">
                                    <input type="text" class="form-control" name="cid_principal" id="edit_cid_principal" 
                                           value="${data.cid_principal || ''}" placeholder="CID Principal">
                                    <label for="edit_cid_principal">CID Principal</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-floating">
                                    <input type="text" class="form-control" name="cid_10_secundario" id="edit_cid_secundario" 
                                           value="${data.cid_10_secundario || ''}" placeholder="CID Secundário">
                                    <label for="edit_cid_secundario">CID Secundário</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-floating">
                                    <input type="text" class="form-control" name="cid_10_causas_associadas" id="edit_cid_causas" 
                                           value="${data.cid_10_causas_associadas || ''}" placeholder="CID Causas Associadas">
                                    <label for="edit_cid_causas">CID Causas Associadas</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção: Anamnese e Conduta -->
                <div class="edit-section mb-4">
                    <div class="section-header">
                        <i class="fas fa-notes-medical text-info me-2"></i>
                        <h6 class="section-title mb-0">Anamnese e Conduta Médica</h6>
                    </div>
                    <div class="section-content">
                        <div class="row g-3">
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control clinical-textarea" name="anamnese_exame_fisico" id="edit_anamnese" 
                                              style="height: 120px" placeholder="Anamnese e Exame Físico">${data.anamnese_exame_fisico || ''}</textarea>
                                    <label for="edit_anamnese">Anamnese e Exame Físico</label>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control clinical-textarea" name="conduta" id="edit_conduta" 
                                              style="height: 120px" placeholder="Conduta Médica">${data.conduta || ''}</textarea>
                                    <label for="edit_conduta">Conduta Médica</label>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control medication-textarea" name="antibiotico" id="edit_antibiotico" 
                                              style="height: 100px" placeholder="Antibióticos Prescritos">${data.antibiotico || ''}</textarea>
                                    <label for="edit_antibiotico">Antibióticos Prescritos</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção: Justificativas da Internação -->
                <div class="edit-section mb-4">
                    <div class="section-header">
                        <i class="fas fa-clipboard-list text-warning me-2"></i>
                        <h6 class="section-title mb-0">Justificativas da Internação</h6>
                    </div>
                    <div class="section-content">
                        <div class="row g-3">
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control" name="justificativa_internacao_sinais_e_sintomas" id="edit_justificativa_sinais" 
                                              style="height: 100px" placeholder="Sinais e Sintomas">${data.justificativa_internacao_sinais_e_sintomas || ''}</textarea>
                                    <label for="edit_justificativa_sinais">Sinais e Sintomas</label>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control" name="justificativa_internacao_condicoes" id="edit_justificativa_condicoes" 
                                              style="height: 100px" placeholder="Condições Justificativas">${data.justificativa_internacao_condicoes || ''}</textarea>
                                    <label for="edit_justificativa_condicoes">Condições Justificativas</label>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-floating">
                                    <textarea class="form-control" name="justificativa_internacao_principais_resultados_diagnostico" id="edit_justificativa_resultados" 
                                              style="height: 100px" placeholder="Principais Resultados de Diagnóstico">${data.justificativa_internacao_principais_resultados_diagnostico || ''}</textarea>
                                    <label for="edit_justificativa_resultados">Principais Resultados de Diagnóstico</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção: Procedimentos -->
                <div class="edit-section mb-4">
                    <div class="section-header">
                        <i class="fas fa-procedures text-danger me-2"></i>
                        <h6 class="section-title mb-0">Procedimentos e Códigos</h6>
                    </div>
                    <div class="section-content">
                        <div class="row g-3">
                            <div class="col-md-8">
                                <div class="form-floating">
                                    <textarea class="form-control" name="descr_procedimento_solicitado" id="edit_procedimento" 
                                              style="height: 80px" placeholder="Descrição do Procedimento">${data.descr_procedimento_solicitado || ''}</textarea>
                                    <label for="edit_procedimento">Descrição do Procedimento Solicitado</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-floating">
                                    <input type="text" class="form-control" name="codigo_procedimento" id="edit_codigo_procedimento" 
                                           value="${data.codigo_procedimento || ''}" placeholder="Código do Procedimento">
                                    <label for="edit_codigo_procedimento">Código do Procedimento</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        <style>
        .edicao-internamento-container {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1.5rem;
        }

        .edit-section {
            background: white;
            border-radius: 10px;
            border: 1px solid #e9ecef;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .clinical-textarea {
            background: #f8fff9 !important;
            border-left: 4px solid #007bff !important;
        }

        .medication-textarea {
            background: #f8fff9 !important;
            border-left: 4px solid #28a745 !important;
        }

        .form-floating > .form-control:focus,
        .form-floating > .form-select:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 0.25rem rgba(0, 123, 255, 0.25);
        }

        .form-floating > label {
            color: #6c757d;
            font-weight: 500;
        }

        @media (max-width: 768px) {
            .edicao-internamento-container {
                padding: 1rem;
            }
        }
        </style>
        `;
    }
}

// Função para inicializar os eventos relacionados ao internamento
let dadosInternamentoCache = null;
let modoEdicaoInternamento = false;
let internamentoInfoCarregado = false;

function carregarEMostrarInformacoesInternamento() {
    if (internamentoInfoCarregado && !modoEdicaoInternamento) {
        console.log('Informações de internamento já carregadas e em modo de visualização.');
        return;
    }

    const loadingDiv = document.getElementById('internamento-info-loading');
    const contentDiv = document.getElementById('internamento-info-content');
    const footerDiv = document.getElementById('internamento-info-footer');
    const btnEditar = document.getElementById('btnEditarInternamentoInfo');

    if (!loadingDiv || !contentDiv || !footerDiv || !btnEditar) {
        console.error('Elementos da seção de informações de internamento não encontrados.');
        return;
    }

    loadingDiv.style.display = '';
    contentDiv.style.display = 'none';
    footerDiv.style.display = 'none';
    btnEditar.style.display = 'none'; // Ocultar botão de editar enquanto carrega

    let idConsulta = null;
    const atendimentoIdEl = document.getElementById('atendimento_id');
    if (atendimentoIdEl && atendimentoIdEl.value) {
        idConsulta = atendimentoIdEl.value;
    } else if (typeof internacaoId !== 'undefined' && !isNaN(internacaoId)) {
        idConsulta = internacaoId;
    }

    if (!idConsulta) {
        contentDiv.innerHTML = '<div class="alert alert-danger">Erro: ID para consulta não encontrado.</div>';
        loadingDiv.style.display = 'none';
        contentDiv.style.display = '';
        return;
    }

    fetch(`/api/internacao/${idConsulta}`)
        .then(resp => {
            if (!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
            return resp.json();
        })
        .then(json => {
            if (json.success && json.internacao) {
                dadosInternamentoCache = json.internacao;
                contentDiv.innerHTML = renderizarInternamentoInfo(json.internacao, false);
                btnEditar.style.display = ''; // Mostrar botão de editar após carregar
                internamentoInfoCarregado = true;
                modoEdicaoInternamento = false;
            } else {
                contentDiv.innerHTML = '<div class="alert alert-danger">Erro ao carregar informações.</div>';
            }
        })
        .catch((error) => {
            console.error('Erro na requisição:', error);
            contentDiv.innerHTML = `<div class="alert alert-danger">Erro ao carregar informações: ${error.message}</div>`;
        })
        .finally(() => {
            loadingDiv.style.display = 'none';
            contentDiv.style.display = '';
        });
}

function configurarModoEdicaoInternamento(editar) {
    const contentDiv = document.getElementById('internamento-info-content');
    const footerDiv = document.getElementById('internamento-info-footer');
    const btnEditar = document.getElementById('btnEditarInternamentoInfo');

    if (!dadosInternamentoCache || !contentDiv || !footerDiv || !btnEditar) return;

    modoEdicaoInternamento = editar;
    contentDiv.innerHTML = renderizarInternamentoInfo(dadosInternamentoCache, modoEdicaoInternamento);

    if (modoEdicaoInternamento) {
        footerDiv.innerHTML = `
            <button type="button" class="btn btn-secondary me-2" id="btnCancelarEdicaoInternamento">Cancelar</button>
            <button type="button" class="btn btn-success" id="btnSalvarEdicaoInternamento">Salvar Alterações</button>
        `;
        footerDiv.style.display = '';
        btnEditar.style.display = 'none'; // Ocultar botão "Editar" principal

        document.getElementById('btnSalvarEdicaoInternamento').onclick = salvarAlteracoesInternamento;
        document.getElementById('btnCancelarEdicaoInternamento').onclick = () => configurarModoEdicaoInternamento(false);
    } else {
        footerDiv.innerHTML = '';
        footerDiv.style.display = 'none';
        btnEditar.style.display = ''; // Mostrar botão "Editar" principal
        // Recarregar os dados para garantir que está mostrando a versão mais recente não editada
        // internamentoInfoCarregado = false; // Forçar recarregamento se necessário, ou apenas renderizar o cache
        // carregarEMostrarInformacoesInternamento(); 
        // Apenas renderizar o cache é mais eficiente se não houve erro no salvamento
        contentDiv.innerHTML = renderizarInternamentoInfo(dadosInternamentoCache, false);
    }
}

function abrirImpressao(id) {
  if (!id) {
    alert("ID não informado para a impressão.");
    return;
  }

  const url = `/clinica/impressoes/${id}`;
  window.open(url, '_blank');  // Abre em nova aba ou janela
}


function salvarAlteracoesInternamento() {
    const form = document.getElementById('formEditarInternamentoInfo');
    if (!form) return;

    const formData = new FormData(form);
    const obj = {};
    formData.forEach((value, key) => {
        if (key === 'acidente_de_trabalho') obj[key] = value === 'true';
        else if (key === 'data_internacao') obj[key] = value ? new Date(value).toISOString() : null;
        else obj[key] = value;
    });

    const atendimentoIdVal = document.getElementById('atendimento_id') ? document.getElementById('atendimento_id').value : null;

    if (!atendimentoIdVal) {
        mostrarMensagemErro('Erro crítico: ID de atendimento não encontrado para salvar.');
        console.error('ID de atendimento não encontrado no DOM para salvarAlteracoesInternamento');
        return;
    }
    const idParaApi = atendimentoIdVal; 

    // UX: desabilitar botão salvar e mostrar spinner
    const btnSalvarRef = document.getElementById('btnSalvarEdicaoInternamento');
    if (btnSalvarRef) {
        btnSalvarRef.disabled = true;
        const originalHtml = btnSalvarRef.innerHTML;
        btnSalvarRef.setAttribute('data-original-text', originalHtml);
        btnSalvarRef.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    }

    fetch(`/api/internacao/${idParaApi}`, { // Usar o ID de atendimento correto
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    })
    .then(resp => {
        if (!resp.ok) return resp.json().then(err => { throw new Error(err.message || `Erro HTTP: ${resp.status}`); });
        return resp.json();
    })
    .then(json => {
        if (json.success) {
            dadosInternamentoCache = { ...dadosInternamentoCache, ...json.internacao }; // Atualizar cache com os dados retornados
            // Forçar recarga a partir do backend para garantir dados atualizados e evitar inconsistência
            internamentoInfoCarregado = false;
            configurarModoEdicaoInternamento(false);
            carregarEMostrarInformacoesInternamento();
            mostrarMensagemSucesso('Informações de internamento atualizadas com sucesso!');
            // Efeito visual de destaque
            setTimeout(() => {
                const cardBody = document.querySelector('#internamentoInfoSection .card');
                if (cardBody) {
                    cardBody.classList.add('flash-update');
                    setTimeout(() => cardBody.classList.remove('flash-update'), 1500);
                }
            }, 300);
        } else {
            mostrarMensagemErro('Erro ao salvar: ' + (json.message || 'Erro desconhecido'));
        }
    })
    .catch((error) => {
        console.error('Erro ao salvar:', error);
        mostrarMensagemErro('Erro ao salvar informações: ' + error.message);
    })
    .finally(() => {
        if (btnSalvarRef) {
            btnSalvarRef.disabled = false;
            btnSalvarRef.innerHTML = btnSalvarRef.getAttribute('data-original-text') || 'Salvar Alterações';
        }
    });
}

function inicializarInformacaoInternamento() {
    const btnEditarPrincipal = document.getElementById('btnEditarInternamentoInfo');
    if (btnEditarPrincipal) {
        btnEditarPrincipal.addEventListener('click', () => configurarModoEdicaoInternamento(true));
    }
    // A carga inicial de dados será tratada pelo inicializarNavegacao
}

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    inicializarInformacaoInternamento();
    
    // Aguardar QuillManager estar pronto antes de inicializar módulos que dependem dos editores
    if (window.QuillManager) {
        window.QuillManager.whenReady(function() {
            inicializarModuloAtestados();
            inicializarModuloReceitas();
            inicializarModuloPrescrições();
            inicializarModuloExames();
            inicializarModuloFichasReferencia();
            inicializarNavegacao();
            inicializarObservadores(); // Inicializar observadores para os editores
            
            // Carregar dados se necessário
            if (typeof internacaoId !== 'undefined') {
                // Verificar se estamos na página de evolução
                if (document.getElementById('listaEvolucoes')) {
                    carregarEvolucoes();
                    carregarEvolucoesEnfermagem();
                    carregarPrescricoesEnfermagem();
                }
            }
        });
    } else {
        // Fallback se QuillManager não estiver disponível
        setTimeout(function() {
            inicializarModuloAtestados();
            inicializarModuloReceitas();
            inicializarModuloPrescrições();
            inicializarModuloExames();
            inicializarModuloFichasReferencia();
            inicializarNavegacao();
            inicializarObservadores();
            
            if (typeof internacaoId !== 'undefined') {
                if (document.getElementById('listaEvolucoes')) {
                    carregarEvolucoes();
                    carregarEvolucoesEnfermagem();
                    carregarPrescricoesEnfermagem();
                }
            }
        }, 100);
    }
});

// Adicionar função para inicializar navegação que estava faltando
function inicializarNavegacao() {
    console.log('Inicializando navegação...');
    
    // Configurar navegação das abas
    document.querySelectorAll('.sidebar .nav-link[data-bs-toggle="pill"]').forEach(link => {
        link.addEventListener('click', function (e) {
            // e.preventDefault(); // Não prevenir o default para que o Bootstrap maneje a ativação da aba
            
            const target = this.getAttribute('href');
            // console.log(`Aba clicada: ${target}`);

            // Remover classe active de todas as abas do sidebar manualmente para garantir consistência visual
            document.querySelectorAll('.sidebar .nav-link[data-bs-toggle="pill"]').forEach(l => l.classList.remove('active'));
            // Adicionar classe active na aba atual
            this.classList.add('active');
            
            // OCULTAR TODAS AS SEÇÕES DE CONTEÚDO E MOSTRAR A SELECIONADA
            document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
            const targetSection = document.querySelector(target);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            
            // Lógicas específicas por seção
            if (target === '#internamentoInfoSection') {
                console.log('Aba Informações Internamento ativada.');
                carregarEMostrarInformacoesInternamento();
            } else if (target === '#prescricaoSection') {
                if (typeof carregarPrescricoes === 'function') carregarPrescricoes();
            } else if (target === '#evolucaoSection') {
                if (typeof carregarEvolucoes === 'function') carregarEvolucoes();
            }
        });
    });
    
    // Ativar a primeira aba por padrão e carregar seu conteúdo se necessário
    const primeiraAba = document.querySelector('.sidebar .nav-link[data-bs-toggle="pill"]');
    if (primeiraAba) {
        // Simular clique para ativar a aba e disparar listeners do Bootstrap e os nossos
        // primeiroAba.click(); 
        // Em vez de click(), vamos ativar manualmente e chamar a lógica de carregamento se for o caso
        primeiraAba.classList.add('active');
        const targetPrimeiraAba = primeiraAba.getAttribute('href');
        if (document.querySelector(targetPrimeiraAba)) {
             document.querySelector(targetPrimeiraAba).classList.add('active'); // Mostrar a seção de conteúdo da primeira aba
             document.querySelector(targetPrimeiraAba).style.display = 'block';
        }

        if (targetPrimeiraAba === '#internamentoInfoSection') {
            carregarEMostrarInformacoesInternamento();
        }
        // Adicionar aqui outras lógicas de carregamento para outras abas se necessário
        else if (targetPrimeiraAba === '#prescricaoSection') {
            if (typeof carregarPrescricoes === 'function') carregarPrescricoes();
        }
        // ... outras abas
    }
}

// ======== FUNÇÕES PARA GERENCIAMENTO DE ATESTADOS ========

// Variável para o editor Quill de atestados
let quillAtestado;

// Função para inicializar editor Quill para atestados
function inicializarEditorAtestado() {
    if (!document.getElementById('editor-atestado-container')) return;
    
    // Verificar se já foi inicializado
    if (window.quillAtestado) {
        console.log('Editor de atestado já inicializado.');
        return;
    }
    
    try {
        // Verificar se Quill está disponível globalmente
        if (typeof Quill === 'undefined') {
            throw new Error('Biblioteca Quill não encontrada. Verifique se foi importada corretamente.');
        }
        
        // Inicializar o Editor Quill para atestados com configuração básica
        // Usar uma configuração mais simples sem depender de imports
        window.quillAtestado = new Quill('#editor-atestado-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['clean']
                ]
            },
            placeholder: 'Digite o conteúdo do atestado aqui...'
        });
        
        // Adicionar evento para atualizar campo oculto quando o conteúdo mudar
        window.quillAtestado.on('text-change', function() {
            const conteudo = window.quillAtestado.root.innerHTML;
            document.getElementById('conteudo_atestado').value = conteudo;
        });
        
        console.log('Editor de atestado inicializado com sucesso.');
    } catch (error) {
        console.error('Erro ao inicializar o editor Quill:', error);
        
        // Criar um fallback para o editor
        const container = document.getElementById('editor-atestado-container');
        if (container) {
            container.innerHTML = '<textarea id="fallback-atestado" class="form-control" rows="10" placeholder="Digite o conteúdo do atestado aqui..."></textarea>';
            
            // Atualizar o textarea oculto quando o fallback for alterado
            const fallback = document.getElementById('fallback-atestado');
            if (fallback) {
                fallback.addEventListener('input', function() {
                    document.getElementById('conteudo_atestado').value = this.value;
                });
            }
        }
    }
}

// Função para carregar atestados
function carregarAtestados() {
    if (!document.getElementById('listaAtestadosDoDia')) return;
    
    jQuery.ajax({
        url: `/api/atestados/${document.getElementById('atendimento_id') ? document.getElementById('atendimento_id').value : internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const hoje = new Date().toLocaleDateString('pt-BR');
                const atestadosHoje = [];
                const atestadosAntigos = [];

                response.atestados.forEach(atestado => {
                    const dataAtestado = new Date(atestado.data_atestado).toLocaleDateString('pt-BR');
                    if (dataAtestado === hoje) {
                        atestadosHoje.push(atestado);
                    } else {
                        atestadosAntigos.push(atestado);
                    }
                });

                // ORDENAR POR DATA/HORA - MAIS RECENTES PRIMEIRO
                atestadosHoje.sort((a, b) => new Date(b.data_atestado) - new Date(a.data_atestado));
                atestadosAntigos.sort((a, b) => new Date(b.data_atestado) - new Date(a.data_atestado));

                // Renderizar atestados de hoje
                renderizarAtestados(atestadosHoje, '#listaAtestadosDoDia', true);
                
                // Renderizar atestados antigos
                renderizarAtestados(atestadosAntigos, '#listaAtestadosAntigos', false);
                
                // Atualizar contador
                jQuery('#contador-atestados-antigos').text(atestadosAntigos.length);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar atestados:', error);
            mostrarMensagemErro('Erro ao carregar atestados. Por favor, tente novamente.');
        }
    });
}

// Função para renderizar atestados
function renderizarAtestados(atestados, containerId, ehHoje) {
    const container = jQuery(containerId);
    
    if (atestados.length === 0) {
        container.html(`
            <div class="alert alert-info">
                ${ehHoje ? 'Nenhum atestado registrado hoje.' : 'Nenhum atestado anterior encontrado.'}
            </div>
        `);
        return;
    }

    let html = '';
    atestados.forEach(atestado => {
        const dataFormatada = new Date(atestado.data_atestado).toLocaleString('pt-BR');
        const diasAfastamento = atestado.dias_afastamento || 'Não especificado';

        html += `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-primary me-2">${diasAfastamento} dia(s) de afastamento</span>
                            <small class="text-muted">${dataFormatada}</small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="visualizarAtestado(${atestado.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="gerarPDFAtestado(${atestado.id})" title="Imprimir Atestado">
                                <i class="fas fa-print"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="atestado-preview">
                        ${atestado.conteudo_atestado}
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);
}

// Função para visualizar atestado (placeholder por enquanto)
function visualizarAtestado(id) {
    // Buscar o atestado pelo ID e exibir em um modal detalhado
    $.ajax({
        url: `/api/atestados/${document.getElementById('atendimento_id') ? document.getElementById('atendimento_id').value : internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const atestado = response.atestados.find(a => a.id === id);
                if (atestado) {
                    const dataFormatada = new Date(atestado.data_atestado).toLocaleString('pt-BR');
                    const diasAfastamento = atestado.dias_afastamento || 'Não especificado';

                    // Cria o modal se não existir
                    if ($('#modalVisualizarAtestado').length === 0) {
                        $('body').append(`
                            <div class="modal fade" id="modalVisualizarAtestado" tabindex="-1" aria-labelledby="modalVisualizarAtestadoLabel" aria-hidden="true">
                                <div class="modal-dialog modal-lg">
                                    <div class="modal-content">
                                        <div class="modal-header bg-primary text-white">
                                            <h5 class="modal-title" id="modalVisualizarAtestadoLabel">Visualizar Atestado</h5>
                                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                        </div>
                                        <div class="modal-body" id="modalVisualizarAtestadoBody"></div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `);
                    }

                    // Preenche o conteúdo do modal
                    $('#modalVisualizarAtestadoBody').html(`
                        <div class="mb-2">
                            <span class="badge bg-primary me-2">${diasAfastamento} dia(s) de afastamento</span>
                            <small class="text-muted">${dataFormatada}</small>
                        </div>
                        <div class="mb-3">
                            <strong>Médico:</strong> ${atestado.medico_nome || '-'}
                        </div>
                        <div class="mb-3">
                            <strong>Conteúdo do Atestado:</strong>
                            <div class="border rounded p-3 mt-2" style="background:#f8f9fa; min-height:80px;">
                                ${atestado.conteudo_atestado}
                            </div>
                        </div>
                    `);

                    // Exibe o modal
                    const modal = new bootstrap.Modal(document.getElementById('modalVisualizarAtestado'));
                    modal.show();
                } else {
                    mostrarMensagemErro('Atestado não encontrado.');
                }
            } else {
                mostrarMensagemErro('Erro ao buscar informações do atestado.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar atestado:', error);
            mostrarMensagemErro('Erro ao visualizar atestado. Por favor, tente novamente.');
        }
    });
}

// Função para imprimir atestado
function gerarPDFAtestado(id) {
    if (!id) {
        alert('ID do atestado não informado.');
        return;
    }
    
    // Abrir página de impressão do atestado em nova aba
    const url = `/clinica/atestado/${id}/imprimir`;
    const novaJanela = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!novaJanela) {
        alert('Popup bloqueado. Por favor, permita popups para este site e tente novamente.');
        return;
    }
}

// Função para configurar sincronização de dias de afastamento
function configurarSincronizacaoDiasAfastamento() {
    console.log('Configurando sincronização de dias de afastamento...');
    
    // Função para atualizar o texto do atestado com base nos dias
    const atualizarTextoAtestadoComDias = function() {
        const diasInput = document.getElementById('dias_afastamento');
        if (!diasInput) return;
        
        const dias = parseInt(diasInput.value, 10);
        
        // Só atualizar se for um número válido maior que 0
        if (dias > 0) {
            // Obter dados do paciente do DOM
            let nomePaciente = 'NOME DO PACIENTE';
            let cpfPaciente = 'CPF DO PACIENTE';
            
            try {
                // Buscar nome do paciente
                const nomeElement = $('.paciente-info .info-item:contains("Nome:")');
                if (nomeElement.length > 0) {
                    const nomeTexto = nomeElement.text();
                    const nomeMatch = nomeTexto.match(/Nome:\s*(.+)/);
                    if (nomeMatch && nomeMatch[1]) {
                        nomePaciente = nomeMatch[1].trim();
                    }
                }
                
                // Buscar CPF do paciente
                const cpfElement = $('.paciente-info .info-item:contains("CPF:")');
                if (cpfElement.length > 0) {
                    const cpfTexto = cpfElement.text();
                    const cpfMatch = cpfTexto.match(/CPF:\s*(.+)/);
                    if (cpfMatch && cpfMatch[1]) {
                        cpfPaciente = cpfMatch[1].trim();
                    }
                }
            } catch (error) {
                console.warn('Erro ao extrair dados do paciente:', error);
            }
            
            // Gerar novo texto com o número de dias atualizado
            const novoTexto = `Atesto que ${nomePaciente}, portador do CPF n: ${cpfPaciente}, deverá afastar-se do trabalho por um período de ${dias} dias, para tratamento de saúde. \n\n CID:_______`;
            
            // Atualizar o editor Quill se disponível
            if (window.quillAtestado && window.quillAtestado.setText) {
                window.quillAtestado.setText(novoTexto);
                console.log('Texto do atestado atualizado para', dias, 'dias');
            }
        }
    };
    
    // Adicionar event listeners quando o modal for mostrado
    $(document).on('shown.bs.modal', '#modalNovoAtestado', function () {
        setTimeout(() => {
            const diasInput = document.getElementById('dias_afastamento');
            if (diasInput) {
                // Remover listeners existentes para evitar duplicação
                diasInput.removeEventListener('input', atualizarTextoAtestadoComDias);
                diasInput.removeEventListener('change', atualizarTextoAtestadoComDias);
                
                // Adicionar novos listeners
                diasInput.addEventListener('input', atualizarTextoAtestadoComDias);
                diasInput.addEventListener('change', atualizarTextoAtestadoComDias);
                
                console.log('Event listeners configurados para o campo de dias de afastamento');
            }
        }, 100);
    });
}

// Inicializador para as funções de atestados
function inicializarModuloAtestados() {
    inicializarEditorAtestado();
    
    // Carregar atestados ao inicializar
    carregarAtestados();
    
    // Configurar event listeners para sincronização de dias de afastamento
    configurarSincronizacaoDiasAfastamento();
    
    // Evento para salvar novo atestado
    const btnSalvarAtestado = document.getElementById('btn_salvar_atestado');
        if (btnSalvarAtestado) {
            btnSalvarAtestado.addEventListener('click', function() {
                const dias_afastamento = document.getElementById('dias_afastamento').value;
                let conteudo_atestado = '';

                // Use o Quill se disponível, senão use o fallback textarea
                if (window.quillAtestado && window.quillAtestado.root) {
                    conteudo_atestado = window.quillAtestado.root.innerHTML;
                } else if (document.getElementById('fallback-atestado')) {
                    conteudo_atestado = document.getElementById('fallback-atestado').value;
                } else if (document.getElementById('conteudo_atestado')) {
                    conteudo_atestado = document.getElementById('conteudo_atestado').value;
                }

            if (!conteudo_atestado || conteudo_atestado === '<p><br></p>') {
                alert('Por favor, preencha o conteúdo do atestado.');
                return;
            }

            // Mostrar indicador de carregamento
            const btnSalvar = $(this);
            const textoOriginal = btnSalvar.html();
            btnSalvar.html('<i class="fas fa-spinner fa-spin"></i> Salvando...').prop('disabled', true);

            // Preparar dados para envio - Garantindo que os tipos de dados estejam corretos
            const user_id = document.getElementById('user_id') ? 
                            document.getElementById('user_id').value : 
                            (typeof session !== 'undefined' && session.user_id ? session.user_id : '0');
            
            // Verificar dados para API            
            const atendimentoIdEl = document.getElementById('atendimento_id');            
            let idAtendimento = null;
            
            if (atendimentoIdEl && atendimentoIdEl.value) {                
                idAtendimento = atendimentoIdEl.value;                
                console.log('Usando ID de atendimento do campo hidden para atestado:', idAtendimento);            
            } else if (typeof internacaoId !== 'undefined') {                
                // Precisamos enviar o atendimento_id, não o ID da internação                
                // Se o backend espera o atendimento_id, não enviar o internacaoId bruto                
                console.log('Usando internacaoId como fallback, ATENÇÃO: isso pode não funcionar se a API espera atendimento_id');                
                idAtendimento = internacaoId;            
            }
            
            if (!idAtendimento) {                
                alert('Erro: ID de atendimento não encontrado');                
                btnSalvar.html(textoOriginal).prop('disabled', false);                
                return;            
            }
            
            const dados = {                
                atendimento_id: idAtendimento,                
                medico_id: parseInt(user_id, 10),                
                conteudo_atestado: conteudo_atestado.trim(),                
                dias_afastamento: dias_afastamento ? parseInt(dias_afastamento, 10) : null,                
                paciente_id: document.getElementById('paciente_id') ?                              
                             parseInt(document.getElementById('paciente_id').value, 10) : null            
            };

            console.log('Dados sendo enviados:', dados); // Log para debug

            // Enviar requisição
            $.ajax({
                url: '/api/atestados',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(dados),
                success: function(response) {
                    if (response.success) {
                        // Limpar formulário
                        // Limpar formulário
                        document.getElementById('dias_afastamento').value = '';
                        if (window.quillAtestado && typeof window.quillAtestado.setText === 'function') {
                            window.quillAtestado.setText('');
                        } else if (document.getElementById('fallback-atestado')) {
                            document.getElementById('fallback-atestado').value = '';
                        }
                        // Fechar modal
                        $('#modalNovoAtestado').modal('hide');
                        
                        // Recarregar atestados
                        carregarAtestados();
                        
                        // Mostrar mensagem de sucesso
                        mostrarMensagemSucesso('Atestado registrado com sucesso!');
                    } else {
                        console.error('Erro na resposta:', response);
                        alert('Erro ao registrar atestado: ' + (response.message || 'Erro desconhecido'));
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao registrar atestado:', {
                        status: xhr.status,
                        responseText: xhr.responseText,
                        error: error
                    });
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        alert('Erro ao registrar atestado: ' + (errorResponse.message || error));
                    } catch (e) {
                        alert('Erro ao registrar atestado: ' + error);
                    }
                },
                complete: function() {
                    // Restaurar botão
                    btnSalvar.html(textoOriginal).prop('disabled', false);
                }
            });
        });
    }
    
    // Configurar clique para abrir as informações
    const btnMostrarInformacoes = document.getElementById('btnMostrarInformacoes');
    const abaInformacoes = document.querySelector('a[data-target="informacoesSection"]');
    if (btnMostrarInformacoes && abaInformacoes) {
        btnMostrarInformacoes.addEventListener('click', function() {
            window.location.href = `/clinica/internacao/${internacaoId}/informacoes`;
        });
    }
}

// Função auxiliar para mostrar mensagem de sucesso
function mostrarMensagemSucesso(texto) {
    const alerta = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        </div>
    `;
    
    const container = document.querySelector('.mensagens-container') || document.querySelector('.container');
    if (container) {
        container.insertAdjacentHTML('afterbegin', alerta);
        
        // Auto-fechar após 5 segundos
        setTimeout(() => {
            const alertEl = container.querySelector('.alert');
            if (alertEl) alertEl.remove();
        }, 5000);
    }
}

// Função auxiliar para mostrar mensagem de erro
function mostrarMensagemErro(texto) {
    const alerta = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        </div>
    `;
    
    const container = document.querySelector('.mensagens-container') || document.querySelector('.container');
    if (container) {
        container.insertAdjacentHTML('afterbegin', alerta);
        
        // Auto-fechar após 8 segundos
        setTimeout(() => {
            const alertEl = container.querySelector('.alert');
            if (alertEl) alertEl.remove();
        }, 8000);
    }
}

// ======== FUNÇÕES PARA GERENCIAMENTO DE RECEITAS ========

// Variável para o editor Quill de receitas
let quillReceita;

// Inicializar editor Quill para receitas
function inicializarEditorReceita() {
    const container = document.getElementById('editor-receita-container');
    if (!container) {
        console.warn('Container do editor de receita não encontrado');
        return;
    }

    // Se já existe, não reinicializa
    if (window.quillReceita) {
        console.log('Editor de receita já inicializado');
        return;
    }

    // Limpa o container antes de inicializar
    container.innerHTML = "";

    try {
        if (typeof Quill === 'undefined') {
            throw new Error('Biblioteca Quill não encontrada. Verifique se foi importada corretamente.');
        }

        window.quillReceita = new Quill('#editor-receita-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['clean']
                ]
            },
            placeholder: 'Digite o conteúdo da receita aqui...'
        });

        // Sincronizar as referências para garantir consistência
        quillReceita = window.quillReceita;

        window.quillReceita.on('text-change', function() {
            const conteudo = window.quillReceita.root.innerHTML;
            const hiddenField = document.getElementById('conteudo_receita');
            if (hiddenField) {
                hiddenField.value = conteudo;
            }
        });

        console.log('Editor de receita inicializado com sucesso');

    } catch (error) {
        console.error('Erro ao inicializar o editor Quill:', error);
        container.innerHTML = '<textarea id="fallback-receita" class="form-control" rows="10" placeholder="Digite o conteúdo da receita aqui..."></textarea>';
        const fallback = document.getElementById('fallback-receita');
        if (fallback) {
            fallback.addEventListener('input', function() {
                const hiddenField = document.getElementById('conteudo_receita');
                if (hiddenField) {
                    hiddenField.value = this.value;
                }
            });
        }
        console.log('Fallback de textarea criado para receita');
    }
}

// Função para carregar receitas
function carregarReceitas() {
    if (!document.getElementById('listaReceitasDoDia')) return;
    
    $.ajax({
        url: `/api/receituarios/${document.getElementById('atendimento_id') ? document.getElementById('atendimento_id').value : internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const hoje = new Date().toLocaleDateString('pt-BR');
                const receitasHoje = [];
                const receitasAntigas = [];

                response.receituarios.forEach(receita => {
                    const dataReceita = new Date(receita.data_receita).toLocaleDateString('pt-BR');
                    if (dataReceita === hoje) {
                        receitasHoje.push(receita);
                    } else {
                        receitasAntigas.push(receita);
                    }
                });

                // ORDENAR POR DATA/HORA - MAIS RECENTES PRIMEIRO
                receitasHoje.sort((a, b) => new Date(b.data_receita) - new Date(a.data_receita));
                receitasAntigas.sort((a, b) => new Date(b.data_receita) - new Date(a.data_receita));

                // Renderizar receitas de hoje
                renderizarReceitas(receitasHoje, '#listaReceitasDoDia', true);
                
                // Renderizar receitas antigas
                renderizarReceitas(receitasAntigas, '#listaReceitasAntigas', false);
                
                // Atualizar contador
                if (document.getElementById('contador-receitas-antigas')) {
                    $('#contador-receitas-antigas').text(receitasAntigas.length);
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar receitas:', error);
            mostrarMensagemErro('Erro ao carregar receitas. Por favor, tente novamente.');
        }
    });
}

// Função para renderizar receitas
function renderizarReceitas(receitas, containerId, ehHoje) {
    const container = $(containerId);
    
    if (receitas.length === 0) {
        container.html(`
            <div class="alert alert-info">
                ${ehHoje ? 'Nenhuma receita registrada hoje.' : 'Nenhuma receita anterior encontrada.'}
            </div>
        `);
        return;
    }

    let html = '';
    receitas.forEach(receita => {
        const dataFormatada = new Date(receita.data_receita).toLocaleString('pt-BR');
        const tipoReceita = receita.tipo_receita === 'especial' ? 'Especial' : 'Normal';
        const badgeClass = receita.tipo_receita === 'especial' ? 'bg-danger' : 'bg-success';

        html += `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge ${badgeClass} me-2">Receita ${tipoReceita}</span>
                            <small class="text-muted">${dataFormatada}</small>
                        </div>
                        <div>
                            ${receita.tipo_receita === 'normal' ? 
                                `<button class='btn btn-sm btn-outline-dark' title='Imprimir (2 cópias)' onclick='imprimirReceitaComum(${receita.id})'><i class="fas fa-print"></i></button>` : 
                                `<button class='btn btn-sm btn-outline-danger' title='Imprimir Receita Especial' onclick='imprimirReceitaEspecial(${receita.id})'><i class="fas fa-print"></i></button>`}
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="receita-preview">
                        ${receita.conteudo_receita}
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);
}

// Função para visualizar receita (placeholder por enquanto)
function visualizarReceita(id) {
    // Buscar a receita pelo ID e exibir em um modal detalhado
    $.ajax({
        url: `/api/receituarios/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const receita = response.receituarios.find(r => r.id === id);
                if (receita) {
                    // Montar HTML detalhado da receita
                    const dataFormatada = new Date(receita.data_receita).toLocaleString('pt-BR');
                    const tipoReceita = receita.tipo_receita === 'especial' ? 'Especial' : 'Normal';
                    const badgeClass = receita.tipo_receita === 'especial' ? 'bg-danger' : 'bg-success';

                    // Cria o modal se não existir
                    if ($('#modalVisualizarReceita').length === 0) {
                        $('body').append(`
                            <div class="modal fade" id="modalVisualizarReceita" tabindex="-1" aria-labelledby="modalVisualizarReceitaLabel" aria-hidden="true">
                                <div class="modal-dialog modal-lg">
                                    <div class="modal-content">
                                        <div class="modal-header bg-primary text-white">
                                            <h5 class="modal-title" id="modalVisualizarReceitaLabel">Visualizar Receita</h5>
                                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                        </div>
                                        <div class="modal-body" id="modalVisualizarReceitaBody"></div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `);
                    }

                    // Preenche o conteúdo do modal
                    $('#modalVisualizarReceitaBody').html(`
                        <div class="mb-2">
                            <span class="badge ${badgeClass} me-2">Receita ${tipoReceita}</span>
                            <small class="text-muted">${dataFormatada}</small>
                        </div>
                        <div class="mb-3">
                            <strong>Médico:</strong> ${receita.medico_nome || '-'}
                        </div>
                        <div class="mb-3">
                            <strong>Conteúdo da Receita:</strong>
                            <div class="border rounded p-3 mt-2" style="background:#f8f9fa; min-height:80px;">
                                ${receita.conteudo_receita}
                            </div>
                        </div>
                    `);

                    // Exibe o modal
                    const modal = new bootstrap.Modal(document.getElementById('modalVisualizarReceita'));
                    modal.show();
                } else {
                    mostrarMensagemErro('Receita não encontrada.');
                }
            } else {
                mostrarMensagemErro('Erro ao buscar informações da receita.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar receita:', error);
            mostrarMensagemErro('Erro ao visualizar receita. Por favor, tente novamente.');
        }
    });
}

// Função para gerar PDF
function gerarPDFReceita(id) {
    // Buscar informações da receita primeiro
    $.ajax({
        url: `/api/receituarios/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const receita = response.receituarios.find(r => r.id === id);
                if (receita) {
                    if (receita.tipo_receita === 'normal') {
                        // Para receitas normais, usar o endpoint de geração de PDF
                        window.open(`/clinica/receituario/${id}/gerar_pdf`, '_blank');
                    } else {
                        // Para receitas especiais, mostrar mensagem de desenvolvimento
                        alert('Geração de PDF para receitas especiais em desenvolvimento');
                    }
                } else {
                    mostrarMensagemErro('Receita não encontrada.');
                }
            } else {
                mostrarMensagemErro('Erro ao buscar informações da receita.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar receita:', error);
            mostrarMensagemErro('Erro ao gerar PDF da receita. Por favor, tente novamente.');
        }
    });
}

// Inicializador para as funções de receitas
function inicializarModuloReceitas() {
    // Não inicializar o editor aqui - será feito pelo QuillManager
    
    // Carregar receitas ao inicializar
    carregarReceitas();
    
    // Evento para salvar nova receita
    const btnSalvarReceita = document.getElementById('btn_salvar_receita');
    if (btnSalvarReceita) {
        btnSalvarReceita.addEventListener('click', function() {
            const tipo_receita = document.getElementById('tipo_receita').value;
            
            // Usar QuillManager para obter conteúdo
            let conteudo_receita = '';
            if (window.QuillManager) {
                conteudo_receita = window.QuillManager.getContent('receita');
            } else {
                // Fallback para método antigo
                if (window.quillReceita && window.quillReceita.root) {
                    conteudo_receita = window.quillReceita.root.innerHTML;
                } else if (quillReceita && quillReceita.root) {
                    conteudo_receita = quillReceita.root.innerHTML;
                } else {
                    const fallback = document.getElementById('fallback-receita');
                    if (fallback) {
                        conteudo_receita = fallback.value;
                    }
                }
            }

            if (!tipo_receita) {
                alert('Por favor, selecione o tipo de receita.');
                return;
            }

            if (!conteudo_receita || conteudo_receita === '<p><br></p>' || conteudo_receita.trim() === '') {
                alert('Por favor, preencha o conteúdo da receita.');
                return;
            }

            // Mostrar indicador de carregamento
            const btnSalvar = $(this);
            const textoOriginal = btnSalvar.html();
            btnSalvar.html('<i class="fas fa-spinner fa-spin"></i> Salvando...').prop('disabled', true);

            // Verificar dados para API            
            const atendimentoIdEl = document.getElementById('atendimento_id');            
            let idAtendimento = null;
            
            if (atendimentoIdEl && atendimentoIdEl.value) {                
                idAtendimento = atendimentoIdEl.value;                
                console.log('Usando ID de atendimento do campo hidden para receita:', idAtendimento);            
            } else if (typeof internacaoId !== 'undefined') {                
                console.log('Usando internacaoId como fallback para receita');                
                idAtendimento = internacaoId;            
            }
            
            if (!idAtendimento) {                
                alert('Erro: ID de atendimento não encontrado');                
                btnSalvar.html(textoOriginal).prop('disabled', false);                
                return;            
            }
            
            // Pegar ID do médico
            const user_id = document.getElementById('user_id') ? 
                            document.getElementById('user_id').value : 
                            (typeof session !== 'undefined' && session.user_id ? session.user_id : '0');

            // Preparar dados para envio
            const dados = {
                atendimento_id: idAtendimento,
                medico_id: parseInt(user_id, 10),
                tipo_receita: tipo_receita,
                conteudo_receita: conteudo_receita,
                paciente_id: document.getElementById('paciente_id') ? 
                             parseInt(document.getElementById('paciente_id').value, 10) : null
            };
            
            console.log('Dados da receita sendo enviados:', dados);

            // Enviar requisição
            $.ajax({
                url: '/api/receituarios',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(dados),
                success: function(response) {
                    if (response.success) {
                        // Limpar formulário
                        document.getElementById('tipo_receita').value = '';
                        
                        // Limpar editor usando QuillManager
                        if (window.QuillManager) {
                            window.QuillManager.setContent('receita', '');
                        } else {
                            // Fallback para método antigo
                            if (window.quillReceita && window.quillReceita.setText) {
                                window.quillReceita.setText('');
                            } else if (quillReceita && quillReceita.setText) {
                                quillReceita.setText('');
                            } else {
                                const fallback = document.getElementById('fallback-receita');
                                if (fallback) {
                                    fallback.value = '';
                                }
                            }
                        }
                        
                        // Fechar modal
                        $('#modalNovaReceita').modal('hide');
                        
                        // Recarregar receitas
                        carregarReceitas();
                        
                        // Mostrar mensagem de sucesso
                        mostrarMensagemSucesso('Receita registrada com sucesso!');
                    } else {
                        console.error('Erro na resposta da receita:', response);
                        alert('Erro ao registrar receita: ' + (response.message || 'Erro desconhecido'));
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao registrar receita:', {
                        status: xhr.status,
                        responseText: xhr.responseText,
                        error: error
                    });
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        alert('Erro ao registrar receita: ' + (errorResponse.message || error));
                    } catch (e) {
                        alert('Erro ao registrar receita: ' + error);
                    }
                },
                complete: function() {
                    // Restaurar botão
                    btnSalvar.html(textoOriginal).prop('disabled', false);
                }
            });
        });
    }
}

// ======== FUNÇÕES PARA GERENCIAMENTO DE PRESCRIÇÕES ========

// Função global para manipulação de medicamentos
window.medicamentosAdicionados = window.medicamentosAdicionados || [];

// Função para remover medicamento
function removerMedicamento(index) {
    window.medicamentosAdicionados.splice(index, 1);
    atualizarTabelaMedicamentos();
}

// Função para atualizar a tabela de medicamentos
function atualizarTabelaMedicamentos() {
    const tbody = $('#tabela_medicamentos tbody');
    tbody.empty();
    
    if (window.medicamentosAdicionados.length === 0) {
        tbody.html(`
            <tr id="sem_medicamentos">
                <td colspan="3" class="text-center text-muted">Nenhum medicamento adicionado</td>
            </tr>
        `);
        return;
    }
    
    window.medicamentosAdicionados.forEach((med, index) => {
        tbody.append(`
            <tr>
                <td>${med.nome_medicamento}</td>
                <td>${med.descricao_uso}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm" onclick="removerMedicamento(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

// Função para limpar o formulário de prescrição
function limparFormularioPrescricao() {
    $('#prescricao_id').val('');
    $('#texto_dieta').val('');
    $('#texto_procedimento_medico').val('');
    $('#texto_procedimento_multi').val('');
    $('#nome_medicamento').val('');
    $('#descricao_uso').val('');
    
    // Limpar medicamentos adicionados
    medicamentosAdicionados = [];
    atualizarTabelaMedicamentos();
    
    // Restaurar título do modal
    $('#modalPrescricaoLabel').text('Nova Prescrição');
}

// Renderizador de prescrição
function renderizarPrescricao(prescricao) {
    // Determinar a melhor data disponível
    const dataOriginal = prescricao.horario_prescricao || prescricao.data_prescricao || prescricao.created_at;
    
    // USAR CONVERSÃO FORÇADA PARA HORÁRIO BRASILEIRO
    const dataFormatadaBrasil = forcarHorarioBrasileiro(dataOriginal);
    
    // Verificar se é de hoje baseado na data convertida
    const dataPrescricao = new Date(dataOriginal + (dataOriginal.includes('Z') ? '' : 'Z'));
    dataPrescricao.setHours(dataPrescricao.getHours() - 3); // Ajustar para Brasil
    const hoje = new Date();
    const ehHoje = dataPrescricao.toDateString() === hoje.toDateString();
    
    // Formatar para exibição com conversão brasileira
    let dataFormatada;
    if (ehHoje) {
        const horaApenas = forcarHoraBrasileira(dataOriginal);
        dataFormatada = `Hoje, ${horaApenas}`;
    } else {
        dataFormatada = dataFormatadaBrasil;
    }
    
    // Classe CSS adicional para prescrições de hoje
    const classeContainer = ehHoje ? 'prescricao-container prescricao-hoje' : 'prescricao-container prescricao-antiga';
    
    let html = `
        <div class="${classeContainer}">
            <div class="prescricao-header">
                <div class="medico-info" style="display: flex; align-items: center; flex-wrap: wrap;">
                    <span class="medico-nome" style="font-weight: 600; color: var(--text-primary);">Dr(a). ${prescricao.medico_nome || 'Médico não informado'}</span>
                    <span class="timestamp" style="color: rgba(255, 255, 255, 0.85); font-size: 0.9rem; font-weight: 400; margin-left: 8px;"> - ${dataFormatada}</span>
                    ${ehHoje ? '<span class="badge bg-success ms-2" style="font-size: 0.7rem;">HOJE</span>' : ''}
                </div>
                <div class="prescricao-actions">
                    <button type="button" class="btn-action-discreto" 
                            onclick="criarPrescricaoBaseada(${prescricao.id})" 
                            title="Criar nova prescrição baseada nesta">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button type="button" class="btn-print-discreto" 
                            onclick="imprimirPrescricao(${prescricao.id})" 
                            title="Imprimir Prescrição">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </div>
            
            ${prescricao.texto_dieta ? `
                <div class="prescricao-section dieta">
                    <div class="prescricao-section-title">Dieta</div>
                    <div class="prescricao-section-content">${prescricao.texto_dieta}</div>
                </div>
            ` : ''}
            
            ${prescricao.medicamentos && prescricao.medicamentos.length > 0 ? `
                <div class="prescricao-section medicamentos">
                    <div class="prescricao-section-title">Medicamentos</div>
                    <div class="prescricao-section-content">
                        <table class="table table-sm table-hover tabela-medicamentos-prescricao">
                            <thead>
                                <tr>
                                    <th>Medicamento</th>
                                    <th>Descrição</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${prescricao.medicamentos.map(med => `
                                    <tr>
                                        <td>${med.nome_medicamento}</td>
                                        <td>${med.descricao_uso}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-info" onclick="visualizarAprazamentos('${med.nome_medicamento}')">
                                                <i class="fas fa-clock"></i> Ver Horários
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
            ${prescricao.texto_procedimento_medico ? `
                <div class="prescricao-section procedimentos">
                    <div class="prescricao-section-title">Procedimentos Médicos</div>
                    <div class="prescricao-section-content">${prescricao.texto_procedimento_medico}</div>
                </div>
            ` : ''}
            
            ${prescricao.texto_procedimento_multi ? `
                <div class="prescricao-section procedimentos">
                    <div class="prescricao-section-title">Procedimentos Multiprofissionais</div>
                    <div class="prescricao-section-content">${prescricao.texto_procedimento_multi}</div>
                </div>
            ` : ''}
        </div>
    `;
    return html;
}

// Função auxiliar para gerenciar modal de loading
function mostrarLoadingModal(mensagem = 'Carregando...') {
    // Remover modal existente
    $('#loadingModal').remove();
    
    const loadingModal = `
        <div class="modal fade" id="loadingModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-body text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando...</span>
                        </div>
                        <p class="mt-2 mb-0">${mensagem}</p>
                        <button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick="fecharLoadingModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(loadingModal);
    const modalInstance = new bootstrap.Modal(document.getElementById('loadingModal'));
    modalInstance.show();
    
    // Timeout de segurança - fechar automaticamente após 15 segundos
    setTimeout(() => {
        if (document.getElementById('loadingModal')) {
            console.warn('Modal de loading fechado por timeout de segurança');
            fecharLoadingModal();
        }
    }, 15000);
    
    return modalInstance;
}

function fecharLoadingModal() {
    // Forçar fechamento e remoção do modal
    const modalElement = document.getElementById('loadingModal');
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
    
    // Garantir remoção após um breve delay
    setTimeout(() => {
        $('#loadingModal').remove();
        $('.modal-backdrop').remove(); // Remover backdrop se ficou "orfão"
        $('body').removeClass('modal-open'); // Remover classe que pode travar o scroll
        
        // Garantir que o body não tenha overflow hidden
        $('body').css('overflow', '');
    }, 200);
}

// Listener global para limpeza de modais
$(document).ready(function() {
    // Limpar qualquer modal de loading órfão quando qualquer modal for fechado
    $(document).on('hidden.bs.modal', function (e) {
        // Se não há mais modais abertos, limpar tudo
        if ($('.modal.show').length === 0) {
            $('.modal-backdrop').remove();
            $('body').removeClass('modal-open').css('overflow', '');
        }
    });
    
    // Limpar loading modal especificamente
    $(document).on('hidden.bs.modal', '#loadingModal', function () {
        $('#loadingModal').remove();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css('overflow', '');
    });
});

// Função para criar prescrição baseada em outra
function criarPrescricaoBaseada(prescricaoId) {
    console.log('Iniciando criação de prescrição baseada. ID:', prescricaoId);
    
    // Mostrar modal de loading
    const modalInstance = mostrarLoadingModal('Carregando prescrição base...');
    
    // Buscar dados da prescrição base
    $.ajax({
        url: `/api/prescricoes/${prescricaoId}/base`,
        method: 'GET',
        timeout: 10000, // 10 segundos de timeout
        success: function(response) {
            console.log('Resposta da API recebida:', response);
            
            if (response.success && response.prescricao_base) {
                const prescricaoBase = response.prescricao_base;
                console.log('Dados da prescrição base:', prescricaoBase);
                
                // Limpar o formulário primeiro
                $('#formPrescricao')[0].reset();
                window.medicamentosAdicionados = [];
                
                // Preencher campos com dados da prescrição base
                $('#texto_dieta').val(prescricaoBase.texto_dieta || '');
                $('#texto_procedimento_medico').val(prescricaoBase.texto_procedimento_medico || '');
                $('#texto_procedimento_multi').val(prescricaoBase.texto_procedimento_multi || '');
                
                // Carregar medicamentos
                if (prescricaoBase.medicamentos && prescricaoBase.medicamentos.length > 0) {
                    window.medicamentosAdicionados = [...prescricaoBase.medicamentos];
                    atualizarTabelaMedicamentos();
                    console.log('Medicamentos carregados:', window.medicamentosAdicionados.length);
                }
                
                console.log('Fechando modal de loading...');
                
                // Fechar modal de loading
                fecharLoadingModal();
                
                // Aguardar e preparar modal de prescrição
                setTimeout(() => {
                    console.log('Preparando modal de nova prescrição...');
                    
                    // Alterar título do modal
                    $('#modalNovaPrescricao .modal-title').html(`
                        <div class="d-flex align-items-center">
                            <i class="fas fa-copy me-2 text-warning"></i>
                            Nova Prescrição (Baseada em Prescrição Anterior)
                        </div>
                    `);
                    
                    // Adicionar indicador visual
                    let indicadorBase = $('#indicador-prescricao-base');
                    if (indicadorBase.length === 0) {
                        const indicadorHtml = `
                            <div id="indicador-prescricao-base" class="alert alert-info d-flex align-items-center mb-3" role="alert">
                                <i class="fas fa-info-circle me-2"></i>
                                <div>
                                    <strong>Prescrição Baseada:</strong> Os dados foram carregados de uma prescrição anterior. 
                                    Você pode modificar, adicionar ou remover itens conforme necessário.
                                </div>
                            </div>
                        `;
                        $('#modalNovaPrescricao .modal-body').prepend(indicadorHtml);
                    } else {
                        indicadorBase.show();
                    }
                    
                    console.log('Abrindo modal de nova prescrição...');
                    
                    // Mostrar modal de nova prescrição
                    $('#modalNovaPrescricao').modal('show');
                    
                    // Mostrar notificação de sucesso
                    mostrarNotificacaoSucesso('Prescrição carregada como base. Modifique conforme necessário.');
                    
                    console.log('Processo concluído com sucesso!');
                    
                }, 100);
                
            } else {
                console.error('Erro na resposta da API:', response);
                fecharLoadingModal();
                mostrarMensagemErro('Erro ao carregar prescrição base: ' + (response.error || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro na requisição AJAX:', {xhr, status, error});
            fecharLoadingModal();
            
            if (status === 'timeout') {
                mostrarMensagemErro('Tempo esgotado ao carregar prescrição. Tente novamente.');
            } else {
                mostrarMensagemErro('Erro ao carregar prescrição base. Tente novamente.');
            }
        }
    });
}

// Função para mostrar notificação de sucesso mais discreta
function mostrarNotificacaoSucesso(mensagem) {
    const toastHtml = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="toastSucesso" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong class="me-auto">Sucesso</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${mensagem}
                </div>
            </div>
        </div>
    `;
    
    // Remover toast anterior se existir
    $('.toast-container').remove();
    
    // Adicionar novo toast
    $('body').append(toastHtml);
    
    // Mostrar toast
    const toast = new bootstrap.Toast(document.getElementById('toastSucesso'));
    toast.show();
}

// Função para carregar prescrições
async function carregarPrescricoes() {
    try {
        const internacaoId = window.internacaoId || parseInt(document.getElementById('atendimento_id').value, 10);
        console.log('Carregando prescrições para internacaoId:', internacaoId);
        
        if (!internacaoId || isNaN(internacaoId)) {
            console.error('ID de internação inválido:', internacaoId);
            $('#listaPrescricoes').html('<div class="alert alert-danger">Erro: ID de internação inválido</div>');
            return;
        }
        
        // Mostrar indicador de carregamento
        $('#listaPrescricoes').html('<div class="text-center p-3"><i class="fas fa-spinner fa-spin me-2"></i> Carregando prescrições...</div>');
        
        // Adicionar um pequeno atraso para garantir que o DOM esteja pronto
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const url = `/api/prescricoes/${internacaoId}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao carregar prescrições');
        }
        
        if (!data.prescricoes || data.prescricoes.length === 0) {
            $('#listaPrescricoes').html('<div class="alert alert-info">Nenhuma prescrição encontrada.</div>');
            return;
        }
        
        // Ordenar prescrições por data (mais recentes primeiro)
        data.prescricoes.sort((a, b) => {
            // Tentar diferentes campos de data para garantir ordenação correta
            const dataA = new Date(a.horario_prescricao || a.data_prescricao || a.created_at);
            const dataB = new Date(b.horario_prescricao || b.data_prescricao || b.created_at);
            
            // Se as datas são válidas, ordernar do mais recente para o mais antigo
            if (!isNaN(dataA.getTime()) && !isNaN(dataB.getTime())) {
                return dataB.getTime() - dataA.getTime();
            }
            
            // Se uma das datas é inválida, colocar a válida primeiro
            if (!isNaN(dataA.getTime()) && isNaN(dataB.getTime())) return -1;
            if (isNaN(dataA.getTime()) && !isNaN(dataB.getTime())) return 1;
            
            // Se ambas são inválidas, manter ordem original (por ID decrescente)
            return b.id - a.id;
        });
        
        console.log(`Renderizando ${data.prescricoes.length} prescrições ordenadas por data`);
        
        // Renderizar todas as prescrições em ordem cronológica
        const htmlPrescricoes = data.prescricoes.map(prescricao => renderizarPrescricao(prescricao)).join('');
        $('#listaPrescricoes').html(htmlPrescricoes);
        
        console.log('Prescrições carregadas com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar prescrições:', error);
        $('#listaPrescricoes').html('<div class="alert alert-danger">Erro ao carregar prescrições. Por favor, tente novamente.</div>');
    }
}

// Função para editar prescrição
function editarPrescricao(prescricaoId) {
    // Limpar o formulário primeiro
    limparFormularioPrescricao();
    
    // Buscar os dados da prescrição específica
    $.ajax({
        url: `/api/prescricoes/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.prescricoes) {
                // Encontrar a prescrição pelo ID
                const prescricao = response.prescricoes.find(p => p.id == prescricaoId);
                
                if (prescricao) {
                    console.log("Editando prescrição:", prescricao);
                    
                    // Preencher o formulário com os dados da prescrição
                    $('#prescricao_id').val(prescricao.id);
                    $('#texto_dieta').val(prescricao.texto_dieta || '');
                    $('#texto_procedimento_medico').val(prescricao.texto_procedimento_medico || '');
                    $('#texto_procedimento_multi').val(prescricao.texto_procedimento_multi || '');
                    
                    // Limpar a lista atual de medicamentos
                    medicamentosAdicionados = [];
                    
                    // Adicionar medicamentos da prescrição na lista
                    if (prescricao.medicamentos && prescricao.medicamentos.length > 0) {
                        prescricao.medicamentos.forEach(med => {
                            medicamentosAdicionados.push({
                                nome_medicamento: med.nome_medicamento,
                                descricao_uso: med.descricao_uso
                            });
                        });
                        
                        // Atualizar a tabela de medicamentos
                        atualizarTabelaMedicamentos();
                    }
                    
                    // Alterar o título do modal
                    $('#modalPrescricaoLabel').text('Editar Prescrição');
                    
                    // Abrir o modal
                    $('#modalPrescricao').modal('show');
                } else {
                    alert('Prescrição não encontrada.');
                }
            } else {
                alert('Erro ao buscar dados da prescrição: ' + (response.error || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar dados da prescrição:', xhr.responseText);
            alert('Erro de comunicação ao buscar dados da prescrição: ' + error);
        }
    });
}

// Visualizar aprazamentos (placeholder)
function visualizarAprazamentos(medicamento) {
    alert(`Funcionalidade de visualização de aprazamentos para "${medicamento}" em desenvolvimento.`);
}

// Inicializar módulo de prescrições
function inicializarModuloPrescrições() {
    // Verificar se estamos na página correta
    if (!document.getElementById('btn_adicionar_medicamento') && !document.getElementById('formPrescricao')) return;
    
    console.log('Inicializando módulo de prescrições');
    
    // Evento para adicionar medicamento
    $(document).on('click', '#btn_adicionar_medicamento', function(e) {
        e.preventDefault(); // Previne o comportamento padrão do botão
        e.stopPropagation(); // Impede a propagação do evento
        
        const nome_medicamento = $('#nome_medicamento').val().trim();
        const descricao_uso = $('#descricao_uso').val().trim();
        
        if (!nome_medicamento || !descricao_uso) {
            alert('Por favor, preencha o nome do medicamento e a descrição de uso.');
            return;
        }
        
        window.medicamentosAdicionados.push({
            nome_medicamento: nome_medicamento,
            descricao_uso: descricao_uso
        });
        
        // Limpar campos
        $('#nome_medicamento').val('');
        $('#descricao_uso').val('');
        
        // Atualizar tabela
        atualizarTabelaMedicamentos();
        
        // Focar no campo de nome do medicamento
        $('#nome_medicamento').focus();
    });
    
    // Adicionar listeners para eventos de carregamento de prescrições
    $(document).on('click', 'a.nav-link[href="#prescricaoSection"]', function() {
        console.log('Clique na aba de prescrições detectado');
        carregarPrescricoes();
    });

    $(document).on('click', '.fa-pills', function() {
        console.log('Clique no ícone de pílulas detectado');
        carregarPrescricoes();
    });
    
    // Submissão do formulário de prescrição
    $(document).on('submit', '#formPrescricao', function(e) {
        e.preventDefault();
        
        // Verificar se é uma nova prescrição ou uma edição
        const prescricaoId = $('#prescricao_id').val();
        const isEdicao = prescricaoId !== "";
        
        const texto_dieta = $('#texto_dieta').val().trim();
        const texto_procedimento_medico = $('#texto_procedimento_medico').val().trim();
        const texto_procedimento_multi = $('#texto_procedimento_multi').val().trim();
        
        // Verificar se ao menos algo foi preenchido (dieta, procedimentos ou medicamentos)
        if (!texto_dieta && !texto_procedimento_medico && !texto_procedimento_multi && medicamentosAdicionados.length === 0) {
            alert('Por favor, preencha pelo menos um dos campos da prescrição ou adicione ao menos um medicamento.');
            return;
        }
        
        // Obter horário atual formatado para o Brasil
        const dataAtual = new Date();
        const horarioBrasil = dataAtual.toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        // Log para debug do horário
        console.log('Horário formatado para Brasil:', horarioBrasil);
        
        // Preparar dados para envio
        let dados = {
            atendimentos_clinica_id: isNaN(internacaoId) ? null : internacaoId,
            medico_id: parseInt($('#user_id').val() || '0', 10),
            funcionario_id: parseInt($('#user_id').val() || '0', 10),
            texto_dieta: texto_dieta || null,
            texto_procedimento_medico: texto_procedimento_medico || null,
            texto_procedimento_multi: texto_procedimento_multi || null,
            horario_prescricao: horarioBrasil,
            medicamentos: medicamentosAdicionados
        };
        
        // Log para debug
        console.log('Dados da prescrição:', dados);
        
        if (!dados.atendimentos_clinica_id) {
            alert('Erro: ID da internação inválido.');
            return;
        }
        
        // URL e método dependem se é edição ou nova prescrição
        const url = isEdicao ? `/api/prescricoes/${prescricaoId}` : '/api/prescricoes';
        const method = isEdicao ? 'PUT' : 'POST';
        
        // Mostrar indicador de carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
        btnSubmit.prop('disabled', true);
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function(response) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                if (response.success) {
                    // Fechar modal e limpar campos
                    $('#modalPrescricao').modal('hide');
                    limparFormularioPrescricao();
                    
                    // Recarregar lista de prescrições
                    carregarPrescricoes();
                    
                    // Mostrar mensagem de sucesso
                    alert(isEdicao ? 'Prescrição atualizada com sucesso!' : 'Prescrição registrada com sucesso!');
                } else {
                    alert('Erro ao registrar prescrição: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function(xhr, status, error) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                console.error('Erro ao registrar prescrição:', xhr.responseText);
                alert('Erro de comunicação ao tentar registrar prescrição: ' + (xhr.responseJSON?.error || error));
            }
        });
    });
    
    // Adicionar evento de tecla para os campos de medicamento
    $(document).on('keypress', '#nome_medicamento, #descricao_uso', function(e) {
        // Se pressionar Enter
        if (e.which === 13) {
            e.preventDefault(); // Previne o comportamento padrão
            // Se estiver no campo nome, vai para descrição
            if ($(this).attr('id') === 'nome_medicamento') {
                $('#descricao_uso').focus();
            } else {
                // Se estiver na descrição, aciona o botão adicionar
                $('#btn_adicionar_medicamento').click();
            }
        }
    });
    
    // Prevenir submissão do formulário ao pressionar Enter
    $(document).on('submit', '#formPrescricao', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Inicializar tabela de medicamentos
    atualizarTabelaMedicamentos();
    
    // Configurar toggles para mostrar/ocultar prescrições antigas
    $(document).on('click', '#toggle-prescricoes-antigas', function() {
        const container = $('#antigas-container-prescricao');
        if (container.is(':visible')) {
            container.hide();
            $('#toggle-prescricoes-text').text('Mostrar Antigas');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            container.show();
            $('#toggle-prescricoes-text').text('Ocultar Antigas');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });
}

// ======== FUNÇÕES PARA GERENCIAMENTO DE EVOLUÇÃO ========

// Função para carregar evoluções da internação
function carregarEvolucoes() {
    const internacaoId = window.internacaoId || parseInt(document.getElementById('atendimento_id').value, 10);
    console.log('Carregando evoluções para internacaoId:', internacaoId);
    
    if (!internacaoId || isNaN(internacaoId)) {
        console.error('ID de internação inválido ao carregar evoluções:', internacaoId);
        $('#listaEvolucoes').html('<tr><td colspan="4" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    $.ajax({
        url: `/api/evolucoes/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API de evoluções:', response);
            const tabela = $('#listaEvolucoes');
            tabela.empty();
            
            if (response.success && response.evolucoes && response.evolucoes.length > 0) {
                response.evolucoes.forEach(ev => {
                    // Permitir renderização de HTML
                    const evolucaoHtml = ev.evolucao || '---';
                    // USAR CONVERSÃO FORÇADA PARA HORÁRIO BRASILEIRO
                    const dataFormatada = forcarHorarioBrasileiro(ev.data_evolucao);

                    tabela.append(`
                        <tr>
                            <td><span class="horario-convertido">${dataFormatada}</span></td>
                            <td>${ev.nome_medico || '---'}</td>
                            <td>
                                <div class="texto-evolucao" data-evolucao-id="${ev.id}">
                                    ${evolucaoHtml}
                                </div>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-print-discreto btn-verde" onclick="imprimirEvolucao(${ev.id})" title="Imprimir Evolução">
                                    <i class="fas fa-print"></i>
                                </button>
                            </td>
                        </tr>
                    `);
                });
                
                // Calcular o número de linhas e aplicar o atributo data-lines
                setTimeout(() => {
                    $('.texto-evolucao').each(function() {
                        const texto = $(this).text();
                        const linhas = texto.split(/\r\n|\r|\n/).length;
                        const palavras = texto.split(/\s+/).length;
                        
                        // Estimar o número de linhas com base no tamanho do texto
                        let estimativaLinhas = Math.max(linhas, Math.ceil(palavras / 15));
                        
                        // Limitar a no máximo 22 para não criar muitas regras CSS
                        estimativaLinhas = Math.min(estimativaLinhas, 22);
                        
                        // Aplicar o atributo data-lines ao elemento
                        $(this).attr('data-lines', estimativaLinhas);
                        
                        console.log(`Evolução com ${linhas} linhas e ${palavras} palavras. Estimativa: ${estimativaLinhas}`);
                    });
                }, 100);
            } else {
                tabela.html('<tr><td colspan="4" class="text-center">Nenhuma evolução registrada até o momento.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções:', xhr.responseText);
            $('#listaEvolucoes').html('<tr><td colspan="4" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
        }
    });
}

// Submissão do formulário de evolução
$(document).on('submit', '#formEvolucao', function(e) {
    e.preventDefault();
    
    // Obter o conteúdo do editor - VERSÃO CORRIGIDA
    let evolucaoHTML;
    
    // Tentar múltiplas formas de obter o conteúdo
    if (window.quill && window.quill.root) {
        evolucaoHTML = window.quill.root.innerHTML;
    } else if (window.QuillEvolucao && window.QuillEvolucao.root) {
        evolucaoHTML = window.QuillEvolucao.root.innerHTML;
    } else if (typeof quill !== 'undefined' && quill && quill.root) {
        evolucaoHTML = quill.root.innerHTML;
    } else if ($('#fallback-evolucao').length > 0) {
        evolucaoHTML = $('#fallback-evolucao').val();
    } else if ($('#fallback-editor').length > 0) {
        evolucaoHTML = $('#fallback-editor').val();
    } else {
        evolucaoHTML = $('#texto_evolucao').val();
    }
    
    if (!evolucaoHTML || evolucaoHTML.trim() === '' || evolucaoHTML === '<p><br></p>') {
        alert('Por favor, preencha o texto da evolução.');
        return;
    }
    
    // Mostrar indicador de carregamento
    const btnSubmit = $(this).find('button[type="submit"]');
    const textoOriginal = btnSubmit.html();
    btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
    btnSubmit.prop('disabled', true);
    
    // Preparar dados para envio
    const internacaoId = window.internacaoId || parseInt(document.getElementById('atendimento_id').value, 10);
    const dados = {
        atendimentos_clinica_id: internacaoId,
        funcionario_id: parseInt($('#user_id').val() || '0', 10),
        evolucao: evolucaoHTML,
        data_evolucao: new Date().toISOString(),
        tipo: 'medica'
    };
    
    // Log para debug
    console.log('Dados da evolução:', dados);
    
    $.ajax({
        url: '/api/evolucoes/registrar',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            if (response.success) {
                // Fechar modal e limpar campos
                $('#modalEvolucao').modal('hide');
                
                // Limpar o editor - VERSÃO CORRIGIDA
                if (window.quill && window.quill.setText) {
                    window.quill.setText('');
                } else if (window.QuillEvolucao && window.QuillEvolucao.setText) {
                    window.QuillEvolucao.setText('');
                } else if (typeof quill !== 'undefined' && quill && quill.setText) {
                    quill.setText('');
                } else if ($('#fallback-evolucao').length > 0) {
                    $('#fallback-evolucao').val('');
                } else if ($('#fallback-editor').length > 0) {
                    $('#fallback-editor').val('');
                }
                
                // Recarregar lista de evoluções
                carregarEvolucoes();
                
                // Mostrar mensagem de sucesso
                alert('Evolução registrada com sucesso!');
            } else {
                alert('Erro ao registrar evolução: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            console.error('Erro ao registrar evolução:', xhr.responseText);
            alert('Erro de comunicação ao tentar registrar evolução: ' + (xhr.responseJSON?.error || error));
        }
    });
});

// ======== FUNÇÕES PARA EXIBIÇÃO DE DADOS DE ENFERMAGEM ========

// Funções para carregar dados de enfermagem
function carregarEvolucoesEnfermagem() {
    const internacaoId = window.internacaoId || parseInt(document.getElementById('atendimento_id').value, 10);
    
    if (!internacaoId || isNaN(internacaoId)) {
        console.error('ID de internação inválido ao carregar evoluções de enfermagem:', internacaoId);
        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    $.ajax({
        url: `/api/enfermagem/evolucao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            // Separar evoluções de hoje e anteriores
            const hoje = new Date().toISOString().split('T')[0];
            const evolucoesDoDia = [];
            const evolucoesAntigas = [];
            
            if (Array.isArray(response)) {
                response.forEach(ev => {
                    const dataEvolucao = new Date(ev.data_evolucao).toISOString().split('T')[0];
                    if (dataEvolucao === hoje) {
                        evolucoesDoDia.push(ev);
                    } else {
                        evolucoesAntigas.push(ev);
                    }
                });
                
                // Atualizar contador
                $('#contador-evolucoes-antigas').text(evolucoesAntigas.length);
                
                // Renderizar evoluções do dia
                if (evolucoesDoDia.length > 0) {
                    let htmlDoDia = '';
                    evolucoesDoDia.forEach(ev => {
                        // USAR CONVERSÃO FORÇADA PARA HORÁRIO BRASILEIRO
                        const hora = forcarHoraBrasileira(ev.data_evolucao);
                        
                        htmlDoDia += `
                            <tr>
                                <td><span class="horario-convertido">${hora}</span></td>
                                <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                                <td>
                                    <div class="texto-evolucao">
                                        ${ev.texto || '---'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    $('#listaEvolucoesDoDia').html(htmlDoDia);
                } else {
                    $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada hoje.</td></tr>');
                }
                
                // Renderizar evoluções antigas
                if (evolucoesAntigas.length > 0) {
                    let htmlAntigas = '';
                    evolucoesAntigas.forEach(ev => {
                        const dataFormatada = new Date(ev.data_evolucao).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                        const hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        htmlAntigas += `
                            <tr>
                                <td>${dataFormatada} ${hora}</td>
                                <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                                <td>
                                    <div class="texto-evolucao">
                                        ${ev.texto || '---'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    $('#listaEvolucoesAntigas').html(htmlAntigas);
                    
                    // Inicialmente ocultar o container de evoluções antigas
                    $('#antigas-container').hide();
                    $('#toggle-evolucoes-text').text('Mostrar Antigas');
                    $('#toggle-evolucoes-antigas').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
                } else {
                    $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                }
            } else {
                $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada hoje.</td></tr>');
                $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções de enfermagem:', xhr.responseText);
            $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
            $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
        }
    });
}

function carregarPrescricoesEnfermagem() {
    const internacaoId = window.internacaoId || parseInt(document.getElementById('atendimento_id').value, 10);
    
    if (!internacaoId || isNaN(internacaoId)) {
        console.error('ID de internação inválido ao carregar prescrições de enfermagem:', internacaoId);
        $('#listaPrescricoesEnfermagemDoDia').html('<div class="alert alert-danger">Erro: ID de internação inválido</div>');
        return;
    }
    
    $.ajax({
        url: `/api/enfermagem/prescricao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            // Separar prescrições de hoje e antigas
            const hoje = new Date().toLocaleDateString('pt-BR');
            const prescricoesHoje = [];
            const prescricoesAntigas = [];
            
            if (Array.isArray(response)) {
                response.forEach(prescricao => {
                    const dataPrescricao = new Date(prescricao.data_prescricao).toLocaleDateString('pt-BR');
                    if (dataPrescricao === hoje) {
                        prescricoesHoje.push(prescricao);
                    } else {
                        prescricoesAntigas.push(prescricao);
                    }
                });
            }
            
            // Renderizar prescrições de enfermagem de hoje
            if (prescricoesHoje.length > 0) {
                let htmlHoje = '';
                prescricoesHoje.forEach(presc => {
                    const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    htmlHoje += `
                        <div class="prescricao-container">
                            <div class="prescricao-header">
                                <div class="enfermeiro-info">Enf. ${presc.enfermeiro_nome || 'Não informado'}</div>
                                <div class="timestamp">${hora}</div>
                            </div>
                            <div class="prescricao-section">
                                <div class="prescricao-section-content">
                                    ${presc.texto || '---'}
                                </div>
                            </div>
                        </div>
                    `;
                });
                $('#listaPrescricoesEnfermagemDoDia').html(htmlHoje);
            } else {
                $('#listaPrescricoesEnfermagemDoDia').html('<div class="alert alert-info">Nenhuma prescrição de enfermagem registrada hoje.</div>');
            }
            
            // Renderizar prescrições de enfermagem antigas
            if (prescricoesAntigas.length > 0) {
                let htmlAntigas = '';
                prescricoesAntigas.forEach(presc => {
                    const dataFormatada = new Date(presc.data_prescricao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    htmlAntigas += `
                        <div class="prescricao-container">
                            <div class="prescricao-header">
                                <div class="enfermeiro-info">Enf. ${presc.enfermeiro_nome || 'Não informado'}</div>
                                <div class="timestamp">${dataFormatada} ${hora}</div>
                            </div>
                            <div class="prescricao-section">
                                <div class="prescricao-section-content">
                                    ${presc.texto || '---'}
                                </div>
                            </div>
                        </div>
                    `;
                });
                $('#listaPrescricoesEnfermagemAntigas').html(htmlAntigas);
                $('#contador-prescricoes-enfermagem-antigas').text(prescricoesAntigas.length);
            } else {
                $('#listaPrescricoesEnfermagemAntigas').html('<div class="alert alert-info">Nenhuma prescrição de enfermagem anterior registrada.</div>');
                $('#contador-prescricoes-enfermagem-antigas').text('0');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar prescrições de enfermagem:', error);
            $('#listaPrescricoesEnfermagemDoDia').html('<div class="alert alert-danger">Erro ao carregar prescrições de enfermagem.</div>');
            $('#listaPrescricoesEnfermagemAntigas').html('<div class="alert alert-danger">Erro ao carregar prescrições de enfermagem.</div>');
        }
    });
}

// Configurar toggles para mostrar/ocultar evoluções antigas
jQuery(document).on('click', '#toggle-evolucoes-antigas', function() {
    const container = jQuery('#antigas-container');
    const toggleText = jQuery('#toggle-evolucoes-text');
    const toggleIcon = jQuery(this).find('i');
    
    if (container.is(':visible')) {
        container.hide();
        toggleText.text('Mostrar Antigas');
        toggleIcon.removeClass('fa-eye-slash').addClass('fa-eye');
    } else {
        container.show();
        toggleText.text('Ocultar Antigas');
        toggleIcon.removeClass('fa-eye').addClass('fa-eye-slash');
    }
});

// Função para filtrar evoluções de enfermagem por data
function filtrarEvolucoesEnfermagemPorData(dataFiltro) {
    if (!dataFiltro) {
        carregarEvolucoesEnfermagem();
        return;
    }
    
    const internacaoId = window.internacaoId || parseInt(document.getElementById('atendimento_id').value, 10);
    jQuery('#titulo-evolucoes-hoje').text(`Evoluções de ${dataFiltro.split('-').reverse().join('/')}`);
    jQuery('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Carregando evoluções...</td></tr>');
    jQuery('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Dados não disponíveis com filtro ativo</td></tr>');
    
    jQuery.ajax({
        url: `/api/enfermagem/evolucao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            // Filtrar evoluções pela data especificada
            const evolucoesFiltradas = [];
            
            if (Array.isArray(response)) {
                response.forEach(ev => {
                    const dataEvolucao = new Date(ev.data_evolucao).toISOString().split('T')[0];
                    if (dataEvolucao === dataFiltro) {
                        evolucoesFiltradas.push(ev);
                    }
                });
                
                // Renderizar evoluções filtradas
                if (evolucoesFiltradas.length > 0) {
                    let htmlFiltradas = '';
                    evolucoesFiltradas.forEach(ev => {
                        const hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        htmlFiltradas += `
                            <tr>
                                <td>${hora}</td>
                                <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                                <td>
                                    <div class="texto-evolucao">
                                        ${ev.texto || '---'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    jQuery('#listaEvolucoesDoDia').html(htmlFiltradas);
                } else {
                    jQuery('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução encontrada nesta data.</td></tr>');
                }
            } else {
                jQuery('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução encontrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao filtrar evoluções de enfermagem:', xhr.responseText);
            jQuery('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
        }
    });
}

// Função para filtrar prescrições de enfermagem por data
function filtrarPrescricoesEnfermagemPorData(dataFiltro) {
    if (!dataFiltro) {
        carregarPrescricoesEnfermagem();
        return;
    }
    
    const internacaoId = window.internacaoId || parseInt(document.getElementById('atendimento_id').value, 10);
    jQuery('#titulo-prescricoes-hoje').text(`Prescrições de ${dataFiltro.split('-').reverse().join('/')}`);
    jQuery('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Carregando prescrições...</td></tr>');
    jQuery('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Dados não disponíveis com filtro ativo</td></tr>');
    
    jQuery.ajax({
        url: `/api/medico/prescricoes-enfermagem/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            // Filtrar prescrições pela data especificada
            const prescricoesFiltradas = [];
            
            if (response.success && response.prescricoes && response.prescricoes.length > 0) {
                response.prescricoes.forEach(presc => {
                    const dataPrescricao = new Date(presc.data_prescricao).toISOString().split('T')[0];
                    if (dataPrescricao === dataFiltro) {
                        prescricoesFiltradas.push(presc);
                    }
                });
                
                // Renderizar prescrições filtradas
                if (prescricoesFiltradas.length > 0) {
                    let htmlFiltradas = '';
                    prescricoesFiltradas.forEach(presc => {
                        const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        htmlFiltradas += `
                            <tr>
                                <td>${hora}</td>
                                <td>${presc.enfermeiro_nome || 'Não informado'}</td>
                                <td>
                                    <div class="texto-evolucao">
                                        ${presc.texto || '---'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    jQuery('#listaPrescricoesDoDia').html(htmlFiltradas);
                } else {
                    jQuery('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada nesta data.</td></tr>');
                }
            } else {
                jQuery('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao filtrar prescrições de enfermagem:', xhr.responseText);
            jQuery('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições.</td></tr>');
        }
    });
}

// Função para carregar dados da SAE
function carregarHistoricoSAE() {
    const pacienteId = parseInt(jQuery('#paciente_id').val() || '0', 10);
    jQuery('#listaHistoricoSAE').html('<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando histórico completo...</p>');
    
    jQuery.ajax({
        url: `/api/enfermagem/sae/historico/${pacienteId}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.sae && response.sae.length > 0) {
                let html = '';
                
                // Ordenar por data (mais recente primeiro)
                const saeOrdenado = response.sae.sort((a, b) => {
                    return new Date(b.data_registro) - new Date(a.data_registro);
                });
                
                // Processar cada registro SAE
                saeOrdenado.forEach((sae, index) => {
                    // Pular o primeiro registro se o histórico estiver sendo exibido junto com o registro atual
                    if (index === 0 && jQuery('#listaSAE').html().includes(new Date(sae.data_registro).toLocaleDateString('pt-BR'))) {
                        return;
                    }
                    
                    const dataRegistro = new Date(sae.data_registro);
                    
                    html += `
                        <div class="card mb-3 border-secondary">
                            <div class="card-header bg-light">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div><strong>Data do Registro:</strong> ${dataRegistro.toLocaleDateString('pt-BR')}</div>
                                    <div>
                                        <span class="badge bg-secondary">Registro Anterior</span>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="accordion" id="accordionSAE${index}">
                                    <div class="accordion-item">
                                        <h2 class="accordion-header">
                                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSAE${index}">
                                                Ver detalhes deste registro SAE
                                            </button>
                                        </h2>
                                        <div id="collapseSAE${index}" class="accordion-collapse collapse">
                                            <div class="accordion-body">
                                                <div class="row mb-3">
                                                    <div class="col-md-12">
                                                        <h6 class="text-primary mb-2">Sinais Vitais</h6>
                                                        <div class="row g-2">
                                                            <div class="col-md-2"><strong>PA:</strong> ${sae.pa}</div>
                                                            <div class="col-md-2"><strong>FC:</strong> ${sae.fc}</div>
                                                            <div class="col-md-2"><strong>SAT:</strong> ${sae.sat}</div>
                                                            <div class="col-md-2"><strong>R:</strong> ${sae.r}</div>
                                                            <div class="col-md-2"><strong>T:</strong> ${sae.t}</div>
                                                            <div class="col-md-2"><strong>Pulso:</strong> ${sae.pulso}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="row mb-3">
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Hipótese Diagnóstica</h6>
                                                        <div class="p-2 bg-light rounded">${sae.hipotese_diagnostica}</div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">DX</h6>
                                                        <div class="p-2 bg-light rounded">${sae.dx}</div>
                                                    </div>
                                                </div>
                                                
                                                <div class="row mb-3">
                                                    <div class="col-md-12">
                                                        <h6 class="text-primary mb-2">Medicação</h6>
                                                        <div class="p-2 bg-light rounded">${sae.medicacao}</div>
                                                    </div>
                                                </div>
                                                
                                                <div class="row mb-3">
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Alergias</h6>
                                                        <div class="p-2 bg-light rounded">${sae.alergias}</div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Antecedentes Pessoais</h6>
                                                        <div class="p-2 bg-light rounded">${sae.antecedentes_pessoais}</div>
                                                    </div>
                                                </div>
                                                
                                                <div class="row mb-3">
                                                    <div class="col-md-12">
                                                        <h6 class="text-primary mb-2">Diagnóstico de Enfermagem</h6>
                                                        <div class="p-2 bg-light rounded">${sae.diagnostico_de_enfermagem}</div>
                                                    </div>
                                                </div>
                                                
                                                <div class="row mb-3">
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Sistema Neurológico</h6>
                                                        <div class="p-2 bg-light rounded">${sae.sistema_neurologico}</div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Estado Geral</h6>
                                                        <div class="p-2 bg-light rounded">${sae.estado_geral}</div>
                                                    </div>
                                                </div>
                                                
                                                <div class="row mb-3">
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Ventilação</h6>
                                                        <div class="p-2 bg-light rounded">${sae.ventilacao}</div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Pele</h6>
                                                        <div class="p-2 bg-light rounded">${sae.pele}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                if (html === '') {
                    jQuery('#listaHistoricoSAE').html('<div class="alert alert-info">Não há registros SAE adicionais para este paciente.</div>');
                } else {
                    jQuery('#listaHistoricoSAE').html(html);
                }
            } else {
                jQuery('#listaHistoricoSAE').html('<div class="alert alert-info">Nenhum registro SAE anterior encontrado para este paciente.</div>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar histórico SAE:', xhr.responseText);
            // Mostrar mensagem genérica em vez da mensagem de erro específica
            jQuery('#listaHistoricoSAE').html('<div class="alert alert-info">Nenhum histórico de SAE disponível para este paciente.</div>');
        }
    });
}

// Função para inicializar o módulo de exames
function inicializarModuloExames() {
    console.log("Inicializando módulo de exames...");
    // Implementação do módulo de exames será adicionada posteriormente
    // Por enquanto, apenas mantemos a função para evitar erros
}

// Corrigir declarações de variáveis para Quill - usar variáveis globais
// Se as variáveis já existirem no escopo global, não as redeclararemos
if (typeof window.quillAtestado === 'undefined') window.quillAtestado = null;
if (typeof window.quillReceita === 'undefined') window.quillReceita = null;

/**
 * Corrige o formato do texto de aprazamento para um formato padronizado
 * @param {string} textoOriginal - O texto original de aprazamento
 * @returns {string} - O texto formatado
 */
function corrigirFormatoAprazamento(textoOriginal) {
    console.log('Corrigindo formato do aprazamento:', textoOriginal);
    
    if (!textoOriginal) return "";
    
    // Converter para string se necessário
    let texto = String(textoOriginal);
    
    // Remover os "undefined/undefined/"
    texto = texto.replace(/undefined\/undefined\//g, '');
    
    // Remover qualquer outro "undefined"
    texto = texto.replace(/undefined/g, '');
    
    // Normalizar separadores
    texto = texto
        .replace(/(?:\r\n|\r|\n)/g, '; ') // Quebras de linha para ponto-e-vírgula
        .replace(/\s*;\s*/g, '; ')        // Normaliza espaços em torno de ponto-e-vírgula
        .replace(/\s*:\s*/g, ':')         // Remove espaços em torno de dois-pontos
        .replace(/;+/g, ';')              // Remove ponto-e-vírgula duplicados
        .replace(/:+/g, ':')              // Remove dois-pontos duplicados
        .replace(/\s+/g, ' ')             // Normaliza múltiplos espaços
        .trim();
        
    // Separa as diferentes datas (formato esperado: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM")
    const secoes = texto.split(';').filter(s => s.trim());
    
    if (secoes.length === 0) {
        console.warn('Nenhuma seção válida encontrada no texto:', texto);
        return "";
    }
    
    // Processar cada seção para garantir o formato correto
    const secoesFormatadas = secoes.map(secao => {
        secao = secao.trim();
        
        // Verificar se a seção tem uma data e horários
        const match = secao.match(/(\d{2})\/(\d{2})\/(\d{4})[^0-9]*(.+)/);
        if (!match) {
            console.warn('Seção não corresponde ao padrão esperado:', secao);
            return null;
        }
        
        const [_, dia, mes, ano, resto] = match;
        
        // Extrair os horários - Comportamento especial para formato com espaço entre horas e minutos "HH: MM"
        // Primeiro, substituir "hh: mm" por "hh:mm" para normalizar
        let restoCorrigido = resto.replace(/(\d{2})\s*:\s*(\d{2})/g, '$1:$2');
        
        // Agora extrair horários normalmente
        const matchHorarios = restoCorrigido.match(/(\d{2}:\d{2})/g);
        
        if (matchHorarios && matchHorarios.length > 0) {
            const horarios = matchHorarios;
            
            // Formatar corretamente: DD/MM/YYYY: HH:MM, HH:MM
            return `${dia}/${mes}/${ano}: ${horarios.join(', ')}`;
        } else {
            console.warn('Não foi possível extrair horários da seção:', secao);
            
            // Tentar uma abordagem alternativa para horários no formato "hh: mm"
            // Este é um formato incorreto mas pode estar aparecendo nos dados
            const formatoAlternativo = resto.match(/(\d{2})\s*:\s*(\d{2})/g);
            if (formatoAlternativo && formatoAlternativo.length > 0) {
                // Normalizar o formato dos horários encontrados
                const horariosCorrigidos = formatoAlternativo.map(h => {
                    const [hora, minuto] = h.replace(/\s+/g, '').split(':');
                    return `${hora}:${minuto}`;
                });
                
                return `${dia}/${mes}/${ano}: ${horariosCorrigidos.join(', ')}`;
            }
            
            return null;
        }
    }).filter(s => s !== null);
    
    if (secoesFormatadas.length === 0) {
        console.warn('Nenhuma seção pôde ser formatada corretamente');
        return "";
    }
    
    // Juntar as seções no formato final
    return secoesFormatadas.join('; ');
}

/**
 * Inicializa o modal de calendário de aprazamento
 * @param {string} textoAprazamento - O texto de aprazamento formatado
 * @param {string} titulo - O título do modal
 */
function inicializarModalCalendarioAprazamento(textoAprazamento, titulo) {
    // Verificar se o modal já existe, caso contrário criar
    if ($('#modalCalendarioAprazamento').length === 0) {
        // Criar o modal e adicionar ao corpo do documento
        const htmlModal = `
            <div class="modal fade" id="modalCalendarioAprazamento" tabindex="-1" aria-labelledby="modalCalendarioAprazamentoLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="modalCalendarioAprazamentoLabel">Calendário de Aprazamento</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body">
                            <div id="conteudoCalendarioAprazamento">
                                <div class="text-center">
                                    <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                                    <p>Carregando horários...</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(htmlModal);
    }
    
    // Atualizar o título do modal
    $('#modalCalendarioAprazamentoLabel').text('Calendário de Aprazamento: ' + titulo);
    
    // Processar os dados e gerar o HTML do calendário
    const calendario = gerarHTMLCalendarioAprazamento(textoAprazamento);
    
    // Atualizar o conteúdo do modal
    $('#conteudoCalendarioAprazamento').html(calendario);
    
    // Abrir o modal
    const modalCalendario = new bootstrap.Modal(document.getElementById('modalCalendarioAprazamento'));
    modalCalendario.show();
}

/**
 * Gera o HTML do calendário de aprazamento
 * @param {string} textoAprazamento - O texto de aprazamento formatado
 * @returns {string} - O HTML do calendário
 */
function gerarHTMLCalendarioAprazamento(textoAprazamento) {
    console.log('Gerando HTML do calendário para:', textoAprazamento);
    
    if (!textoAprazamento) {
        return '<div class="alert alert-warning">Nenhum horário de aprazamento encontrado.</div>';
    }
    
    // Separar os horários por data
    const datasAprazamento = {};
    
    // Processar cada linha com o formato "DD/MM/YYYY: HH:MM, HH:MM"
    textoAprazamento.split(';').forEach(linha => {
        linha = linha.trim();
        if (!linha) return;
        
        // Extrair a data e os horários
        const partes = linha.split(':');
        if (partes.length < 2) {
            console.warn('Formato inválido na linha:', linha);
            return;
        }
        
        const data = partes[0].trim();
        const horarios = partes.slice(1).join(':').split(',').map(h => h.trim());
        
        // Adicionar ao objeto agrupado por data
        if (!datasAprazamento[data]) {
            datasAprazamento[data] = [];
        }
        
        // Adicionar cada horário à data correspondente
        horarios.forEach(horario => {
            if (horario && horario.match(/\d{2}:\d{2}/)) {
                datasAprazamento[data].push(horario);
            }
        });
    });
    
    // Ordenar as datas
    const datasOrdenadas = Object.keys(datasAprazamento).sort((a, b) => {
        // Converter para o formato de data (assumindo DD/MM/YYYY)
        const [diaA, mesA, anoA] = a.split('/').map(n => parseInt(n, 10));
        const [diaB, mesB, anoB] = b.split('/').map(n => parseInt(n, 10));
        
        // Criar objetos Date para comparação
        const dataA = new Date(anoA, mesA - 1, diaA);
        const dataB = new Date(anoB, mesB - 1, diaB);
        
        return dataA - dataB;
    });
    
    // Verificar se há datas para exibir
    if (datasOrdenadas.length === 0) {
        return '<div class="alert alert-warning">Não foi possível interpretar os horários de aprazamento. Formato esperado: DD/MM/YYYY: HH:MM, HH:MM</div>';
    }
    
    // Gerar o HTML do calendário
    let html = '<div class="calendario-aprazamento">';
    
    // Adicionar cada data com seus horários
    datasOrdenadas.forEach(data => {
        // Converter a data para um objeto Date
        const [dia, mes, ano] = data.split('/').map(n => parseInt(n, 10));
        const objData = new Date(ano, mes - 1, dia);
        
        // Formatar a data de forma mais legível
        const dataFormatada = objData.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Verificar se a data é hoje
        const hoje = new Date();
        const ehHoje = objData.getDate() === hoje.getDate() && 
                      objData.getMonth() === hoje.getMonth() && 
                      objData.getFullYear() === hoje.getFullYear();
        
        // Estilo especial para a data de hoje
        const classeHoje = ehHoje ? 'bg-info text-white' : 'bg-light';
        const badgeHoje = ehHoje ? '<span class="badge bg-primary ms-2">Hoje</span>' : '';
        
        html += `
            <div class="card mb-3">
                <div class="card-header ${classeHoje}">
                    <strong>${dataFormatada}</strong>${badgeHoje}
                </div>
                <div class="card-body">
                    <div class="d-flex flex-wrap">
        `;
        
        // Ordenar os horários
        const horariosOrdenados = [...datasAprazamento[data]].sort();
        
        // Adicionar cada horário como um "pill"
        horariosOrdenados.forEach(horario => {
            // Verificar se o horário já passou
            const [hora, minuto] = horario.split(':').map(n => parseInt(n, 10));
            const dataHora = new Date(ano, mes - 1, dia, hora, minuto);
            const passou = dataHora < new Date();
            
            // Definir a classe baseada em se o horário já passou
            const classePill = passou ? 'bg-secondary' : 'bg-success';
            
            html += `<span class="badge ${classePill} me-2 mb-2 p-2">${horario}</span>`;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    return html;
}

// Exportar funções para uso global
window.corrigirFormatoAprazamento = corrigirFormatoAprazamento;
window.inicializarModalCalendarioAprazamento = inicializarModalCalendarioAprazamento;
window.gerarHTMLCalendarioAprazamento = gerarHTMLCalendarioAprazamento;

// Visualizar aprazamentos
async function visualizarAprazamentos(nomeMedicamento) {
    try {
        const response = await fetch(`/api/aprazamentos/atendimento/${window.ATENDIMENTO_ID}/medicamento/${encodeURIComponent(nomeMedicamento)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao buscar aprazamentos');
        }
        
        // Atualizar contadores
        let realizados = 0;
        let pendentes = 0;
        const tbody = document.getElementById('tabelaAprazamentos');
        tbody.innerHTML = '';
        
        data.aprazamentos.forEach(apr => {
            if (apr.realizado) realizados++;
            else pendentes++;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${apr.data_hora_aprazamento}</td>
                <td>
                    <span class="badge ${apr.realizado ? 'bg-success' : apr.atrasado ? 'bg-danger' : 'bg-warning'}">
                        ${apr.realizado ? 'Realizado' : apr.atrasado ? 'Atrasado' : 'Pendente'}
                    </span>
                </td>
                <td>${apr.enfermeiro_responsavel || '-'}</td>
                <td>${apr.data_realizacao || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Atualizar resumo
        document.getElementById('totalHorarios').textContent = data.aprazamentos.length;
        document.getElementById('totalRealizados').textContent = realizados;
        document.getElementById('totalPendentes').textContent = pendentes;
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalVisualizarAprazamento'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao visualizar aprazamentos:', error);
        alert('Erro ao carregar aprazamentos. Por favor, tente novamente.');
    }
}

// Função para inicializar o editor Quill principal
function inicializarEditorPrincipal() {
    const editorContainer = document.getElementById('editor-container');
    if (!editorContainer) return;
    
    try {
        // Verificar se já foi inicializado
        if (window.quill) {
            console.log('Editor principal já inicializado.');
            return;
        }
        
        // Verificar se Quill está disponível globalmente
        if (typeof Quill === 'undefined') {
            throw new Error('Biblioteca Quill não encontrada. Verifique se foi importada corretamente.');
        }
        
        // Inicializar o editor com configuração básica
        window.quill = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['clean']
                ]
            },
            placeholder: 'Digite o texto da evolução aqui...'
        });
        
        // Adicionar evento para atualizar campo oculto quando o conteúdo mudar
        window.quill.on('text-change', function() {
            const conteudo = window.quill.root.innerHTML;
            if (document.getElementById('texto_evolucao')) {
                document.getElementById('texto_evolucao').value = conteudo;
            }
        });
        
        // Configurar observadores para o editor
        setTimeout(() => {
            const editor = document.querySelector('#editor-container .ql-editor');
            if (editor) {
                configurarObservadoresModernos(editor);
            }
        }, 100);
        
        console.log('Editor principal inicializado com sucesso.');
    } catch (error) {
        console.error('Erro ao inicializar o editor Quill principal:', error);
        
        // Criar um fallback para o editor
        if (editorContainer) {
            editorContainer.innerHTML = '<textarea id="fallback-editor-principal" class="form-control" rows="10" placeholder="Digite o texto da evolução aqui..."></textarea>';
            
            // Atualizar o textarea oculto quando o fallback for alterado
            const fallbackEditor = document.getElementById('fallback-editor-principal');
            if (fallbackEditor) {
                fallbackEditor.addEventListener('input', function() {
                    const textoEvolucao = document.getElementById('texto_evolucao');
                    if (textoEvolucao) {
                        textoEvolucao.value = this.value;
                    }
                });
            }
        }
    }
}

// =================== FUNÇÕES HDA ===================
/**
 * Carrega a HDA da internação e atualiza os elementos na tela.
 */
function carregarHDA() {
    if (typeof internacaoId === 'undefined' || isNaN(internacaoId)) {
        console.warn('internacaoId indefinido ou inválido ao tentar carregar HDA');
        return;
    }

    fetch(`/api/internacao/${internacaoId}/hda`)
        .then(resp => resp.json())
        .then(json => {
            if (json.success) {
                const hdaTexto = json.hda || 'Não registrado.';
                // Atualizar campos somente se existirem no DOM
                const container = document.getElementById('hdaContainer');
                const textareaHidden = document.getElementById('hdaTexto');
                if (container) container.textContent = hdaTexto;
                if (textareaHidden) textareaHidden.value = hdaTexto;
            } else {
                console.warn('Falha ao carregar HDA:', json.message);
            }
        })
        .catch(err => console.error('Erro ao buscar HDA:', err));
}

// ===================================================

// Dentro do $(document).ready principal (já existente)
// Vou acrescentar chamada a carregarHDA()

$(document).ready(function() {
    // Chamada extra para garantir que a HDA seja carregada após o DOM estar pronto
    carregarHDA();
});

$(document).on('shown.bs.modal', '#modalNovaReceita', function () {
    // Se o editor ainda não existe, inicializa
    if (!window.quillReceita) {
        inicializarEditorReceita();
    } else {
        // Se já existe, apenas limpa o conteúdo
        window.quillReceita.setText('');
    }
});


$(document).on('shown.bs.modal', '#modalNovoAtestado', function () {
    // Extrair dados do paciente do DOM de forma mais robusta
    let nomePaciente = 'NOME DO PACIENTE';
    let cpfPaciente = 'CPF DO PACIENTE';
    
    try {
        // Buscar nome do paciente
        const nomeElement = $('.paciente-info .info-item:contains("Nome:")');
        if (nomeElement.length > 0) {
            const nomeTexto = nomeElement.text();
            const nomeMatch = nomeTexto.match(/Nome:\s*(.+)/);
            if (nomeMatch && nomeMatch[1]) {
                nomePaciente = nomeMatch[1].trim();
            }
        }
        
        // Buscar CPF do paciente
        const cpfElement = $('.paciente-info .info-item:contains("CPF:")');
        if (cpfElement.length > 0) {
            const cpfTexto = cpfElement.text();
            const cpfMatch = cpfTexto.match(/CPF:\s*(.+)/);
            if (cpfMatch && cpfMatch[1]) {
                cpfPaciente = cpfMatch[1].trim();
            }
        }
        
        console.log('Dados extraídos - Nome:', nomePaciente, 'CPF:', cpfPaciente);
    } catch (error) {
        console.warn('Erro ao extrair dados do paciente:', error);
    }
    
    // Texto pré-preenchido do atestado (inicial com placeholder)
    const textoPrePreenchido = `Atesto que ${nomePaciente}, portador do CPF n: ${cpfPaciente}, deverá afastar-se do trabalho por um período de [dias] dias, para tratamento de saúde. \n\n CID:_______`;
    
    // Função para pré-preencher o editor
    const preencherEditor = function(texto = textoPrePreenchido) {
        if (window.quillAtestado && window.quillAtestado.setText) {
            window.quillAtestado.setText(texto);
            console.log('Atestado pré-preenchido com sucesso');
            return true;
        }
        return false;
    };
    
    // Se o editor ainda não existe, inicializa
    if (!window.quillAtestado) {
        inicializarEditorAtestado();
        // Aguardar inicialização e depois pré-preencher
        setTimeout(() => preencherEditor(), 200);
    } else {
        // Se já existe, pré-preencher imediatamente
        preencherEditor();
    }
    
    // Limpar campo de dias de afastamento
    const diasInput = document.getElementById('dias_afastamento');
    if (diasInput) {
        diasInput.value = '';
    }
});

// Função para imprimir prescrição
function imprimirPrescricao(prescricaoId) {
    if (!prescricaoId) {
        alert('ID da prescrição não informado.');
        return;
    }
    
    // Abrir página de impressão em nova aba
    const url = `/api/imprimir-prescricao-html/${prescricaoId}`;
    const novaJanela = window.open(url, '_blank');
    
    if (!novaJanela) {
        alert('Popup bloqueado. Por favor, permita popups para este site e tente novamente.');
        return;
    }
    
    // Aguardar carregamento e tentar imprimir automaticamente
    novaJanela.onload = function() {
        setTimeout(function() {
            try {
                novaJanela.print();
            } catch (error) {
                console.warn('Não foi possível imprimir automaticamente:', error);
            }
        }, 1000); // Aguarda 1 segundo para garantir que a página carregou completamente
    };
}

// Função para imprimir evolução médica
function imprimirEvolucao(evolucaoId) {
    if (!evolucaoId) {
        alert('ID da evolução não informado.');
        return;
    }
    
    // Abrir página de impressão em nova aba
    const url = `/api/imprimir-evolucao-html/${evolucaoId}`;
    const novaJanela = window.open(url, '_blank');
    
    if (!novaJanela) {
        alert('Popup bloqueado. Por favor, permita popups para este site e tente novamente.');
        return;
    }
    
    // Aguardar carregamento e tentar imprimir automaticamente
    novaJanela.onload = function() {
        setTimeout(function() {
            try {
                novaJanela.print();
            } catch (error) {
                console.warn('Não foi possível imprimir automaticamente:', error);
            }
        }, 1000); // Aguarda 1 segundo para garantir que a página carregou completamente
    };
}

// Adicionar função global para imprimir receita comum
window.imprimirReceitaComum = function(receitaId) {
    window.open(`/clinica/receituario/${receitaId}/imprimir_html_comum`, '_blank');
};

// Adicionar função global para imprimir receita especial
window.imprimirReceitaEspecial = function(receitaId) {
    window.open(`/clinica/receituario/${receitaId}/imprimir_html`, '_blank');
};

// ======== EVENT LISTENERS PARA MODAL DE EVOLUÇÃO ========

// Event listener para inicializar Quill da evolução quando modal for aberto
$(document).on('shown.bs.modal', '#modalEvolucao', function () {
    console.log('Modal de evolução aberto - inicializando Quill...');
    
    // Pequeno delay para garantir que o modal foi totalmente renderizado
    setTimeout(() => {
        const sucesso = inicializarEditorPrincipal();
        if (!sucesso) {
            console.warn('Falha ao inicializar Quill da evolução - usando fallback');
        }
    }, 300);
});

// Event listener para limpar editor quando modal for fechado
$(document).on('hidden.bs.modal', '#modalEvolucao', function () {
    console.log('Modal de evolução fechado - limpando editor...');
    
    // Limpar todas as possíveis instâncias do editor
    if (window.quill && window.quill.setText) {
        window.quill.setText('');
    }
    
    if (window.QuillEvolucao && window.QuillEvolucao.setText) {
        window.QuillEvolucao.setText('');
    }
    
    const fallback = document.getElementById('fallback-evolucao');
    if (fallback) {
        fallback.value = '';
    }
    
    const hiddenField = document.getElementById('texto_evolucao');
    if (hiddenField) {
        hiddenField.value = '';
    }
});

// ======== FUNÇÕES PARA GERENCIAMENTO DE FICHAS DE REFERÊNCIA ========

// Função para carregar fichas de referência
function carregarFichasReferencia() {
    if (!document.getElementById('listaFichasReferencia')) return;
    
    const atendimentoId = document.getElementById('atendimento_id') ? 
                         document.getElementById('atendimento_id').value : 
                         internacaoId;
    
    if (!atendimentoId) {
        console.error('ID de atendimento não encontrado para carregar fichas de referência');
        return;
    }
    
    // Mostrar loading
    document.getElementById('listaFichasReferencia').innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-primary"></i> Carregando fichas de referência...</div>';
    
    jQuery.ajax({
        url: `/api/fichas-referencia/lista/${atendimentoId}`, // Corrigido: novo endpoint sem conflito
        method: 'GET',
        success: function(response) {
            if (response.success) {
                // ORDENAR POR DATA/HORA - MAIS RECENTES PRIMEIRO
                const fichas = response.fichas.sort((a, b) => new Date(b.data_criacao || b.data) - new Date(a.data_criacao || a.data));
                
                // Renderizar todas as fichas em uma única lista
                renderizarFichasReferencia(fichas, '#listaFichasReferencia');
                
                // Mostrar estatísticas simplificadas
                mostrarEstatisticasFichas(fichas.length);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar fichas de referência:', error);
            document.getElementById('listaFichasReferencia').innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Erro ao carregar fichas de referência</div>';
            mostrarMensagemErro('Erro ao carregar fichas de referência. Por favor, tente novamente.');
        }
    });
}

// Função para renderizar fichas de referência com UX melhorada
function renderizarFichasReferencia(fichas, containerId) {
    const container = jQuery(containerId);
    
    if (fichas.length === 0) {
        const emptyStateHtml = `
            <div class="empty-state text-center py-5">
                <i class="fas fa-file-export fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">Nenhuma ficha de referência</h6>
                <p class="text-muted small mb-0">
                    As fichas de referência criadas aparecerão aqui
                </p>
            </div>
        `;
        container.html(emptyStateHtml);
        return;
    }
    
    let html = '<div class="fichas-grid">';
    fichas.forEach((ficha, index) => {
        // Corrigir formatação de data
        let dataFormatada = 'Data não informada';
        
        try {
            if (ficha.data_criacao) {
                dataFormatada = ficha.data_criacao;
            } else if (ficha.data && ficha.hora) {
                dataFormatada = `${ficha.data} às ${ficha.hora}`;
            } else if (ficha.data) {
                const dataObj = new Date(ficha.data);
                if (!isNaN(dataObj.getTime())) {
                    dataFormatada = dataObj.toLocaleDateString('pt-BR');
                }
            }
        } catch (error) {
            console.warn('Erro ao formatar data da ficha:', error);
            dataFormatada = 'Data não informada';
        }

        // Preparar conteúdo principal (encaminhamento e unidade)
        const temEncaminhamento = ficha.encaminhamento_atendimento && ficha.encaminhamento_atendimento.trim();
        const temUnidade = ficha.unidade_referencia && ficha.unidade_referencia.trim();
        const temProcedimento = ficha.procedimento && ficha.procedimento.trim();
        
        html += `
            <div class="ficha-card" data-ficha-id="${ficha.id}">
                <div class="ficha-header">
                    <div class="ficha-info">
                        <div class="ficha-titulo">
                            <i class="fas fa-file-export text-primary me-2"></i>
                            <span class="titulo-texto">Referência #${String(ficha.id).padStart(3, '0')}</span>
                        </div>
                        <div class="ficha-metadados">
                            <span class="timestamp">
                                <i class="fas fa-clock me-1"></i>
                                ${dataFormatada}
                            </span>
                            ${ficha.medico_nome ? `
                                <span class="medico-info">
                                    <i class="fas fa-user-md me-1"></i>
                                    Dr(a). ${ficha.medico_nome}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="ficha-actions">
                        <button type="button" class="btn-action" 
                                onclick="visualizarFichaReferencia(${ficha.id})" 
                                title="Visualizar ficha completa">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn-action btn-print" 
                                onclick="imprimirFichaReferencia(${ficha.id})" 
                                title="Imprimir ficha">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </div>
                
                <div class="ficha-content">
                    <!-- FOCO: Unidade de Referência -->
                    ${temUnidade ? `
                        <div class="campo-principal mb-3">
                            <div class="campo-label">
                                <i class="fas fa-hospital text-info me-2"></i>
                                <strong>Unidade de Referência</strong>
                            </div>
                            <div class="campo-valor destaque-unidade">
                                ${ficha.unidade_referencia}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- FOCO: Encaminhamento -->
                    ${temEncaminhamento ? `
                        <div class="campo-principal mb-3">
                            <div class="campo-label">
                                <i class="fas fa-share text-success me-2"></i>
                                <strong>Encaminhamento para Atendimento</strong>
                            </div>
                            <div class="campo-valor">
                                ${ficha.encaminhamento_atendimento.length > 150 ? 
                                    ficha.encaminhamento_atendimento.substring(0, 150) + '...' : 
                                    ficha.encaminhamento_atendimento}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Procedimento (se houver) -->
                    ${temProcedimento ? `
                        <div class="campo-secundario mb-2">
                            <div class="campo-label-pequeno">
                                <i class="fas fa-cogs text-warning me-1"></i>
                                <span>Procedimento:</span>
                            </div>
                            <div class="campo-valor-pequeno">
                                ${ficha.procedimento.length > 100 ? 
                                    ficha.procedimento.substring(0, 100) + '...' : 
                                    ficha.procedimento}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Indicador se tem texto de referência -->
                    ${ficha.texto_referencia ? `
                        <div class="tem-mais-conteudo">
                            <i class="fas fa-file-text text-muted me-1"></i>
                            <span class="text-muted small">Contém texto de referência adicional - clique no olho para visualizar</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.html(html);
}

// Função para extrair preview do texto das fichas
function extrairPreviewTexto(textoReferencia, encaminhamento, procedimento) {
    // Esta função foi removida pois não é mais necessária
    // O preview agora é feito diretamente na renderização
    return '';
}

// Função para expandir/contrair ficha (removida - não mais necessária) 
function expandirFicha(fichaId) {
    // Esta função foi removida - agora usamos apenas o modal de visualização
    console.log('Função expandirFicha foi removida. Use visualizarFichaReferencia() em vez disso.');
}

// Função para mostrar estatísticas das fichas
function mostrarEstatisticasFichas(totalFichas) {
    const statsContainer = document.querySelector('#fichaReferenciaSection .card-body');
    
    if (!statsContainer) return;
    
    // Criar ou atualizar painel de estatísticas
    let statsPanel = statsContainer.querySelector('.stats-panel');
    if (!statsPanel) {
        statsPanel = document.createElement('div');
        statsPanel.className = 'stats-panel mb-3';
        statsContainer.insertBefore(statsPanel, statsContainer.firstChild);
    }
    
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-icon">
                    <i class="fas fa-file-export"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number">${totalFichas}</div>
                    <div class="stat-label">Fichas Criadas</div>
                </div>
            </div>
        </div>
    `;
    
    statsPanel.innerHTML = statsHtml;
}

// Função para carregar conteúdo completo da ficha (removida - não mais necessária)
function carregarConteudoCompletoFicha(fichaId) {
    // Esta função foi removida - agora usamos apenas o modal de visualização
    console.log('Função carregarConteudoCompletoFicha foi removida. Use visualizarFichaReferencia() em vez disso.');
}

// Função para visualizar ficha de referência
function visualizarFichaReferencia(id) {
    console.log('👁️ Visualizando ficha de referência ID:', id);
    
    // Verificar se o modal existe
    const modalElement = document.getElementById('modalVisualizarFichaReferencia');
    if (!modalElement) {
        console.error('❌ Modal modalVisualizarFichaReferencia não encontrado no DOM');
        alert('Erro: Modal de visualização não encontrado. Recarregue a página.');
        return;
    }
    
    // Verificar se o Bootstrap está disponível
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap não está carregado');
        alert('Erro: Bootstrap não carregado. Recarregue a página.');
        return;
    }
    
    // Mostrar loading no modal
    const modalBody = modalElement.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                <p class="text-muted">Carregando ficha de referência...</p>
            </div>
        `;
    }
    
    // Tentar abrir modal com tratamento de erro
    try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('✅ Modal aberto com sucesso');
    } catch (error) {
        console.error('❌ Erro ao abrir modal:', error);
        alert('Erro ao abrir modal de visualização: ' + error.message);
        return;
    }
    
    // Carregar dados da ficha
    jQuery.ajax({
        url: `/api/fichas-referencia/${id}`,
        method: 'GET',
        success: function(response) {
            console.log('✅ Dados da ficha carregados:', response);
            
            // Verificar se a resposta tem o formato {success: true, ficha: {...}} ou se é a ficha diretamente
            let ficha;
            if (response.success && response.ficha) {
                // Formato: {success: true, ficha: {...}}
                ficha = response.ficha;
            } else if (response.id || response.atendimento_id) {
                // Formato: dados da ficha diretamente
                ficha = response;
            } else {
                console.error('❌ Formato de resposta não reconhecido:', response);
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Erro ao carregar a ficha de referência.
                        </div>
                    `;
                }
                return;
            }
            
            if (ficha) {
                // Formatar data
                let dataFormatada = 'Data não informada';
                try {
                    if (ficha.data_criacao) {
                        dataFormatada = ficha.data_criacao;
                    } else if (ficha.data && ficha.hora) {
                        dataFormatada = `${ficha.data} às ${ficha.hora}`;
                    } else if (ficha.data) {
                        const dataObj = new Date(ficha.data);
                        if (!isNaN(dataObj.getTime())) {
                            dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        }
                    }
                } catch (error) {
                    console.warn('Erro ao formatar data:', error);
                }
                
                // Construir HTML do modal
                const modalContent = `
                    <div class="ficha-visualizacao">
                        <!-- Cabeçalho da Ficha -->
                        <div class="ficha-header-modal mb-4">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="mb-2">
                                        <i class="fas fa-file-export text-primary me-2"></i>
                                        Ficha de Referência #${String(ficha.id).padStart(3, '0')}
                                    </h5>
                                    <div class="text-muted">
                                        <i class="fas fa-clock me-1"></i> ${dataFormatada}
                                        ${ficha.medico_nome ? `<br><i class="fas fa-user-md me-1"></i> Dr(a). ${ficha.medico_nome}` : ''}
                                    </div>
                                </div>
                                <button type="button" class="btn btn-outline-success btn-sm" onclick="imprimirFichaReferencia(${ficha.id})">
                                    <i class="fas fa-print me-1"></i> Imprimir
                                </button>
                            </div>
                        </div>
                        
                        <!-- Conteúdo Principal -->
                        <div class="ficha-conteudo-modal">
                            ${ficha.unidade_referencia ? `
                                <div class="campo-modal mb-4">
                                    <div class="campo-titulo-modal">
                                        <i class="fas fa-hospital text-info me-2"></i>
                                        <strong>Unidade de Referência</strong>
                                    </div>
                                    <div class="campo-conteudo-modal destaque-unidade-modal">
                                        ${ficha.unidade_referencia}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${ficha.encaminhamento_atendimento ? `
                                <div class="campo-modal mb-4">
                                    <div class="campo-titulo-modal">
                                        <i class="fas fa-share text-success me-2"></i>
                                        <strong>Encaminhamento para Atendimento</strong>
                                    </div>
                                    <div class="campo-conteudo-modal">
                                        ${ficha.encaminhamento_atendimento.replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${ficha.procedimento ? `
                                <div class="campo-modal mb-4">
                                    <div class="campo-titulo-modal">
                                        <i class="fas fa-cogs text-warning me-2"></i>
                                        <strong>Procedimento</strong>
                                    </div>
                                    <div class="campo-conteudo-modal">
                                        ${ficha.procedimento.replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${ficha.texto_referencia ? `
                                <div class="campo-modal mb-4">
                                    <div class="campo-titulo-modal">
                                        <i class="fas fa-file-text text-primary me-2"></i>
                                        <strong>Texto de Referência</strong>
                                    </div>
                                    <div class="campo-conteudo-modal texto-referencia-modal">
                                        ${ficha.texto_referencia.replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${!ficha.unidade_referencia && !ficha.encaminhamento_atendimento && !ficha.procedimento && !ficha.texto_referencia ? `
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Esta ficha não possui conteúdo preenchido.
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                // Atualizar conteúdo do modal
                if (modalBody) {
                    modalBody.innerHTML = modalContent;
                }
                
                console.log('✅ Modal de visualização atualizado');
            } else {
                console.error('❌ Dados da ficha não encontrados na resposta');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Dados da ficha não encontrados.
                        </div>
                    `;
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Erro ao carregar ficha:', error);
            console.error('Status:', xhr.status);
            console.error('Response:', xhr.responseText);
            
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erro ao carregar a ficha de referência: ${error}
                    </div>
                `;
            }
        }
    });
}

// Função para imprimir ficha de referência
function imprimirFichaReferencia(id) {
    if (!id) {
        alert('ID da ficha de referência não informado.');
        return;
    }
    
    console.log('🖨️ Imprimindo ficha de referência ID:', id);
    
    // Abrir página de impressão em nova aba
    const url = `/clinica/ficha-referencia/${id}/imprimir`;
    const novaJanela = window.open(url, '_blank');
    
    if (!novaJanela) {
        alert('Popup bloqueado. Por favor, permita popups para este site e tente novamente.');
        return;
    }
    
    // Aguardar carregamento e tentar imprimir automaticamente
    novaJanela.onload = function() {
        setTimeout(function() {
            try {
                novaJanela.print();
            } catch (error) {
                console.warn('Não foi possível imprimir automaticamente:', error);
            }
        }, 1000); // Aguarda 1 segundo para garantir que a página carregou completamente
    };
}

// Função para salvar nova ficha de referência
function salvarFichaReferencia() {
    console.log('🚀 Iniciando salvarFichaReferencia()');
    
    // Prevenir múltiplas execuções simultâneas
    const btnSalvar = document.getElementById('btn_salvar_ficha_referencia');
    if (btnSalvar && btnSalvar.disabled) {
        console.log('⚠️ Botão já está processando, ignorando clique duplo');
        return;
    }
    
    const texto_referencia = document.getElementById('texto_referencia').value;
    const procedimento = document.getElementById('procedimento').value;
    const unidade_referencia = document.getElementById('unidade_referencia').value;
    
    // Coletar checkboxes de encaminhamento
    const encaminhamentoCheckboxes = [];
    if (document.getElementById('encaminhamento_ambulatorial')?.checked) {
        encaminhamentoCheckboxes.push('Ambulatorial');
    }
    if (document.getElementById('encaminhamento_hospitalar')?.checked) {
        encaminhamentoCheckboxes.push('Hospitalar');
    }
    if (document.getElementById('encaminhamento_auxilio_diagnostico')?.checked) {
        encaminhamentoCheckboxes.push('Auxilio Diagnostico');
    }
    const encaminhamento_atendimento = encaminhamentoCheckboxes.join(', ');
    
    console.log('📝 Valores dos campos:');
    console.log('  - texto_referencia:', texto_referencia);
    console.log('  - encaminhamento_atendimento:', encaminhamento_atendimento);
    console.log('  - procedimento:', procedimento);
    console.log('  - unidade_referencia:', unidade_referencia);
    
    // Validação básica - pelo menos um campo deve ter conteúdo
    if (!texto_referencia && !encaminhamento_atendimento && !procedimento && !unidade_referencia) {
        console.log('❌ Validação falhou: nenhum campo preenchido');
        alert('Por favor, preencha pelo menos um dos campos da ficha de referência.');
        return;
    }
    
    console.log('✅ Validação passou');
    
    // Mostrar indicador de carregamento
    if (!btnSalvar) {
        console.error('❌ Botão btn_salvar_ficha_referencia não encontrado!');
        alert('Erro: Botão de salvamento não encontrado.');
        return;
    }
    
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btnSalvar.disabled = true;
    
    console.log('🔄 Botão de salvamento configurado para loading');
    
    // Obter ID do atendimento
    const atendimentoId = document.getElementById('atendimento_id') ? 
                         document.getElementById('atendimento_id').value : 
                         internacaoId;
    
    console.log('🆔 ID do atendimento:', atendimentoId);
    console.log('🆔 Tipo do atendimentoId:', typeof atendimentoId);
    console.log('🆔 internacaoId global:', window.internacaoId);
    
    if (!atendimentoId) {
        console.error('❌ ID de atendimento não encontrado');
        alert('Erro: ID de atendimento não encontrado');
        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;
        return;
    }
    
    // Preparar dados para envio
    const dados = {
        atendimento_id: atendimentoId,
        texto_referencia: texto_referencia,
        encaminhamento_atendimento: encaminhamento_atendimento,
        procedimento: procedimento,
        unidade_referencia: unidade_referencia
    };
    
    console.log('📦 Dados da ficha de referência sendo enviados:', dados);
    console.log('🌐 URL da requisição: /api/fichas-referencia');
    console.log('📡 Método: POST');
    
    // Enviar requisição
    $.ajax({
        url: '/api/fichas-referencia',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        beforeSend: function() {
            console.log('📤 Enviando requisição AJAX...');
        },
        success: function(response) {
            console.log('✅ Resposta de sucesso recebida:', response);
            
            if (response.success) {
                console.log('🎉 Ficha criada com sucesso! ID:', response.ficha_id || response.id);
                
                // Limpar formulário
                const form = document.getElementById('formFichaReferencia');
                if (form) {
                    form.reset();
                    console.log('🧹 Formulário limpo');
                }
                
                // Fechar modal
                $('#modalNovaFichaReferencia').modal('hide');
                console.log('🔒 Modal fechado');
                
                // AGUARDAR UM POUCO ANTES DE RECARREGAR (evitar concorrência)
                setTimeout(() => {
                    console.log('🔄 Recarregando lista de fichas...');
                    carregarFichasReferencia();
                }, 500);
                
                // Mostrar mensagem de sucesso melhorada
                mostrarMensagemSucesso('✅ Ficha de referência criada com sucesso!');
                console.log('✅ Mensagem de sucesso exibida');
                
                // Notificação toast adicional
                mostrarToastSucesso('Nova ficha de referência adicionada ao prontuário');
            } else {
                console.error('❌ Resposta indica falha:', response);
                alert('Erro ao registrar ficha de referência: ' + (response.message || response.error || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Erro na requisição AJAX:');
            console.error('  - Status HTTP:', xhr.status);
            console.error('  - Status Text:', xhr.statusText);
            console.error('  - Error:', error);
            console.error('  - Response Text:', xhr.responseText);
            
            let mensagemErro;
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                console.error('  - Parsed Error:', errorResponse);
                mensagemErro = errorResponse.message || errorResponse.error || error;
            } catch (e) {
                console.error('  - Erro ao fazer parse do JSON:', e);
                mensagemErro = error;
            }
            
            alert('Erro ao registrar ficha de referência: ' + mensagemErro);
        },
        complete: function() {
            console.log('🏁 Requisição concluída - restaurando botão');
            // Restaurar botão
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
        }
    });
}

// Função para mostrar toast de sucesso
function mostrarToastSucesso(mensagem) {
    const toastHtml = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1060">
            <div class="toast show" role="alert">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong class="me-auto">Sucesso</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${mensagem}
                </div>
            </div>
        </div>
    `;
    
    // Remover toasts anteriores
    $('.toast').remove();
    
    // Adicionar novo toast
    $('body').append(toastHtml);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        $('.toast').fadeOut(300, function() {
            $(this).parent().remove();
        });
    }, 5000);
}

// Inicializador para as funções de fichas de referência
function inicializarModuloFichasReferencia() {
    console.log('🔧 Inicializando módulo de fichas de referência...');
    
    // Carregar fichas ao inicializar
    carregarFichasReferencia();
    
    // Evento para o botão "Nova Ficha de Referência"
    const btnNovaFicha = document.getElementById('btn_nova_ficha_referencia');
    if (btnNovaFicha) {
        console.log('✅ Botão Nova Ficha encontrado, configurando evento...');
        btnNovaFicha.addEventListener('click', function() {
            console.log('🎯 Clique no botão Nova Ficha detectado');
            
            // Limpar formulário
            const form = document.getElementById('formFichaReferencia');
            if (form) {
                form.reset();
                console.log('🧹 Formulário resetado');
            }
            
            // Auto-popular o campo texto_referencia
            autoPopularTextoReferencia();
            
            // Abrir modal
            try {
                const modal = new bootstrap.Modal(document.getElementById('modalNovaFichaReferencia'));
                modal.show();
                console.log('📋 Modal aberto com sucesso');
            } catch (error) {
                console.error('❌ Erro ao abrir modal:', error);
                // Fallback para jQuery
                $('#modalNovaFichaReferencia').modal('show');
            }
        });
    } else {
        console.error('❌ Botão Nova Ficha não encontrado!');
    }
    
    // Evento para salvar nova ficha de referência
    const btnSalvarFicha = document.getElementById('btn_salvar_ficha_referencia');
    if (btnSalvarFicha) {
        console.log('✅ Botão Salvar Ficha encontrado, configurando evento...');
        // Remover qualquer evento anterior para evitar duplicação
        btnSalvarFicha.removeEventListener('click', salvarFichaReferencia);
        btnSalvarFicha.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🎯 Event listener do botão salvar ficha acionado');
            salvarFichaReferencia();
        });
    } else {
        console.error('❌ Botão Salvar Ficha não encontrado!');
    }
    
    console.log('🎉 Módulo de fichas de referência inicializado com sucesso!');
}

// Função para auto-popular o campo texto de referência
function autoPopularTextoReferencia() {
    console.log('🔧 Auto-populando texto de referência...');
    
    const atendimentoId = $('#atendimento_id').val();
    if (!atendimentoId) {
        console.warn('⚠️ ID do atendimento não encontrado para auto-população');
        return;
    }
    
    // Buscar dados da internação
    $.ajax({
        url: `/api/internacao/${atendimentoId}`,
        method: 'GET',
        success: function(response) {
            console.log('✅ Dados da internação carregados para auto-população');
            console.log('📋 Response completa:', response);
            
            // Normalizar estrutura da response
            const dados = response.internacao || response;
            console.log('📋 Dados normalizados:', dados);
            
            // Extrair informações necessárias
            const hda = dados.hda || '';
            const exameFisico = dados.anamnese_exame_fisico || dados.folha_anamnese || '';
            const cidPrincipal = dados.cid_principal || '';
            
            console.log('📝 Campos extraídos:');
            console.log('  - HDA:', hda);
            console.log('  - HDA length:', hda ? hda.length : 0);
            console.log('  - HDA trimmed:', hda ? hda.trim() : '');
            console.log('  - Exame Físico:', exameFisico);
            console.log('  - CID Principal:', cidPrincipal);
            
            // Montar texto padrão
            let textoReferencia = '';
            
            if (hda && hda.trim()) {
                textoReferencia += 'HDA:\n' + hda.trim();
            }
            
            if (exameFisico && exameFisico.trim()) {
                if (textoReferencia) textoReferencia += '\n\n';
                textoReferencia += 'EXAME FÍSICO:\n' + exameFisico.trim();
            }
            
            if (cidPrincipal && cidPrincipal.trim()) {
                if (textoReferencia) textoReferencia += '\n\n';
                textoReferencia += 'CID Principal: ' + cidPrincipal.trim();
            }
            
            if (textoReferencia) textoReferencia += '\n\nENCOMINHO A ...';
            else textoReferencia = 'HDA:\n\nEXAME FÍSICO:\n\nCID PRINCIPAL:\n\nENCOMINHO A ...';
            
            console.log('📄 Texto final montado:', textoReferencia);
            
            // Preencher o campo
            const textoReferenciaField = document.getElementById('texto_referencia');
            if (textoReferenciaField) {
                textoReferenciaField.value = textoReferencia;
                console.log('✅ Campo texto_referencia preenchido automaticamente');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Erro ao carregar dados para auto-população:', error);
            // Em caso de erro, usar formato básico
            const textoBasico = 'HDA:\n\nEXAME FÍSICO:\n CID PRINCIPAL: \n\n \nPARÂMETROS: \n\nENCOMINHO A ...';
            const textoReferenciaField = document.getElementById('texto_referencia');
            if (textoReferenciaField) {
                textoReferenciaField.value = textoBasico;
                console.log('✅ Campo texto_referencia preenchido com formato básico');
            }
        }
    });
}