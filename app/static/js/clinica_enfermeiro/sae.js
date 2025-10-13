// Arquivo: sae.js
// Responsável pelas funcionalidades relacionadas à Sistematização da Assistência de Enfermagem (SAE)
// VERSÃO SIMPLIFICADA - SEMPRE BUSCA A SAE MAIS RECENTE

// Função principal para carregar dados da SAE
function carregarSAE() {
    console.log('Carregando SAE mais recente para atendimento:', window.atendimentoId);
    
    if (!window.atendimentoId) {
        console.error('ID de atendimento não definido');
        $('#listaSAE').html('<div class="alert alert-danger">Erro: ID de atendimento não encontrado</div>');
        return;
    }
    
    // Primeiro, buscar dados da internação para obter o paciente_id
    $.ajax({
        url: `/api/internacao/${window.atendimentoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da internação:', response);
            
            if (response.success && response.internacao && response.internacao.paciente_id) {
                const pacienteId = response.internacao.paciente_id;
                console.log('Paciente ID encontrado:', pacienteId);
                
                // Buscar a SAE mais recente do paciente
                buscarSAEMaisRecente(pacienteId);
            } else {
                console.error('Dados da internação inválidos:', response);
                $('#listaSAE').html('<div class="alert alert-danger">Erro ao buscar dados da internação.</div>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar dados da internação:', xhr.responseText);
            $('#listaSAE').html('<div class="alert alert-danger">Erro ao carregar dados da internação.</div>');
        }
    });
}

// Função para buscar a SAE mais recente do paciente
function buscarSAEMaisRecente(pacienteId) {
    console.log('Buscando SAE mais recente para paciente:', pacienteId);
    
    $.ajax({
        url: `/api/enfermagem/sae/${pacienteId}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da SAE:', response);
            
            if (response.success && response.sae) {
                renderizarSAE(response.sae);
            } else {
                $('#listaSAE').html('<div class="alert alert-info"><i class="fas fa-info-circle"></i> Nenhuma SAE registrada para este paciente.</div>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar SAE:', xhr.responseText);
            
            if (xhr.status === 404) {
                $('#listaSAE').html('<div class="alert alert-info"><i class="fas fa-info-circle"></i> Nenhuma SAE registrada para este paciente.</div>');
            } else {
                $('#listaSAE').html('<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar SAE.</div>');
            }
        }
    });
}

// Função para renderizar a SAE na tela
function renderizarSAE(sae) {
    console.log('Renderizando SAE:', sae);
    
    const dataFormatada = moment(sae.data_registro).format('DD/MM/YYYY HH:mm');
    
    const html = `
    <div class="card mb-3">
        <div class="card-header bg-light">
            <div class="d-flex justify-content-between align-items-center">
                <span>
                    <i class="fas fa-calendar-alt me-2"></i>
                    <strong>SAE - ${dataFormatada}</strong>
                </span>
                <span>
                    <i class="fas fa-user-nurse me-2"></i>
                    ${sae.enfermeiro_nome || 'Enfermeiro Responsável'}
                </span>
            </div>
        </div>
        <div class="card-body">
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6 class="text-primary mb-3"><i class="fas fa-heartbeat me-2"></i>Sinais Vitais</h6>
                    <table class="table table-sm table-borderless">
                        <tr><td><strong>PA:</strong></td><td>${sae.pa || '-'}</td></tr>
                        <tr><td><strong>FC:</strong></td><td>${sae.fc || '-'}</td></tr>
                        <tr><td><strong>SAT:</strong></td><td>${sae.sat || '-'}</td></tr>
                        <tr><td><strong>R:</strong></td><td>${sae.r || '-'}</td></tr>
                        <tr><td><strong>T:</strong></td><td>${sae.t || '-'}</td></tr>
                        <tr><td><strong>DX:</strong></td><td>${sae.dx || '-'}</td></tr>
                    </table>
                </div>
                
                <div class="col-md-6">
                    <h6 class="text-primary mb-3"><i class="fas fa-user-check me-2"></i>Avaliação Geral</h6>
                    <p><strong>Estado Geral:</strong> ${sae.estado_geral || '-'}</p>
                    <p><strong>Sistema Neurológico:</strong> ${sae.sistema_neurologico || '-'}</p>
                    <p><strong>Ventilação:</strong> ${sae.ventilacao || '-'}</p>
                    <p><strong>Pele:</strong> ${sae.pele || '-'}</p>
                </div>
            </div>
            
            <hr>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6 class="text-primary mb-3"><i class="fas fa-stethoscope me-2"></i>Sistemas</h6>
                    <p><strong>Gastrointestinal:</strong> ${sae.sistema_gastrointerstinal || '-'}</p>
                    <p><strong>Regulação Vascular:</strong> ${sae.regulacao_vascular || '-'}</p>
                    <p><strong>Regulação Abdominal:</strong> ${sae.regulacao_abdominal || '-'}</p>
                    <p><strong>Sistema Urinário:</strong> ${sae.sistema_urinario || '-'}</p>
                    <p><strong>RHA:</strong> ${sae.rha || '-'}</p>
                </div>
                
                <div class="col-md-6">
                    <h6 class="text-primary mb-3"><i class="fas fa-notes-medical me-2"></i>Informações Clínicas</h6>
                    <p><strong>Medicação:</strong> ${sae.medicacao || '-'}</p>
                    <p><strong>Alergias:</strong> ${sae.alergias || '-'}</p>
                    <p><strong>Antecedentes Pessoais:</strong> ${sae.antecedentes_pessoais || '-'}</p>
                    <p><strong>Acesso Venoso:</strong> ${sae.acesso_venoso || '-'}</p>
                </div>
            </div>
            
            ${sae.hipotese_diagnostica ? `
            <hr>
            <div class="row mb-3">
                <div class="col-12">
                    <h6 class="text-primary mb-3"><i class="fas fa-diagnoses me-2"></i>Hipótese Diagnóstica</h6>
                    <p class="bg-light p-3 rounded">${sae.hipotese_diagnostica}</p>
                </div>
            </div>
            ` : ''}
            
            ${sae.diagnostico_de_enfermagem ? `
            <hr>
            <div class="row mb-3">
                <div class="col-12">
                    <h6 class="text-primary mb-3"><i class="fas fa-clipboard-check me-2"></i>Diagnóstico de Enfermagem</h6>
                    <p class="bg-light p-3 rounded">${sae.diagnostico_de_enfermagem}</p>
                </div>
            </div>
            ` : ''}
            
            ${sae.observacao ? `
            <hr>
            <div class="row">
                <div class="col-12">
                    <h6 class="text-primary mb-3"><i class="fas fa-comment-medical me-2"></i>Observações</h6>
                    <p class="bg-light p-3 rounded">${sae.observacao}</p>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    `;
    
    $('#listaSAE').html(html);
}

// Função para recarregar as SAEs após salvar (chamada externamente)
function recarregarSAE() {
    console.log('Recarregando SAE...');
    carregarSAE();
}

// Inicializar quando a página carregar
$(document).ready(function() {
    console.log('Inicializando módulo SAE...');
    carregarSAE();
    
    // Recarregar a cada 30 segundos para pegar atualizações
    setInterval(function() {
        console.log('Recarregamento automático da SAE...');
        carregarSAE();
    }, 30000);
});

// Exportar funções globalmente para uso externo
window.carregarSAE = carregarSAE;
window.recarregarSAE = recarregarSAE; 