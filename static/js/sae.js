// Arquivo: sae.js
// Responsável por gerenciar a Sistematização da Assistência de Enfermagem (SAE)

// Função para carregar SAE do paciente
function carregarSAE() {
    const pacienteId = $('#sae_paciente_id').val();
    
    $.ajax({
        url: `/api/enfermagem/sae/${pacienteId}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.sae) {
                let html = '';
                response.sae.forEach(sae => {
                    const data = new Date(sae.data_registro).toLocaleString('pt-BR');
                    
                    html += `
                        <div class="card mb-3">
                            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">SAE - ${data}</h6>
                                <span class="text-muted small">${sae.enfermeiro_nome || 'Não informado'}</span>
                            </div>
                            <div class="card-body">
                                <div class="row g-3">
                                    <!-- Sinais Vitais -->
                                    <div class="col-12">
                                        <h6 class="fw-bold">Sinais Vitais</h6>
                                        <div class="row g-2">
                                            <div class="col-md-2"><strong>PA:</strong> ${sae.pa || '-'}</div>
                                            <div class="col-md-2"><strong>FC:</strong> ${sae.fc || '-'}</div>
                                            <div class="col-md-2"><strong>SAT:</strong> ${sae.sat || '-'}</div>
                                            <div class="col-md-2"><strong>R:</strong> ${sae.r || '-'}</div>
                                            <div class="col-md-2"><strong>T:</strong> ${sae.t || '-'}</div>
                                            <div class="col-md-2"><strong>Pulso:</strong> ${sae.pulso || '-'}</div>
                                            <div class="col-md-2"><strong>DX:</strong> ${sae.dx || '-'} mg/dL</div>
                                        </div>
                                    </div>

                                    <!-- Hipótese Diagnóstica -->
                                    <div class="col-12">
                                        <h6 class="fw-bold">Hipótese Diagnóstica</h6>
                                        <p>${sae.hipotese_diagnostica || '-'}</p>
                                    </div>

                                    <!-- Informações Adicionais -->
                                    <div class="col-12">
                                        <h6 class="fw-bold">Informações Adicionais</h6>
                                        <div class="row g-2">
                                            <div class="col-md-6"><strong>Medicação:</strong> ${sae.medicacao || '-'}</div>
                                            <div class="col-md-6"><strong>Alergias:</strong> ${sae.alergias || '-'}</div>
                                            <div class="col-md-6"><strong>Antecedentes Pessoais:</strong> ${sae.antecedentes_pessoais || '-'}</div>
                                            <div class="col-md-6"><strong>Acesso Venoso:</strong> ${sae.acesso_venoso || '-'}</div>
                                        </div>
                                    </div>

                                    <!-- Observações -->
                                    <div class="col-12">
                                        <h6 class="fw-bold">Observações</h6>
                                        <p>${sae.observacao || '-'}</p>
                                    </div>

                                    <!-- Avaliações -->
                                    <div class="col-12">
                                        <h6 class="fw-bold">Avaliações</h6>
                                        <div class="row g-2">
                                            <div class="col-md-6"><strong>Sistema Neurológico:</strong> ${sae.sistema_neurologico || '-'}</div>
                                            <div class="col-md-6"><strong>Estado Geral:</strong> ${sae.estado_geral || '-'}</div>
                                            <div class="col-md-6"><strong>Ventilação:</strong> ${sae.ventilacao || '-'}</div>
                                            <div class="col-md-6"><strong>Pele:</strong> ${sae.pele || '-'}</div>
                                            <div class="col-md-6"><strong>Sistema Gastrointestinal:</strong> ${sae.sistema_gastrointerstinal || '-'}</div>
                                            <div class="col-md-6"><strong>Regulação Vascular:</strong> ${sae.regulacao_vascular || '-'}</div>
                                            <div class="col-md-6"><strong>Regulação Abdominal:</strong> ${sae.regulacao_abdominal || '-'}</div>
                                            <div class="col-md-6"><strong>RHA:</strong> ${sae.rha || '-'}</div>
                                            <div class="col-md-6"><strong>Sistema Urinário:</strong> ${sae.sistema_urinario || '-'}</div>
                                        </div>
                                    </div>

                                    <!-- Diagnóstico de Enfermagem -->
                                    <div class="col-12">
                                        <h6 class="fw-bold">Diagnóstico de Enfermagem</h6>
                                        <p>${sae.diagnostico_de_enfermagem || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                $('#listaSAE').html(html);
            } else {
                $('#listaSAE').html('<p class="text-center text-muted">Nenhuma SAE registrada.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar SAE:', xhr.responseText);
            $('#listaSAE').html('<p class="text-center text-danger">Erro ao carregar SAE.</p>');
        }
    });
}

// Função para registrar nova SAE
function registrarSAE(dados) {
    // Enviar dados para o servidor
    $.ajax({
        url: '/api/enfermagem/sae',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            if (response.success) {
                $('#modalSAE').modal('hide');
                alert('SAE registrada com sucesso!');
                // Recarregar lista de SAE
                carregarSAE();
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

// Função para obter valores de checkboxes agrupados
function getCheckboxValues(prefix) {
    const values = [];
    $(`input[id^=${prefix}]:checked`).each(function() {
        values.push($(this).next('label').text().trim());
    });
    return values.join(', ');
}

// Função para obter valor de radio buttons
function getRadioValue(name) {
    return $(`input[name=${name}]:checked`).val() || '';
}

// Preparar dados para envio
const dados = {
    paciente_id: $('#sae_paciente_id').val(),
    enfermeiro_id: parseInt("{{ session.get('user_id', 0) }}", 10),
    pa: $('#sae_pa').val(),
    fc: $('#sae_fc').val(),
    sat: $('#sae_sat').val(),
    r: $('#sae_r').val(),
    t: $('#sae_t').val(),
    pulso: $('#sae_pulso').val(),
    dx: $('#sae_dx').val(),
    hipotese_diagnostica: $('#sae_hipotese_diagnostica').val(),
    
    // Campos de texto adicionais
    medicacao: $('#sae_medicacao').val(),
    alergias: $('#sae_alergias').val(),
    antecedentes_pessoais: $('#sae_antecedentes_pessoais').val(),
    acesso_venoso: $('#sae_acesso_venoso').val(),
    observacao: $('#sae_observacao').val(),
    
    // Campos agrupados
    sistema_neurologico: getCheckboxValues('sae_neuro_'),
    estado_geral: getRadioValue('sae_estado_geral'),
    ventilacao: getCheckboxValues('sae_ventilacao_'),
    pele: getCheckboxValues('sae_pele_'),
    sistema_gastrointerstinal: getCheckboxValues('sae_gi_'),
    regulacao_vascular: getCheckboxValues('sae_vascular_'),
    pulso_caracteristicas: getCheckboxValues('sae_pulso_'),
    regulacao_abdominal: getCheckboxValues('sae_abdominal_'),
    rha: getRadioValue('sae_rha'),
    sistema_urinario: getCheckboxValues('sae_urinario_'),
    diagnostico_de_enfermagem: getCheckboxValues('sae_dx_')
};

// Adicionar outros diagnósticos se houver
const outrosDiagnosticos = $('#sae_dx_outros').val().trim();
if (outrosDiagnosticos) {
    dados.diagnostico_de_enfermagem += (dados.diagnostico_de_enfermagem ? ', ' : '') + outrosDiagnosticos;
}

// Configurar eventos quando o documento estiver pronto
$(document).ready(function() {
    // Carregar SAE inicial se houver ID do paciente
    const pacienteId = $('#sae_paciente_id').val();
    if (pacienteId) {
        carregarSAE();
    }
    
    // Handler para submissão do formulário de SAE
    $('#formSAE').on('submit', function(e) {
        e.preventDefault();
        
        // Registrar SAE
        registrarSAE(dados);
    });
});
