// Fix completo para modais médicos - Versão corrigida para atualização da interface
$(document).ready(function() {
    console.log('Iniciando correções avançadas dos modais médicos...');
    
    // Cache para dados
    let dadosCache = {
        anamnese: null,
        diagnostico: null,
        justificativas: null
    };
    
    // ======================
    // FUNÇÕES DE CARREGAMENTO
    // ======================
    
    // Função central para carregar dados da internação
    function carregarDadosInternacao() {
        const atendimentoId = $('#atendimento_id').val();
        if (!atendimentoId) {
            console.error('ID do atendimento não encontrado');
            return Promise.reject('ID não encontrado');
        }

        console.log('Carregando dados da internação para atendimento:', atendimentoId);

        return $.ajax({
            url: `/api/internacao/${atendimentoId}`,
            method: 'GET',
            timeout: 10000
        }).done(function(response) {
            console.log('Dados recebidos:', response);
            
            // Normalizar estrutura da response
            const dados = response.internacao || response;
            
            // Atualizar cache
            dadosCache.anamnese = {
                anamnese_exame_fisico: dados.anamnese_exame_fisico || '',
                conduta: dados.conduta || ''
            };
            
            dadosCache.diagnostico = {
                diagnostico_inicial: dados.diagnostico_inicial || '',
                cid_principal: dados.cid_principal || '',
                diagnostico: dados.diagnostico || '',
                cid_10_secundario: dados.cid_10_secundario || '',
                cid_10_causas_associadas: dados.cid_10_causas_associadas || ''
            };
            
            dadosCache.justificativas = {
                justificativa_internacao_sinais_e_sintomas: dados.justificativa_internacao_sinais_e_sintomas || '',
                justificativa_internacao_condicoes: dados.justificativa_internacao_condicoes || '',
                justificativa_internacao_principais_resultados_diagnostico: dados.justificativa_internacao_principais_resultados_diagnostico || ''
            };
            
            return dados;
        }).fail(function(xhr, status, error) {
            console.error('Erro ao carregar dados:', error);
            throw new Error('Falha ao carregar dados da internação');
        });
    }
    
    // ======================
    // ATUALIZAÇÃO DA INTERFACE
    // ======================
    
    // Atualizar visualização de Anamnese e Conduta
    function atualizarVisualizacaoAnamnese(dados = null) {
        const dadosAnamnese = dados || dadosCache.anamnese;
        if (!dadosAnamnese) return;
        
        console.log('Atualizando visualização de anamnese:', dadosAnamnese);
        
        // Anamnese e Exame Físico
        $('#anamnese-exame-fisico-display').html(
            dadosAnamnese.anamnese_exame_fisico ? 
            `<div class="text-dark">${dadosAnamnese.anamnese_exame_fisico.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
        
        // Conduta Médica
        $('#conduta-medica-display').html(
            dadosAnamnese.conduta ? 
            `<div class="text-dark">${dadosAnamnese.conduta.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
    }
    
    // Atualizar visualização de Diagnóstico
    function atualizarVisualizacaoDiagnostico(dados = null) {
        const dadosDiagnostico = dados || dadosCache.diagnostico;
        if (!dadosDiagnostico) return;
        
        console.log('Atualizando visualização de diagnóstico:', dadosDiagnostico);
        
        $('#diagnostico-inicial-display').html(
            dadosDiagnostico.diagnostico_inicial ? 
            `<div class="text-dark">${dadosDiagnostico.diagnostico_inicial.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
        
        $('#cid-principal-display').html(
            dadosDiagnostico.cid_principal ? 
            `<div class="text-dark fw-bold">${dadosDiagnostico.cid_principal}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
        
        $('#diagnostico-atual-display').html(
            dadosDiagnostico.diagnostico ? 
            `<div class="text-dark">${dadosDiagnostico.diagnostico.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
        
        $('#cid-secundario-display').html(
            dadosDiagnostico.cid_10_secundario ? 
            `<div class="text-dark">${dadosDiagnostico.cid_10_secundario.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted">Nenhum CID secundário registrado</div>'
        );
        
        $('#causas-associadas-display').html(
            dadosDiagnostico.cid_10_causas_associadas ? 
            `<div class="text-dark">${dadosDiagnostico.cid_10_causas_associadas.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted">Nenhuma causa associada registrada</div>'
        );
    }
    
    // Atualizar visualização de Justificativas
    function atualizarVisualizacaoJustificativas(dados = null) {
        const dadosJustificativas = dados || dadosCache.justificativas;
        if (!dadosJustificativas) return;
        
        console.log('Atualizando visualização de justificativas:', dadosJustificativas);
        
        $('#sinais-sintomas-display').html(
            dadosJustificativas.justificativa_internacao_sinais_e_sintomas ? 
            `<div class="text-dark">${dadosJustificativas.justificativa_internacao_sinais_e_sintomas.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
        
        $('#condicoes-display').html(
            dadosJustificativas.justificativa_internacao_condicoes ? 
            `<div class="text-dark">${dadosJustificativas.justificativa_internacao_condicoes.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
        
        $('#resultados-diagnosticos-display').html(
            dadosJustificativas.justificativa_internacao_principais_resultados_diagnostico ? 
            `<div class="text-dark">${dadosJustificativas.justificativa_internacao_principais_resultados_diagnostico.replace(/\n/g, '<br>')}</div>` : 
            '<div class="text-muted"><i class="fas fa-info-circle me-1"></i>Não informado</div>'
        );
    }
    
    // ======================
    // FUNÇÕES DE FEEDBACK
    // ======================
    
    // Mostrar alerta de sucesso
    function mostrarSucesso(container, mensagem) {
        const alertHtml = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Sucesso!</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Remover alertas anteriores
        $(container).find('.alert').remove();
        // Adicionar novo alerta
        $(container).prepend(alertHtml);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            $(container).find('.alert').fadeOut();
        }, 5000);
    }
    
    // Mostrar alerta de erro
    function mostrarErro(container, mensagem) {
        const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Erro!</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Remover alertas anteriores
        $(container).find('.alert').remove();
        // Adicionar novo alerta
        $(container).prepend(alertHtml);
    }
    
    // ======================
    // CRIAR MODAIS MODERNOS
    // ======================
    
    // Criar modal para Anamnese/Conduta
    function criarModalAnamneseConduta() {
        if ($('#modalAnamneseConduta').length === 0) {
            const modalHtml = `
                <div class="modal fade" id="modalAnamneseConduta" tabindex="-1" aria-labelledby="modalAnamneseCondutaLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title" id="modalAnamneseCondutaLabel">
                                    <i class="fas fa-user-md me-2"></i>Editar Anamnese e Conduta Médica
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="anamneseModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-user-check me-1"></i>Anamnese e Exame Físico
                                        </label>
                                        <textarea class="form-control" id="anamneseModalEdit" rows="15" 
                                                placeholder="Registre dados da anamnese, exame físico, sinais vitais e achados clínicos relevantes..."></textarea>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="condutaModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-prescription me-1"></i>Conduta Médica
                                        </label>
                                        <textarea class="form-control" id="condutaModalEdit" rows="15" 
                                                placeholder="Descreva o plano terapêutico, orientações e condutas médicas adotadas..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-1"></i>Cancelar
                                </button>
                                <button type="button" class="btn btn-success" id="btnSalvarAnamneseCondutaModal">
                                    <i class="fas fa-save me-1"></i>Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modalHtml);
            console.log('Modal de Anamnese/Conduta criado');
        }
    }
    
    // Criar modal para Diagnóstico
    function criarModalDiagnostico() {
        if ($('#modalDiagnostico').length === 0) {
            const modalHtml = `
                <div class="modal fade" id="modalDiagnostico" tabindex="-1" aria-labelledby="modalDiagnosticoLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header bg-info text-white">
                                <h5 class="modal-title" id="modalDiagnosticoLabel">
                                    <i class="fas fa-stethoscope me-2"></i>Editar Diagnóstico e Classificação
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="diagnosticoInicialModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-stethoscope me-1"></i>Diagnóstico Inicial
                                        </label>
                                        <textarea class="form-control" id="diagnosticoInicialModalEdit" rows="6" 
                                                placeholder="Digite o diagnóstico inicial baseado na avaliação clínica..."></textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="cidPrincipalModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-code me-1"></i>CID Principal
                                        </label>
                                        <input type="text" class="form-control" id="cidPrincipalModalEdit" 
                                               placeholder="Ex: A09.5, K35.2" maxlength="20">
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <label for="diagnosticoAtualModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-clipboard-check me-1"></i>Diagnóstico Atual
                                        </label>
                                        <textarea class="form-control" id="diagnosticoAtualModalEdit" rows="6" 
                                                placeholder="Digite o diagnóstico atual baseado na evolução do quadro..."></textarea>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="cidSecundarioModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-list me-1"></i>CID Secundário
                                        </label>
                                        <textarea class="form-control" id="cidSecundarioModalEdit" rows="4" 
                                                placeholder="Digite os CIDs secundários (um por linha)"></textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="causasAssociadasModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-exclamation-triangle me-1"></i>Causas Associadas
                                        </label>
                                        <textarea class="form-control" id="causasAssociadasModalEdit" rows="4" 
                                                placeholder="Digite as causas associadas (uma por linha)"></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-1"></i>Cancelar
                                </button>
                                <button type="button" class="btn btn-info" id="btnSalvarDiagnosticoModal">
                                    <i class="fas fa-save me-1"></i>Salvar Diagnóstico
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modalHtml);
            console.log('Modal de Diagnóstico criado');
        }
    }
    
    // Criar modal para Justificativas
    function criarModalJustificativas() {
        if ($('#modalJustificativas').length === 0) {
            const modalHtml = `
                <div class="modal fade" id="modalJustificativas" tabindex="-1" aria-labelledby="modalJustificativasLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title" id="modalJustificativasLabel">
                                    <i class="fas fa-clipboard-list me-2"></i>Editar Justificativas da Internação
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="sinaisSintomasModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-exclamation-circle me-1"></i>Sinais e Sintomas
                                        </label>
                                        <textarea class="form-control" id="sinaisSintomasModalEdit" rows="8" 
                                                placeholder="Descreva os principais sinais e sintomas que justificam a internação..."></textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="condicoesModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-clipboard-check me-1"></i>Condições Justificativas
                                        </label>
                                        <textarea class="form-control" id="condicoesModalEdit" rows="8" 
                                                placeholder="Descreva as condições clínicas que fundamentam a necessidade de internação..."></textarea>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <label for="resultadosModalEdit" class="form-label fw-bold">
                                            <i class="fas fa-flask me-1"></i>Principais Resultados Diagnósticos
                                        </label>
                                        <textarea class="form-control" id="resultadosModalEdit" rows="8" 
                                                placeholder="Descreva os resultados de exames e avaliações que embasam o diagnóstico e justificam a internação..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-1"></i>Cancelar
                                </button>
                                <button type="button" class="btn btn-warning" id="btnSalvarJustificativasModal">
                                    <i class="fas fa-save me-1"></i>Salvar Justificativas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modalHtml);
            console.log('Modal de Justificativas criado');
        }
    }
    
    // ======================
    // EVENT HANDLERS PRINCIPAIS
    // ======================
    
    // Handler para botão editar Anamnese/Conduta
    $(document).off('click', '#btnEditarAnamneseConduta');
    $(document).on('click', '#btnEditarAnamneseConduta', function(e) {
        e.preventDefault();
        console.log('Abrindo modal de anamnese/conduta');
        
        // Criar modal se não existir
        criarModalAnamneseConduta();
        
        // Carregar dados atuais
        carregarDadosInternacao()
            .done(function(dados) {
                // Preencher campos do modal
                $('#anamneseModalEdit').val(dadosCache.anamnese.anamnese_exame_fisico);
                $('#condutaModalEdit').val(dadosCache.anamnese.conduta);
                
                // Abrir modal
                const modal = new bootstrap.Modal(document.getElementById('modalAnamneseConduta'));
                modal.show();
            })
            .fail(function() {
                mostrarErro('#anamnese-pane', 'Erro ao carregar dados para edição');
            });
    });
    
    // Handler para salvar Anamnese/Conduta
    $(document).off('click', '#btnSalvarAnamneseCondutaModal');
    $(document).on('click', '#btnSalvarAnamneseCondutaModal', function() {
        const $botao = $(this);
        const textoOriginal = $botao.html();
        
        // Mostrar loading
        $botao.html('<span class="spinner-border spinner-border-sm me-1"></span>Salvando...').prop('disabled', true);
        
        const dadosAtualizados = {
            anamnese_exame_fisico: $('#anamneseModalEdit').val(),
            conduta: $('#condutaModalEdit').val()
        };
        
        const atendimentoId = $('#atendimento_id').val();
        
        $.ajax({
            url: `/api/internacao/${atendimentoId}/anamnese-conduta`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dadosAtualizados),
            timeout: 15000
        })
        .done(function(response) {
            if (response.success) {
                // Atualizar cache
                dadosCache.anamnese = dadosAtualizados;
                
                // Atualizar interface
                atualizarVisualizacaoAnamnese(dadosAtualizados);
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalAnamneseConduta'));
                modal.hide();
                
                // Mostrar sucesso
                mostrarSucesso('#anamnese-pane', 'Anamnese e conduta atualizadas com sucesso!');
                
                console.log('Anamnese/Conduta salva com sucesso');
            } else {
                mostrarErro('#anamnese-pane', response.message || 'Erro desconhecido ao salvar');
            }
        })
        .fail(function(xhr) {
            let mensagem = 'Erro ao salvar anamnese e conduta';
            try {
                const response = JSON.parse(xhr.responseText);
                mensagem = response.message || mensagem;
            } catch (e) {}
            mostrarErro('#anamnese-pane', mensagem);
        })
        .always(function() {
            // Restaurar botão
            $botao.html(textoOriginal).prop('disabled', false);
        });
    });
    
    // Handler para botão editar Diagnóstico
    $(document).off('click', '#btnEditarDiagnostico');
    $(document).on('click', '#btnEditarDiagnostico', function(e) {
        e.preventDefault();
        console.log('Abrindo modal de diagnóstico');
        
        // Criar modal se não existir
        criarModalDiagnostico();
        
        // Carregar dados atuais
        carregarDadosInternacao()
            .done(function(dados) {
                // Preencher campos do modal
                $('#diagnosticoInicialModalEdit').val(dadosCache.diagnostico.diagnostico_inicial);
                $('#cidPrincipalModalEdit').val(dadosCache.diagnostico.cid_principal);
                $('#diagnosticoAtualModalEdit').val(dadosCache.diagnostico.diagnostico);
                $('#cidSecundarioModalEdit').val(dadosCache.diagnostico.cid_10_secundario);
                $('#causasAssociadasModalEdit').val(dadosCache.diagnostico.cid_10_causas_associadas);
                
                // Abrir modal
                const modal = new bootstrap.Modal(document.getElementById('modalDiagnostico'));
                modal.show();
            })
            .fail(function() {
                mostrarErro('#diagnostico-pane', 'Erro ao carregar dados para edição');
            });
    });
    
    // Handler para salvar Diagnóstico
    $(document).off('click', '#btnSalvarDiagnosticoModal');
    $(document).on('click', '#btnSalvarDiagnosticoModal', function() {
        const $botao = $(this);
        const textoOriginal = $botao.html();
        
        // Mostrar loading
        $botao.html('<span class="spinner-border spinner-border-sm me-1"></span>Salvando...').prop('disabled', true);
        
        const dadosAtualizados = {
            diagnostico_inicial: $('#diagnosticoInicialModalEdit').val(),
            cid_principal: $('#cidPrincipalModalEdit').val(),
            diagnostico: $('#diagnosticoAtualModalEdit').val(),
            cid_10_secundario: $('#cidSecundarioModalEdit').val(),
            cid_10_causas_associadas: $('#causasAssociadasModalEdit').val()
        };
        
        const atendimentoId = $('#atendimento_id').val();
        
        $.ajax({
            url: `/api/internacao/${atendimentoId}/diagnostico`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dadosAtualizados),
            timeout: 15000
        })
        .done(function(response) {
            if (response.success) {
                // Atualizar cache
                dadosCache.diagnostico = dadosAtualizados;
                
                // Atualizar interface
                atualizarVisualizacaoDiagnostico(dadosAtualizados);
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalDiagnostico'));
                modal.hide();
                
                // Mostrar sucesso
                mostrarSucesso('#diagnostico-pane', 'Diagnóstico atualizado com sucesso!');
                
                console.log('Diagnóstico salvo com sucesso');
            } else {
                mostrarErro('#diagnostico-pane', response.message || 'Erro desconhecido ao salvar');
            }
        })
        .fail(function(xhr) {
            let mensagem = 'Erro ao salvar diagnóstico';
            try {
                const response = JSON.parse(xhr.responseText);
                mensagem = response.message || mensagem;
            } catch (e) {}
            mostrarErro('#diagnostico-pane', mensagem);
        })
        .always(function() {
            // Restaurar botão
            $botao.html(textoOriginal).prop('disabled', false);
        });
    });
    
    // Handler para botão editar Justificativas
    $(document).off('click', '#btnEditarJustificativas');
    $(document).on('click', '#btnEditarJustificativas', function(e) {
        e.preventDefault();
        console.log('Abrindo modal de justificativas');
        
        // Criar modal se não existir
        criarModalJustificativas();
        
        // Carregar dados atuais
        carregarDadosInternacao()
            .done(function(dados) {
                // Preencher campos do modal
                $('#sinaisSintomasModalEdit').val(dadosCache.justificativas.justificativa_internacao_sinais_e_sintomas);
                $('#condicoesModalEdit').val(dadosCache.justificativas.justificativa_internacao_condicoes);
                $('#resultadosModalEdit').val(dadosCache.justificativas.justificativa_internacao_principais_resultados_diagnostico);
                
                // Abrir modal
                const modal = new bootstrap.Modal(document.getElementById('modalJustificativas'));
                modal.show();
            })
            .fail(function() {
                mostrarErro('#justificativas-pane', 'Erro ao carregar dados para edição');
            });
    });
    
    // Handler para salvar Justificativas
    $(document).off('click', '#btnSalvarJustificativasModal');
    $(document).on('click', '#btnSalvarJustificativasModal', function() {
        const $botao = $(this);
        const textoOriginal = $botao.html();
        
        // Mostrar loading
        $botao.html('<span class="spinner-border spinner-border-sm me-1"></span>Salvando...').prop('disabled', true);
        
        const dadosAtualizados = {
            justificativa_internacao_sinais_e_sintomas: $('#sinaisSintomasModalEdit').val(),
            justificativa_internacao_condicoes: $('#condicoesModalEdit').val(),
            justificativa_internacao_principais_resultados_diagnostico: $('#resultadosModalEdit').val()
        };
        
        const atendimentoId = $('#atendimento_id').val();
        
        $.ajax({
            url: `/api/internacao/${atendimentoId}/justificativas`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dadosAtualizados),
            timeout: 15000
        })
        .done(function(response) {
            if (response.success) {
                // Atualizar cache
                dadosCache.justificativas = dadosAtualizados;
                
                // Atualizar interface
                atualizarVisualizacaoJustificativas(dadosAtualizados);
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalJustificativas'));
                modal.hide();
                
                // Mostrar sucesso
                mostrarSucesso('#justificativas-pane', 'Justificativas atualizadas com sucesso!');
                
                console.log('Justificativas salvas com sucesso');
            } else {
                mostrarErro('#justificativas-pane', response.message || 'Erro desconhecido ao salvar');
            }
        })
        .fail(function(xhr) {
            let mensagem = 'Erro ao salvar justificativas';
            try {
                const response = JSON.parse(xhr.responseText);
                mensagem = response.message || mensagem;
            } catch (e) {}
            mostrarErro('#justificativas-pane', mensagem);
        })
        .always(function() {
            // Restaurar botão
            $botao.html(textoOriginal).prop('disabled', false);
        });
    });
    
    // ======================
    // EVENTOS DAS ABAS
    // ======================
    
    // Carregar dados quando as abas forem clicadas
    $(document).on('click', '#anamnese-tab', function() {
        if (!dadosCache.anamnese) {
            carregarDadosInternacao()
                .done(function() {
                    atualizarVisualizacaoAnamnese();
                })
                .fail(function() {
                    mostrarErro('#anamnese-pane', 'Erro ao carregar dados da anamnese');
                });
        } else {
            atualizarVisualizacaoAnamnese();
        }
    });
    
    $(document).on('click', '#diagnostico-tab', function() {
        if (!dadosCache.diagnostico) {
            carregarDadosInternacao()
                .done(function() {
                    atualizarVisualizacaoDiagnostico();
                })
                .fail(function() {
                    mostrarErro('#diagnostico-pane', 'Erro ao carregar dados do diagnóstico');
                });
        } else {
            atualizarVisualizacaoDiagnostico();
        }
    });
    
    $(document).on('click', '#justificativas-tab', function() {
        if (!dadosCache.justificativas) {
            carregarDadosInternacao()
                .done(function() {
                    atualizarVisualizacaoJustificativas();
                })
                .fail(function() {
                    mostrarErro('#justificativas-pane', 'Erro ao carregar dados das justificativas');
                });
        } else {
            atualizarVisualizacaoJustificativas();
        }
    });
    
    // ======================
    // INICIALIZAÇÃO
    // ======================
    
    // Carregar dados iniciais se alguma aba já estiver ativa
    setTimeout(function() {
        if ($('#anamnese-tab').hasClass('active')) {
            $('#anamnese-tab').click();
        }
        
        if ($('#diagnostico-tab').hasClass('active')) {
            $('#diagnostico-tab').click();
        }
        
        if ($('#justificativas-tab').hasClass('active')) {
            $('#justificativas-tab').click();
        }
    }, 500);
    
    console.log('Sistema de modais médicos inicializado com sucesso!');
}); 