// Função para abrir o modal e carregar os horários
function abrirCalendarioAprazamento(prescricaoId, medicamentoIndex, medicamentoNome) {
    // Exibir carregamento enquanto busca dados
    $('#modalVisualizarAprazamentoTitulo').text(`Horários do medicamento: ${medicamentoNome}`);
    $('#modalVisualizarAprazamentoBody').html('<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando horários...</p>');

    // Abrir o modal
    $('#modalVisualizarAprazamento').modal('show');

    // Buscar os horários via AJAX
    $.ajax({
        url: `/api/prescricoes/aprazamento_horarios/${prescricaoId}/${medicamentoIndex}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API:', response);

            if (response.success && response.horarios && response.horarios.length > 0) {
                // Agrupar horários por data
                const horariosPorData = {};
                response.horarios.forEach(horario => {
                    // Extrair data e hora do horário (formato esperado: DD/MM/YYYY HH:MM)
                    const [data, hora] = horario.horario.split(' ');
                    if (!horariosPorData[data]) {
                        horariosPorData[data] = [];
                    }
                    horariosPorData[data].push({
                        hora: hora,
                        status: horario.status,
                        enfermeiro: horario.enfermeiro,
                        dataRealizacao: horario.data_realizacao
                    });
                });

                // Gerar HTML agrupado por data
                let html = '<div class="accordion" id="accordionAprazamentos">';
                
                // Ordenar datas
                const datas = Object.keys(horariosPorData).sort((a, b) => {
                    const [diaA, mesA, anoA] = a.split('/').map(Number);
                    const [diaB, mesB, anoB] = b.split('/').map(Number);
                    return new Date(anoA, mesA-1, diaA) - new Date(anoB, mesB-1, diaB);
                });

                datas.forEach((data, index) => {
                    const horariosDoDia = horariosPorData[data];
                    const isHoje = data === new Date().toLocaleDateString('pt-BR');
                    const headerClass = isHoje ? 'bg-info text-white' : '';
                    
                    html += `
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button ${isHoje ? '' : 'collapsed'} ${headerClass}" 
                                        type="button" 
                                        data-bs-toggle="collapse" 
                                        data-bs-target="#collapse${index}">
                                    ${data} ${isHoje ? '(Hoje)' : ''}
                                    <span class="badge bg-primary ms-2">${horariosDoDia.length} horários</span>
                                </button>
                            </h2>
                            <div id="collapse${index}" 
                                 class="accordion-collapse collapse ${isHoje ? 'show' : ''}" 
                                 data-bs-parent="#accordionAprazamentos">
                                <div class="accordion-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-striped table-bordered mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Horário</th>
                                                    <th>Status</th>
                                                    <th>Enfermeiro</th>
                                                    <th>Data Realização</th>
                                                </tr>
                                            </thead>
                                            <tbody>`;

                    // Ordenar horários
                    horariosDoDia.sort((a, b) => a.hora.localeCompare(b.hora));

                    horariosDoDia.forEach(horario => {
                        const statusClass = horario.status === 'Realizado' ? 'bg-success' : 'bg-warning';
                        html += `
                            <tr>
                                <td class="text-center">${horario.hora}</td>
                                <td class="text-center">
                                    <span class="badge ${statusClass}">
                                        ${horario.status}
                                    </span>
                                </td>
                                <td>${horario.enfermeiro || '-'}</td>
                                <td>${horario.dataRealizacao || '-'}</td>
                            </tr>`;
                    });

                    html += `
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });

                html += '</div>';

                // Adicionar resumo
                const totalHorarios = response.horarios.length;
                const realizados = response.horarios.filter(h => h.status === 'Realizado').length;
                const pendentes = totalHorarios - realizados;

                html += `
                    <div class="card mt-3">
                        <div class="card-body">
                            <h6 class="card-title">Resumo</h6>
                            <div class="d-flex justify-content-around">
                                <div>
                                    <strong>Total:</strong> ${totalHorarios} horários
                                </div>
                                <div>
                                    <span class="text-success">
                                        <i class="fas fa-check-circle"></i> ${realizados} realizados
                                    </span>
                                </div>
                                <div>
                                    <span class="text-warning">
                                        <i class="fas fa-clock"></i> ${pendentes} pendentes
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>`;

                $('#modalVisualizarAprazamentoBody').html(html);
            } else {
                $('#modalVisualizarAprazamentoBody').html(`
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Nenhum horário de aprazamento encontrado para este medicamento.
                    </div>`);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar horários:', xhr.responseText);
            $('#modalVisualizarAprazamentoBody').html(`
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Erro ao carregar horários: ${error}
                </div>`);
        }
    });
}

// Adicionar listener para os botões de visualização de aprazamento
$(document).ready(function() {
    $(document).on('click', '.btn-visualizar-aprazamento', function() {
        const prescricaoId = $(this).data('prescricao-id');
        const medicamentoIndex = $(this).data('medicamento-index');
        const medicamentoNome = $(this).data('medicamento-nome');

        console.log('Visualizar aprazamento para:', {
            prescricaoId,
            medicamentoIndex,
            medicamentoNome
        });

        abrirCalendarioAprazamento(prescricaoId, medicamentoIndex, medicamentoNome);
    });
}); 