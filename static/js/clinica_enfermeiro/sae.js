// Arquivo: sae.js
// Responsável pelas funcionalidades relacionadas à Sistematização da Assistência de Enfermagem (SAE)

// Função para carregar dados da SAE
function carregarSAE() {
    console.log('Carregando dados da SAE para internacaoId:', window.internacaoId);
    
    if (!window.internacaoId || isNaN(window.internacaoId)) {
        console.error('ID de internação inválido ao carregar SAE:', window.internacaoId);
        $('#listaSAE').html('<div class="alert alert-danger">Erro: ID de internação inválido</div>');
        return;
    }
    
    $.ajax({
        url: `/api/enfermagem/sae/${window.internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (Array.isArray(response) && response.length > 0) {
                renderizarListaSAE(response);
            } else {
                $('#listaSAE').html('<div class="alert alert-info">Nenhum registro de SAE encontrado para este paciente.</div>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar dados da SAE:', xhr.responseText);
            $('#listaSAE').html('<div class="alert alert-danger">Erro ao carregar dados da SAE.</div>');
        }
    });
}

// Função para renderizar a lista de SAEs
function renderizarListaSAE(saeList) {
    let html = '';
    
    // Ordenar por data, mais recente primeiro
    saeList.sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro));
    
    saeList.forEach(sae => {
        const dataFormatada = new Date(sae.data_registro).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="card mb-3">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">SAE - ${dataFormatada}</h5>
                    <span>${sae.enfermeiro_nome || 'Enfermeiro não informado'}</span>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <h6 class="fw-bold">Sinais Vitais</h6>
                            <div class="row">
                                <div class="col-md-2 mb-2"><strong>PA:</strong> ${sae.pa || '-'}</div>
                                <div class="col-md-2 mb-2"><strong>FC:</strong> ${sae.fc || '-'}</div>
                                <div class="col-md-2 mb-2"><strong>SAT:</strong> ${sae.sat || '-'}</div>
                                <div class="col-md-2 mb-2"><strong>R:</strong> ${sae.r || '-'}</div>
                                <div class="col-md-2 mb-2"><strong>T:</strong> ${sae.t || '-'}</div>
                                <div class="col-md-2 mb-2"><strong>Pulso:</strong> ${sae.pulso || '-'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6 class="fw-bold">Hipótese Diagnóstica</h6>
                            <p>${sae.hipotese_diagnostica || '-'}</p>
                        </div>
                        <div class="col-md-6">
                            <h6 class="fw-bold">DX</h6>
                            <p>${sae.dx || '-'}</p>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <h6 class="fw-bold">Medicação</h6>
                            <p>${sae.medicacao || '-'}</p>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6 class="fw-bold">Alergias</h6>
                            <p>${sae.alergias || '-'}</p>
                        </div>
                        <div class="col-md-6">
                            <h6 class="fw-bold">Antecedentes Pessoais</h6>
                            <p>${sae.antecedentes_pessoais || '-'}</p>
                        </div>
                    </div>
                    
                    <div class="accordion" id="avaliacaoFisica${sae.id}">
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAvaliacao${sae.id}">
                                    <strong>Avaliação Física</strong>
                                </button>
                            </h2>
                            <div id="collapseAvaliacao${sae.id}" class="accordion-collapse collapse" data-bs-parent="#avaliacaoFisica${sae.id}">
                                <div class="accordion-body">
                                    <div class="row mb-2">
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Sistema Neurológico</h6>
                                            <p>${sae.sistema_neurologico || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Estado Geral</h6>
                                            <p>${sae.estado_geral || '-'}</p>
                                        </div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Ventilação</h6>
                                            <p>${sae.ventilacao || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Pele</h6>
                                            <p>${sae.pele || '-'}</p>
                                        </div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Sistema Gastrointestinal</h6>
                                            <p>${sae.sistema_gastrointerstinal || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Regulação Vascular</h6>
                                            <p>${sae.regulacao_vascular || '-'}</p>
                                        </div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Regulação Abdominal</h6>
                                            <p>${sae.regulacao_abdominal || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">RHA</h6>
                                            <p>${sae.rha || '-'}</p>
                                        </div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Sistema Urinário</h6>
                                            <p>${sae.sistema_urinario || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6 class="fw-bold">Acesso Venoso</h6>
                                            <p>${sae.acesso_venoso || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-md-12">
                            <h6 class="fw-bold">Diagnóstico de Enfermagem</h6>
                            <p>${sae.diagnostico_de_enfermagem || '-'}</p>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-12">
                            <h6 class="fw-bold">Observações</h6>
                            <p>${sae.observacao || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    $('#listaSAE').html(html);
}

// Função para salvar novo registro de SAE
function salvarSAE(dados) {
    $.ajax({
        url: '/api/enfermagem/sae',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            if (response.success) {
                // Fechar modal e limpar campos
                $('#modalSAE').modal('hide');
                limparFormularioSAE();
                
                // Recarregar dados
                carregarSAE();
                
                // Mostrar mensagem de sucesso
                alert('SAE registrada com sucesso!');
            } else {
                alert('Erro ao registrar SAE: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao registrar SAE:', xhr.responseText);
            alert('Erro de comunicação ao tentar registrar SAE: ' + (xhr.responseJSON?.error || error));
        }
    });
}

// Função para limpar o formulário de SAE
function limparFormularioSAE() {
    // Limpar todos os campos do formulário
    $('#formSAE')[0].reset();
}

// Inicialização e configuração dos eventos
$(document).ready(function() {
    // Carregar SAE ao iniciar
    carregarSAE();
    
    // Submissão do formulário de SAE
    $('#formSAE').on('submit', function(e) {
        e.preventDefault();
        
        // Validar os campos obrigatórios
        const camposObrigatorios = [
            'sae_pa', 'sae_fc', 'sae_sat', 'sae_r', 'sae_t', 'sae_pulso', 
            'sae_hipotese_diagnostica', 'sae_dx', 'sae_medicacao', 
            'sae_alergias', 'sae_antecedentes_pessoais',
            'sae_sistema_neurologico', 'sae_estado_geral', 'sae_ventilacao', 'sae_pele',
            'sae_sistema_gastrointerstinal', 'sae_regulacao_vascular',
            'sae_regulacao_abdominal', 'sae_rha', 'sae_sistema_urinario', 'sae_acesso_venoso',
            'sae_diagnostico_de_enfermagem', 'sae_observacao'
        ];
        
        let camposVazios = [];
        camposObrigatorios.forEach(campo => {
            if (!$('#' + campo).val().trim()) {
                camposVazios.push(campo);
                $('#' + campo).addClass('is-invalid');
            } else {
                $('#' + campo).removeClass('is-invalid');
            }
        });
        
        if (camposVazios.length > 0) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Mostrar carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
        btnSubmit.prop('disabled', true);
        
        // Coletar dados do formulário
        const dados = {
            atendimentos_clinica_id: window.internacaoId,
            funcionario_id: parseInt(window.session.user_id),
            paciente_id: $('#sae_paciente_id').val(),
            pa: $('#sae_pa').val(),
            fc: $('#sae_fc').val(),
            sat: $('#sae_sat').val(),
            r: $('#sae_r').val(),
            t: $('#sae_t').val(),
            pulso: $('#sae_pulso').val(),
            hipotese_diagnostica: $('#sae_hipotese_diagnostica').val(),
            dx: $('#sae_dx').val(),
            medicacao: $('#sae_medicacao').val(),
            alergias: $('#sae_alergias').val(),
            antecedentes_pessoais: $('#sae_antecedentes_pessoais').val(),
            sistema_neurologico: $('#sae_sistema_neurologico').val(),
            estado_geral: $('#sae_estado_geral').val(),
            ventilacao: $('#sae_ventilacao').val(),
            pele: $('#sae_pele').val(),
            sistema_gastrointerstinal: $('#sae_sistema_gastrointerstinal').val(),
            regulacao_vascular: $('#sae_regulacao_vascular').val(),
            regulacao_abdominal: $('#sae_regulacao_abdominal').val(),
            rha: $('#sae_rha').val(),
            sistema_urinario: $('#sae_sistema_urinario').val(),
            acesso_venoso: $('#sae_acesso_venoso').val(),
            diagnostico_de_enfermagem: $('#sae_diagnostico_de_enfermagem').val(),
            observacao: $('#sae_observacao').val()
        };
        
        // Enviar dados para a API
        salvarSAE(dados);
        
        // Restaurar botão
        btnSubmit.html(textoOriginal);
        btnSubmit.prop('disabled', false);
    });
}); 