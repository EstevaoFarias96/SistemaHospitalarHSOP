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
                                    <p>PA: ${sae.pa} | FC: ${sae.fc} | SAT: ${sae.sat} | R: ${sae.r} | T: ${sae.t} | Pulso: ${sae.pulso}</p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6 class="fw-bold">Hipótese Diagnóstica</h6>
                                    <p>${sae.hipotese_diagnostica}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="fw-bold">DX</h6>
                                    <p>${sae.dx}</p>
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
            hipotese_diagnostica: $('#sae_hipotese_diagnostica').val(),
            pa: $('#sae_pa').val(),
            fc: $('#sae_fc').val(),
            sat: $('#sae_sat').val(),
            dx: $('#sae_dx').val(),
            r: $('#sae_r').val(),
            t: $('#sae_t').val(),
            medicacao: $('#sae_medicacao').val(),
            alergias: $('#sae_alergias').val(),
            antecedentes_pessoais: $('#sae_antecedentes_pessoais').val(),
            sistema_neurologico: $('#sae_sistema_neurologico').val(),
            estado_geral: $('#sae_estado_geral').val(),
            ventilacao: $('#sae_ventilacao').val(),
            diagnostico_de_enfermagem: $('#sae_diagnostico_de_enfermagem').val(),
            pele: $('#sae_pele').val(),
            sistema_gastrointerstinal: $('#sae_sistema_gastrointerstinal').val(),
            regulacao_vascular: $('#sae_regulacao_vascular').val(),
            pulso: $('#sae_pulso').val(),
            regulacao_abdominal: $('#sae_regulacao_abdominal').val(),
            rha: $('#sae_rha').val(),
            sistema_urinario: $('#sae_sistema_urinario').val(),
            acesso_venoso: $('#sae_acesso_venoso').val(),
            observacao: $('#sae_observacao').val()
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