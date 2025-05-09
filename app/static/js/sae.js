// Função auxiliar para coletar valores de checkboxes com prefixo no id
function getCheckboxValues(prefix) {
    return $(`input[id^="${prefix}"]:checked`).map(function() {
        return $(this).next('label').text();
    }).get().join(', ');
}

// Função auxiliar para coletar valor de radios
function getRadioValue(name) {
    return $(`input[name="${name}"]:checked`).val() || '';
}

// Função para carregar dados da SAE
function carregarSAE() {
    const pacienteId = $('#sae_paciente_id').val();
    
    $.ajax({
        url: `/api/enfermagem/sae/${pacienteId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const sae = response.sae;
                
                // Formatar a exibição dos dados da SAE
                let html = `
                    <div class="card">
                        <div class="card-header bg-light">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">SAE - ${sae.data_registro}</h6>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <h6 class="fw-bold">Sinais Vitais</h6>
                                    <p>PA: ${sae.pa} | FC: ${sae.fc} | SAT: ${sae.sat} | R: ${sae.r} | T: ${sae.t} | Pulso: ${sae.pulso} | DX: ${sae.dx}</p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <h6 class="fw-bold">Sistema Neurológico</h6>
                                    <p>${sae.sistema_neurologico}</p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <h6 class="fw-bold">Diagnóstico de Enfermagem</h6>
                                    <p>${sae.diagnostico_de_enfermagem}</p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <h6 class="fw-bold">Observações</h6>
                                    <p>${sae.observacao}</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                
                $('#listaSAE').html(html);
            } else {
                $('#listaSAE').html('<p class="text-center text-muted">Nenhuma SAE registrada para este paciente.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar SAE:', error);
            $('#listaSAE').html('<p class="text-center text-danger">Erro ao carregar dados da SAE.</p>');
        }
    });
}

// Submissão do formulário SAE
$(document).ready(function() {
    $('#formSAE').on('submit', function(e) {
        e.preventDefault();
        
        // Coletar todos os dados do formulário
        const dados = {
            paciente_id: $('#sae_paciente_id').val(),
            enfermeiro_id: 1, // Ajustar para o ID do enfermeiro logado (pode ser dinâmico no backend)
            pa: $('#sae_pa').val(),
            fc: $('#sae_fc').val(),
            sat: $('#sae_sat').val(),
            dx: $('#sae_dx').val(), // Dextro/glicemia capilar
            r: $('#sae_r').val(),
            t: $('#sae_t').val(),
            pulso: getCheckboxValues('sae_pulso'),
            sistema_neurologico: getCheckboxValues('sae_neuro'),
            estado_geral: getRadioValue('sae_estado_geral'),
            ventilacao: getCheckboxValues('sae_ventilacao') + ( $('#sae_ventilacao_o2').val() ? ' O2: ' + $('#sae_ventilacao_o2').val() : ''),
            pele: getCheckboxValues('sae_pele'),
            sistema_gastrointerstinal: getCheckboxValues('sae_gi'),
            regulacao_vascular: getCheckboxValues('sae_vascular'),
            regulacao_abdominal: getCheckboxValues('sae_abdominal'),
            rha: getRadioValue('sae_rha'),
            sistema_urinario: getCheckboxValues('sae_urinario'),
            diagnostico_de_enfermagem: getCheckboxValues('sae_dx') + ( $('#sae_dx_outros').val() ? ', Outros: ' + $('#sae_dx_outros').val() : ''),
            medicacao: $('#sae_medicacao').val(),
            alergias: $('#sae_alergias').val(),
            antecedentes_pessoais: $('#sae_antecedentes_pessoais').val(),
            acesso_venoso: $('#sae_acesso_venoso').val(),
            observacao: $('#sae_observacao').val(),
            hipotese_diagnostica: '' // Não usado (DX não é hipótese diagnóstica)
        };
        
        // Mostrar indicador de carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
        btnSubmit.prop('disabled', true);
        
        // Enviar dados para a API
        $.ajax({
            url: '/api/enfermagem/sae',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function(response) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                if (response.success) {
                    // Fechar modal e limpar campos
                    $('#modalSAE').modal('hide');
                    $('#formSAE')[0].reset();
                    
                    // Recarregar dados da SAE
                    carregarSAE();
                    
                    // Mostrar mensagem de sucesso
                    alert('SAE registrada com sucesso!');
                } else {
                    alert('Erro ao registrar SAE: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function(xhr, status, error) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                console.error('Erro ao registrar SAE:', xhr.responseText);
                alert('Erro de comunicação ao tentar registrar SAE: ' + (xhr.responseJSON?.message || error));
            }
        });
    });

    // Carregar SAE ao iniciar
    carregarSAE();
});
