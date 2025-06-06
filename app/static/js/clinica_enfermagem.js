// Se necessário, importe módulos JS via import ou inclua os scripts no HTML, não aqui.

/**
 * Configura o scroll moderno para elementos do editor Quill
 * @param {HTMLElement} container - Elemento container que contém os editores Quill
 */
function setupModernScroll(container) {
    if (!container) return;
    
    // Elementos que podem precisar de scroll
    const scrollElements = container.querySelectorAll('.ql-editor');
    
    scrollElements.forEach(element => {
        // Assegurar que o elemento tem estilo de overflow adequado
        element.style.overflowY = 'auto'
        element.style.maxHeight = '100%';
        
        // Observar redimensionamento do conteúdo
        const resizeObserver = new ResizeObserver(() => {
            // Ajustar posição de scroll quando o conteúdo mudar
            const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
            if (isAtBottom) {
                element.scrollTop = element.scrollHeight;
            }
        });
        
        // Observar mudanças no conteúdo
        const mutationObserver = new MutationObserver(() => {
            // Verificar se o scroll precisa ser ajustado
            const shouldScrollToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
            if (shouldScrollToBottom) {
                element.scrollTop = element.scrollHeight;
            }
        });
        
        // Iniciar observadores
        resizeObserver.observe(element);
        mutationObserver.observe(element, { 
            childList: true, 
            subtree: true, 
            characterData: true 
        });
        
        // Armazenar observadores para limpeza futura
        element._scrollObservers = {
            resize: resizeObserver,
            mutation: mutationObserver
        };
    });
}

/**
 * Verifica e aplica correções no editor Quill após o carregamento
 */
function checkQuillAndApplyFixes() {
    // Aguardar um momento para garantir que o Quill tenha carregado completamente
    setTimeout(() => {
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            setupModernScroll(editorContainer);
            console.log('Scroll moderno aplicado ao editor Quill');
        } else {
            console.log('Elemento editor-container não encontrado ao tentar aplicar scroll moderno');
        }
    }, 500);
}

/**
 * Limpa todos os campos do formulário de prescrição
 */
function limparFormularioPrescricao() {
    $('#prescricao_id').val('');
    $('#nome_medicamento').val('');
    $('#descricao_uso').val('');
    $('#aprazamento').val('');
    $('#texto_dieta').val('');
    $('#texto_procedimento_medico').val('');
    $('#texto_procedimento_multi').val('');
    $('#avisoAlergia').hide();
    medicamentosAdicionados = [];
    atualizarTabelaMedicamentos();
    $('#modalPrescricaoLabel').text('Nova Prescrição');
}

/**
 * Atualiza a tabela de medicamentos adicionados na prescrição
 */
function atualizarTabelaMedicamentos() {
    const tabela = $('#tabelaMedicamentosAdicionados tbody');
    
    if (medicamentosAdicionados.length === 0) {
        tabela.html('<tr id="semMedicamentos"><td colspan="4" class="text-center">Nenhum medicamento adicionado</td></tr>');
        return;
    }
    
    // Esconder a mensagem de "nenhum medicamento"
    $('#semMedicamentos').hide();
    
    // Limpar e reconstruir a tabela
    tabela.empty();
    
    medicamentosAdicionados.forEach((med, index) => {
        const aprazamentoFormatado = med.aprazamento ? 
            new Date(med.aprazamento).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
        
        tabela.append(`
            <tr data-index="${index}">
                <td>${med.nome_medicamento}</td>
                <td>${med.descricao_uso}</td>
                <td>${aprazamentoFormatado}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm btn-remover-medicamento">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
    
    // Adicionar event listeners para botões de remover
    $('.btn-remover-medicamento').click(function() {
        const index = $(this).closest('tr').data('index');
        medicamentosAdicionados.splice(index, 1);
        atualizarTabelaMedicamentos();
    });
}

/**
 * Edita uma prescrição existente
 * @param {number} prescricaoId - ID da prescrição a ser editada
 */
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
                            // Converter formato de data se necessário
                            let aprazamento = med.aprazamento;
                            if (aprazamento && typeof aprazamento === 'string') {
                                // Converter de DD/MM/YYYY HH:MM para YYYY-MM-DDTHH:MM
                                const partes = aprazamento.split(' ');
                                if (partes.length === 2) {
                                    const dataPartes = partes[0].split('/');
                                    if (dataPartes.length === 3) {
                                        aprazamento = `${dataPartes[2]}-${dataPartes[1]}-${dataPartes[0]}T${partes[1]}`;
                                    }
                                }
                            }
                            
                            medicamentosAdicionados.push({
                                nome_medicamento: med.nome_medicamento,
                                descricao_uso: med.descricao_uso,
                                aprazamento: aprazamento
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
                alert('Erro ao buscar prescrição: ' + (response.error || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar prescrição:', xhr.responseText);
            alert('Erro ao buscar prescrição: ' + error);
        }
    });
}

/**
 * Visualiza os aprazamentos de um medicamento específico
 * @param {number} atendimentoId - ID do atendimento
 * @param {string} nomeMedicamento - Nome do medicamento
 */
function visualizarAprazamentosMedicamento(atendimentoId, nomeMedicamento) {
    // Atualizar título do modal
    $('#modalAprazamentosMedicamentoLabel').text(`Aprazamentos: ${nomeMedicamento}`);
    
    // Mostrar modal
    $('#modalAprazamentosMedicamento').modal('show');
    
    // Buscar aprazamentos
    $.ajax({
        url: `/api/aprazamentos/atendimento/${atendimentoId}/medicamento/${encodeURIComponent(nomeMedicamento)}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.aprazamentos) {
                // Agrupar aprazamentos por data
                const aprazamentosPorData = {};
                response.aprazamentos.forEach(apr => {
                    const data = apr.data_hora_aprazamento.split(' ')[0];
                    if (!aprazamentosPorData[data]) {
                        aprazamentosPorData[data] = [];
                    }
                    aprazamentosPorData[data].push(apr);
                });

                let html = '';
                
                // Para cada data
                Object.keys(aprazamentosPorData).sort().forEach(data => {
                    const dataFormatada = new Date(data).toLocaleDateString('pt-BR');
                    
                    html += `
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">Data: ${dataFormatada}</h6>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-striped table-bordered mb-0">
                                        <thead class="table-primary">
                                            <tr>
                                                <th>Horário</th>
                                                <th>Status</th>
                                                <th>Enfermeiro</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                    `;

                    // Ordenar horários do dia
                    aprazamentosPorData[data].sort((a, b) => 
                        new Date(a.data_hora_aprazamento) - new Date(b.data_hora_aprazamento)
                    ).forEach(apr => {
                        const hora = apr.data_hora_aprazamento.split(' ')[1];
                        let statusClass, statusIcon, statusText;
                        
                        if (apr.realizado) {
                            statusClass = 'text-success';
                            statusIcon = 'fa-check-circle';
                            statusText = 'Realizado';
                        } else if (apr.atrasado) {
                            statusClass = 'text-danger';
                            statusIcon = 'fa-exclamation-circle';
                            statusText = 'Atrasado';
                        } else {
                            statusClass = 'text-warning';
                            statusIcon = 'fa-clock';
                            statusText = 'Pendente';
                        }

                        html += `
                            <tr>
                                <td class="align-middle">${hora}</td>
                                <td class="align-middle ${statusClass}">
                                    <i class="fas ${statusIcon}"></i> ${statusText}
                                </td>
                                <td class="align-middle">
                                    ${apr.enfermeiro_responsavel || '-'}
                                    ${apr.data_realizacao ? `<br><small class="text-muted">em ${new Date(apr.data_realizacao).toLocaleString('pt-BR')}</small>` : ''}
                                </td>
                                <td class="align-middle">
                        `;

                        if (!apr.realizado) {
                            html += `
                                <button class="btn btn-sm btn-success btn-realizar-aprazamento" 
                                        data-id="${apr.id}">
                                    <i class="fas fa-check"></i> Realizar
                                </button>
                            `;
                        }

                        html += `
                                </td>
                            </tr>
                        `;
                    });

                    html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                });

                // Adicionar resumo estatístico
                const totalAprazamentos = response.aprazamentos.length;
                const realizados = response.aprazamentos.filter(a => a.realizado).length;
                const atrasados = response.aprazamentos.filter(a => !a.realizado && a.atrasado).length;
                const pendentes = totalAprazamentos - realizados - atrasados;

                html += `
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Resumo dos Aprazamentos</h6>
                            <div class="row text-center">
                                <div class="col">
                                    <div class="p-3 border rounded bg-light">
                                        <div class="small text-muted">Total</div>
                                        <div class="h4 mb-0">${totalAprazamentos}</div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="p-3 border rounded bg-success bg-opacity-10">
                                        <div class="small text-success">Realizados</div>
                                        <div class="h4 mb-0">${realizados}</div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="p-3 border rounded bg-warning bg-opacity-10">
                                        <div class="small text-warning">Pendentes</div>
                                        <div class="h4 mb-0">${pendentes}</div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="p-3 border rounded bg-danger bg-opacity-10">
                                        <div class="small text-danger">Atrasados</div>
                                        <div class="h4 mb-0">${atrasados}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                $('#aprazamentosMedicamentoContent').html(html);

                // Configurar handlers dos botões
                $('.btn-realizar-aprazamento').click(function() {
                    const aprazamentoId = $(this).data('id');
                    
                    if (confirm('Confirma a realização deste aprazamento?')) {
                        const btnOriginal = $(this);
                        const htmlOriginal = btnOriginal.html();
                        btnOriginal.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Processando...');
                        
                        $.ajax({
                            url: `/api/aprazamentos/${aprazamentoId}/realizar`,
                            method: 'PUT',
                            success: function(response) {
                                if (response.success) {
                                    // Recarregar aprazamentos
                                    visualizarAprazamentosMedicamento(atendimentoId, nomeMedicamento);
                                    // Atualizar a visualização da prescrição
                                    carregarPrescricoes();
                                } else {
                                    alert('Erro ao realizar aprazamento: ' + response.message);
                                    btnOriginal.prop('disabled', false).html(htmlOriginal);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('Erro ao realizar aprazamento:', xhr.responseText);
                                alert('Erro ao realizar aprazamento. Por favor, tente novamente.');
                                btnOriginal.prop('disabled', false).html(htmlOriginal);
                            }
                        });
                    }
                });
            } else {
                $('#aprazamentosMedicamentoContent').html('<p class="text-muted text-center">Nenhum aprazamento encontrado.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar aprazamentos:', xhr.responseText);
            $('#aprazamentosMedicamentoContent').html('<p class="text-danger text-center">Erro ao carregar aprazamentos.</p>');
        }
    });
}

/**
 * Renderiza a tabela de medicamentos de uma prescrição
 * @param {Array} medicamentos - Lista de medicamentos
 * @param {Object} prescricao - Dados da prescrição
 * @returns {string} HTML da tabela de medicamentos
 */
function renderizarMedicamentosPrescricao(medicamentos, prescricao) {
    let html = `
        <div class="mt-3 mb-2">
            <h6><i class="fas fa-pills text-danger mr-1"></i> Medicamentos</h6>
            <table class="table table-sm table-bordered table-striped">
                <thead class="thead-light">
                    <tr>
                        <th>Medicamento</th>
                        <th>Uso</th>
                        <th>Aprazamento</th>
                        <th>Enfermeiro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    medicamentos.forEach(function(medicamento) {
        html += `<tr>
            <td>${medicamento.nome_medicamento || ''}</td>
            <td>${medicamento.descricao_uso || ''}</td>
            <td>`;

        // Verificar se tem aprazamentos_novos
        if (medicamento.aprazamentos_novos && medicamento.aprazamentos_novos.length > 0) {
            html += `<div class="d-flex justify-content-center gap-2">
                <button type="button" class="btn btn-sm btn-outline-info btn-visualizar-aprazamento" 
                    data-prescricao-id="${prescricao.id}" 
                    data-medicamento-index="${medicamentos.indexOf(medicamento)}" 
                    data-medicamento-nome="${medicamento.nome_medicamento.replace(/"/g, '&quot;')}">
                    <i class="fas fa-calendar-alt"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-primary btn-ver-aprazamentos"
                    data-atendimento-id="${prescricao.atendimentos_clinica_id}"
                    data-medicamento-nome="${medicamento.nome_medicamento.replace(/"/g, '&quot;')}">
                    <i class="fas fa-list"></i>
                </button>
            </div>`;
        } else {
            html += '<span class="text-muted">Não aprazado</span>';
        }

        html += `</td>
            <td>${medicamento.enfermeiro_nome || ''}</td>
            <td>`;

        if (window.cargoUsuario && window.cargoUsuario.toLowerCase().trim() === "enfermeiro") {
            html += `<button class="btn btn-primary btn-sm btn-aprazamento" 
                data-prescricao-id="${prescricao.id}" 
                data-medicamento-index="${medicamentos.indexOf(medicamento)}" 
                data-medicamento-nome="${medicamento.nome_medicamento.replace(/"/g, '&quot;')}">
                <i class="fas fa-clock"></i> Aprazar
            </button>`;
        }

        html += '</td></tr>';
    });

    html += '</tbody></table></div>';
    return html;
}

/**
 * Abre o modal do calendário de aprazamento para um medicamento
 * @param {number} prescricaoId - ID da prescrição
 * @param {number} medicamentoIndex - Índice do medicamento na lista
 * @param {string} medicamentoNome - Nome do medicamento
 */
function abrirCalendarioAprazamento(prescricaoId, medicamentoIndex, medicamentoNome) {
    // Atualizar título do modal
    $('#modalVisualizarAprazamentoTitulo').text(`Horários do medicamento: ${medicamentoNome}`);
    
    // Abrir o modal
    $('#modalVisualizarAprazamento').modal('show');
    
    // Chamar a função do módulo de calendário
    visualizarCalendarioAprazamento(prescricaoId, medicamentoIndex, medicamentoNome);
}

/**
 * Exporta o calendário de aprazamento como imagem PNG
 */
function exportarCalendarioComoImagem() {
    const element = document.getElementById('modalVisualizarAprazamentoBody');
    
    // Configurar opções do html2canvas
    const options = {
        scale: 2, // Melhor qualidade
        useCORS: true,
        backgroundColor: '#ffffff'
    };
    
    // Mostrar indicador de carregamento
    const loadingHtml = element.innerHTML;
    element.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Gerando imagem...</div>';
    
    // Usar html2canvas para converter o conteúdo em imagem
    html2canvas(element, options).then(canvas => {
        // Restaurar conteúdo original
        element.innerHTML = loadingHtml;
        
        // Criar link para download
        const link = document.createElement('a');
        link.download = 'aprazamentos.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(error => {
        console.error('Erro ao gerar imagem:', error);
        alert('Erro ao gerar imagem. Por favor, tente novamente.');
        element.innerHTML = loadingHtml;
    });
}

/**
 * Carrega as prescrições de enfermagem para uma internação específica
 */
function carregarPrescricoesEnfermagem() {
    const internacaoId = $('#internacao_id_prescricao').val();
    
    $.ajax({
        url: `/api/enfermagem/prescricao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            const tbody = $('#listaPrescricoesEnfermagem');
            tbody.empty();
            
            if (response && response.length > 0) {
                response.forEach(prescricao => {
                    const dataFormatada = new Date(prescricao.data_prescricao).toLocaleString('pt-BR');
                    
                    let html = `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${prescricao.enfermeiro_nome || 'Não informado'}</td>
                            <td>
                                <div class="texto-evolucao">
                                    ${prescricao.texto || '---'}
                                </div>
                            </td>
                            <td>`;
                    
                    if (window.cargoUsuario && window.cargoUsuario.toLowerCase().trim() === "enfermeiro") {
                        html += `
                            <button class="btn btn-sm btn-outline-primary btn-editar-prescricao-enfermagem" 
                                    data-id="${prescricao.id}" 
                                    data-texto="${prescricao.texto.replace(/"/g, '&quot;')}">
                                <i class="fas fa-edit"></i>
                            </button>`;
                    }
                    
                    html += `</td></tr>`;
                    tbody.append(html);
                });
            } else {
                tbody.html('<tr><td colspan="4" class="text-center">Nenhuma prescrição registrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar prescrições:', error);
            $('#listaPrescricoesEnfermagem').html(
                '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar prescrições.</td></tr>'
            );
        }
    });
}

/**
 * Inicializar o editor de texto rico para prescrições
 */
function initPrescricaoEnfermagemEditor() {
    try {
        // Verificar se o elemento editor-container existe antes de inicializar o Quill
        if (!document.querySelector('#editor-container')) {
            console.warn('Elemento #editor-container não encontrado. Pulando inicialização do Quill.');
            return;
        }
        
        // Inicializar o editor Quill
        quill = new Quill('#editor-container', {
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['clean']
                ]
            },
            placeholder: 'Digite a prescrição de enfermagem...',
            theme: 'snow'
        });

        // Aplicar correções de scroll e outros ajustes
        checkQuillAndApplyFixes();

        // Ao mudar o conteúdo do Quill, atualizar o textarea
        quill.on('text-change', function() {
            const html = quill.root.innerHTML;
            document.getElementById('texto_prescricao').value = html;
        });
    } catch (error) {
        console.error('Erro ao inicializar o editor Quill:', error);
        // Criar um fallback para o editor
        $('#editor-container').html('<textarea id="fallback-editor" class="form-control" rows="10" placeholder="Digite a prescrição de enfermagem..."></textarea>');
        
        // Atualizar o textarea oculto quando o fallback for alterado
        $('#fallback-editor').on('input', function() {
            $('#texto_prescricao').val($(this).val());
        });
    }
}

/**
 * Configurar os eventos para o formulário de prescrição
 */
function setupEventos() {
    // Botão de salvar prescrição
    const btnSalvarPrescricao = document.getElementById('btn-salvar-prescricao-enfermagem');
    if (btnSalvarPrescricao) {
        btnSalvarPrescricao.addEventListener('click', salvarPrescricaoEnfermagem);
    }
    
    // Botão para alternar visibilidade das prescrições antigas
    const btnTogglePrescricoesAntigas = document.getElementById('toggle-prescricoes-antigas');
    if (btnTogglePrescricoesAntigas) {
        btnTogglePrescricoesAntigas.addEventListener('click', function() {
            const container = document.getElementById('antigas-container-prescricao');
            const toggleText = document.getElementById('toggle-prescricoes-text');
            
            if (container.style.display === 'none') {
                container.style.display = 'block';
                toggleText.textContent = 'Ocultar Antigas';
                this.querySelector('i').classList.remove('fa-eye');
                this.querySelector('i').classList.add('fa-eye-slash');
            } else {
                container.style.display = 'none';
                toggleText.textContent = 'Mostrar Antigas';
                this.querySelector('i').classList.remove('fa-eye-slash');
                this.querySelector('i').classList.add('fa-eye');
            }
        });
    }
    
    // Botão para filtrar prescrições por data
    const btnFiltrarData = document.getElementById('btn-filtrar-data-prescricao');
    if (btnFiltrarData) {
        btnFiltrarData.addEventListener('click', function() {
            const dataFiltro = document.getElementById('filtro-data-prescricao').value;
            if (dataFiltro) {
                carregarPrescricoesEnfermagemPorData(dataFiltro);
            }
        });
    }
    
    // Botão para limpar filtro de data
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro-prescricao');
    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', function() {
            document.getElementById('filtro-data-prescricao').value = '';
            carregarPrescricoesEnfermagem();
        });
    }
    
    // Configurar o modal de prescrição para limpar ao fechar
    const modalPrescricao = document.getElementById('modalPrescricaoEnfermagem');
    if (modalPrescricao) {
        modalPrescricao.addEventListener('hidden.bs.modal', function() {
            resetFormPrescricaoEnfermagem();
        });
    }
}

/**
 * Resetar o formulário de prescrição de enfermagem
 */
function resetFormPrescricaoEnfermagem() {
    document.getElementById('prescricao_enfermagem_id').value = '';
    if (window.quillPrescricaoEnfermagem) {
        window.quillPrescricaoEnfermagem.setContents([]);
    }
    document.getElementById('prescricao_enfermagem_texto').value = '';
    document.getElementById('modalPrescricaoEnfermagemLabel').textContent = 'Nova Prescrição de Enfermagem';
}

/**
 * Salvar prescrição de enfermagem (nova ou edição)
 */
function salvarPrescricaoEnfermagem() {
    // Obter dados do formulário
    const prescricaoId = document.getElementById('prescricao_enfermagem_id').value;
    const internacaoId = document.getElementById('prescricao_enfermagem_internacao_id').value;
    const textoHtml = document.getElementById('prescricao_enfermagem_texto').value;
    
    // Validação simples
    if (!textoHtml || textoHtml.trim() === '') {
        alert('Por favor, digite a prescrição de enfermagem.');
        return;
    }
    
    // Obter ID do funcionário da sessão - simplificado
    let funcionarioId = null;
    
    // Primeiro, tentar obter do elemento hidden no formulário
    if (document.getElementById('usuario_id')) {
        funcionarioId = document.getElementById('usuario_id').value;
    } 
    // Se não encontrou, tentar da variável global session
    else if (typeof session !== 'undefined' && session.user_id) {
        funcionarioId = session.user_id;
    }
    // Se ainda não encontrou, tentar da variável window.enfermeiroId
    else if (typeof window.enfermeiroId !== 'undefined') {
        funcionarioId = window.enfermeiroId;
    }
    
    // Verificar se conseguimos um ID de funcionário
    if (!funcionarioId) {
        alert('Erro: ID do enfermeiro não encontrado. Por favor, faça login novamente.');
        return;
    }
    
    // Preparar dados para envio
    const dados = {
        atendimentos_clinica_id: internacaoId,
        funcionario_id: funcionarioId,
        texto: textoHtml
    };
    
    console.log('Enviando dados:', dados);
    
    // Configuração da requisição
    const config = {
        method: prescricaoId ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    };
    
    // URL da requisição (depende se é nova prescrição ou edição)
    const url = prescricaoId 
        ? `/api/enfermagem/prescricao/${prescricaoId}` 
        : '/api/enfermagem/prescricao';
    
    // Enviar a requisição
    fetch(url, config)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.erro || `Erro ${response.status}: ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.erro) {
                throw new Error(data.erro);
            }
            
            // Fechar o modal e recarregar as prescrições
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrescricaoEnfermagem'));
            modal.hide();
            
            // Recarregar as prescrições de enfermagem
            carregarPrescricoesEnfermagem();
            
            // Exibir mensagem de sucesso
            alert(prescricaoId ? 'Prescrição atualizada com sucesso!' : 'Prescrição registrada com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao salvar prescrição:', error);
            alert(`Erro ao salvar prescrição: ${error.message}`);
        });
}

/**
 * Carregar prescrições por data específica
 */
function carregarPrescricoesEnfermagemPorData(dataFiltro) {
    const internacaoId = document.getElementById('prescricao_enfermagem_internacao_id').value;
    
    fetch(`/api/enfermagem/prescricao/${internacaoId}`)
        .then(response => response.json())
        .then(prescricoes => {
            // Filtrar prescrições pela data selecionada
            const prescricoesFiltradas = prescricoes.filter(prescricao => 
                prescricao.data_prescricao.split('T')[0] === dataFiltro);
            
            // Atualizar título
            const titulo = document.getElementById('titulo-prescricoes-hoje');
            const dataFormatada = new Date(dataFiltro).toLocaleDateString('pt-BR');
            titulo.textContent = `Prescrições de ${dataFormatada}`;
            
            // Renderizar as prescrições filtradas
            renderizarPrescricoes(prescricoesFiltradas, 'listaPrescricoesDoDia', true);
            
            // Esconder prescrições antigas
            document.getElementById('antigas-container-prescricao').style.display = 'none';
            document.getElementById('toggle-prescricoes-text').textContent = 'Mostrar Antigas';
            document.querySelector('#toggle-prescricoes-antigas i').classList.remove('fa-eye-slash');
            document.querySelector('#toggle-prescricoes-antigas i').classList.add('fa-eye');
        })
        .catch(error => {
            console.error('Erro ao filtrar prescrições por data:', error);
            document.getElementById('listaPrescricoesDoDia').innerHTML = 
                '<tr><td colspan="3" class="text-danger">Erro ao filtrar prescrições.</td></tr>';
        });
}

/**
 * Renderizar as prescrições na tabela apropriada
 */
function renderizarPrescricoes(prescricoes, elementId, apenasHora) {
    const tbody = document.getElementById(elementId);
    
    if (!prescricoes || prescricoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">Nenhuma prescrição ${apenasHora ? 'hoje' : 'anterior'}.</td></tr>`;
        return;
    }
    
    // Ordenar prescrições (mais recentes primeiro)
    prescricoes.sort((a, b) => new Date(b.data_prescricao) - new Date(a.data_prescricao));
    
    // Gerar o HTML das linhas
    const html = prescricoes.map(prescricao => {
        const data = new Date(prescricao.data_prescricao);
        
        // Formatar a data/hora
        let dataHoraFormatada;
        if (apenasHora) {
            dataHoraFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            dataHoraFormatada = data.toLocaleDateString('pt-BR') + ' ' + 
                               data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Botão de edição (apenas para enfermeiros)
        const btnEditar = session.cargo.toLowerCase() === 'enfermeiro' 
            ? `<button class="btn btn-sm btn-outline-primary editar-prescricao" data-id="${prescricao.id}">
                   <i class="fas fa-edit"></i>
               </button>` 
            : '';
        
        return `
            <tr>
                <td>${dataHoraFormatada}</td>
                <td>${prescricao.enfermeiro_nome}</td>
                <td>
                    <div class="d-flex justify-content-between">
                        <div class="prescricao-content">${prescricao.texto}</div>
                        <div class="prescricao-actions">
                            ${btnEditar}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = html;
    
    // Adicionar eventos aos botões de edição
    const botoesEditar = document.querySelectorAll('.editar-prescricao');
    botoesEditar.forEach(botao => {
        botao.addEventListener('click', function() {
            const prescricaoId = this.getAttribute('data-id');
            editarPrescricaoEnfermagem(prescricaoId, prescricoes);
        });
    });
}

/**
 * Abrir o formulário para editar uma prescrição de enfermagem
 */
function editarPrescricaoEnfermagem(prescricaoId, prescricoes) {
    // Encontrar a prescrição pelo ID
    const prescricao = prescricoes.find(p => p.id.toString() === prescricaoId.toString());
    
    if (!prescricao) {
        console.error('Prescrição não encontrada:', prescricaoId);
        return;
    }
    
    // Preencher o formulário
    document.getElementById('prescricao_enfermagem_id').value = prescricao.id;
    document.getElementById('prescricao_enfermagem_texto').value = prescricao.texto;
    
    // Atualizar o editor Quill
    if (window.quillPrescricaoEnfermagem) {
        window.quillPrescricaoEnfermagem.root.innerHTML = prescricao.texto;
    }
    
    // Atualizar o título do modal
    document.getElementById('modalPrescricaoEnfermagemLabel').textContent = 'Editar Prescrição de Enfermagem';
    
    // Abrir o modal
    const modal = new bootstrap.Modal(document.getElementById('modalPrescricaoEnfermagem'));
    modal.show();
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o editor de texto rico para prescrições de enfermagem
    initPrescricaoEnfermagemEditor();
    
    // Carrega as prescrições de enfermagem
    carregarPrescricoesEnfermagem();
    
    // Configurar os eventos para o formulário de prescrição de enfermagem
    setupEventos();
});

/**
 * Módulo para gerenciar as evoluções de enfermagem
 */

// Função para configurar evoluções de enfermagem
function configurarEvolucoesEnfermagem() {
    // Inicialmente esconder o botão de limpar filtro
    $('#btn-limpar-filtro').hide();
    
    // Botão para filtrar evoluções por data
    $('#btn-filtrar-data').click(function() {
        const dataFiltro = $('#filtro-data').val();
        if (dataFiltro) {
            carregarEvolucoesEnfermagem(dataFiltro);
            // Mostrar botão limpar e esconder toggle quando filtrando
            $('#btn-limpar-filtro').show();
            $('#toggle-evolucoes-antigas').hide();
        } else {
            alert('Selecione uma data para filtrar');
        }
    });
    
    // Botão para limpar filtro
    $('#btn-limpar-filtro').click(function() {
        $('#filtro-data').val('');
        carregarEvolucoesEnfermagem();
        // Restaurar a visualização normal
        $('#btn-limpar-filtro').hide();
        $('#toggle-evolucoes-antigas').show();
    });
    
    // Toggle para mostrar/ocultar evoluções antigas
    $('#toggle-evolucoes-antigas').click(function() {
        const container = $('#antigas-container');
        if (container.is(':visible')) {
            container.hide();
            $('#toggle-evolucoes-text').text('Mostrar Antigas');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            container.show();
            $('#toggle-evolucoes-text').text('Ocultar Antigas');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });
    
    // Preparar o modal quando for aberto
    $('#modalEnfermagemEvolucao').on('shown.bs.modal', function() {
        console.log('Modal aberto, focando no textarea');
        // Esconder o div do editor Quill que está causando problemas
        $('#editor-container-enfermagem').hide();
        // Mostrar o textarea e focar nele
        $('#texto_evolucao_enfermagem').show().css({
            'width': '100%',
            'min-height': '300px',
            'font-size': '14px'
        }).focus();
    });
    
    // Verificar se o formulário já tem um handler de submit
    // Se já tiver, não configurar outro para evitar submissões duplicadas
    if ($._data($('#formEvolucaoEnfermagem')[0], 'events') === undefined ||
        !$._data($('#formEvolucaoEnfermagem')[0], 'events').submit) {
        
        console.log('[evolucoes_enfermagem.js] Configurando handler de submit para #formEvolucaoEnfermagem');
        
        // Handler para submissão de nova evolução de enfermagem
        $('#formEvolucaoEnfermagem').submit(function(e) {
            e.preventDefault();
            
            // Usar apenas o textarea simples
            const evolucaoTexto = $('#texto_evolucao_enfermagem').val().trim();
            if (!evolucaoTexto) {
                alert('Por favor, preencha o texto da evolução.');
                return;
            }
            
            // Desabilitar o botão e mostrar carregamento
            const submitBtn = $(this).find('button[type="submit"]');
            submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
            
            // Obter ID da internação do campo hidden ou variável global
            const internacaoIdValor = $('#internacao_id_evolucao').val() || internacaoId;
            
            // Obter ID do usuário
            const usuarioIdValor = $('#usuario_id').val() || 0;
            
            console.log('Enviando nova evolução:', {
                atendimentos_clinica_id: parseInt(internacaoIdValor, 10),
                funcionario_id: parseInt(usuarioIdValor, 10),
                texto: evolucaoTexto
            });
            
            $.ajax({
                url: '/api/enfermagem/evolucao',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    atendimentos_clinica_id: parseInt(internacaoIdValor, 10),
                    funcionario_id: parseInt(usuarioIdValor, 10),
                    texto: evolucaoTexto
                }),
                success: function(response) {
                    // Restaurar o botão
                    submitBtn.prop('disabled', false).html('Registrar Evolução');
                    
                    alert('Evolução de enfermagem registrada com sucesso!');
                    $('#modalEnfermagemEvolucao').modal('hide');
                    
                    // Limpar o textarea
                    $('#texto_evolucao_enfermagem').val('');
                    
                    // Recarregar evoluções
                    carregarEvolucoesEnfermagem();
                },
                error: function(xhr, status, error) {
                    // Restaurar o botão
                    submitBtn.prop('disabled', false).html('Registrar Evolução');
                    
                    console.error('Erro ao registrar evolução:', xhr.responseText);
                    alert('Erro ao registrar evolução: ' + (xhr.responseJSON?.erro || error));
                }
            });
        });
    } else {
        console.log('[evolucoes_enfermagem.js] Handler de submit já configurado para #formEvolucaoEnfermagem. Não será configurado novamente.');
    }
}

// Função para carregar evoluções de enfermagem com suporte a filtro de data
function carregarEvolucoesEnfermagem(dataFiltro = null) {
    // Garantir que temos um valor válido para internacaoId
    let idInternacao;
    
    // Tentar obter o ID da internação de diferentes fontes
    if (typeof internacaoId !== 'undefined' && internacaoId) {
        idInternacao = internacaoId;
        console.log('carregarEvolucoesEnfermagem: usando ID de internação da variável global =', idInternacao);
    } else {
        // Tentar obter do campo hidden no formulário
        idInternacao = $('#internacao_id_evolucao').val() || $('#internacao_id').val();
        console.log('carregarEvolucoesEnfermagem: usando ID de internação do campo hidden =', idInternacao);
    }
    
    if (!idInternacao) {
        console.error('Erro: ID de internação não encontrado para carregar evoluções');
        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação não disponível</td></tr>');
        $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação não disponível</td></tr>');
        return;
    }
    
    // Converter para número se for uma string
    idInternacao = parseInt(idInternacao, 10);
    if (isNaN(idInternacao)) {
        console.error('Erro: ID de internação inválido:', idInternacao);
        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    console.log('Carregando evoluções de enfermagem com ID:', idInternacao);
    
    $.ajax({
        url: `/api/enfermagem/evolucao/${idInternacao}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API de evoluções recebida:', { 
                tipo: Array.isArray(response) ? 'array' : typeof response,
                tamanho: Array.isArray(response) ? response.length : 'N/A',
                amostra: Array.isArray(response) && response.length > 0 ? response[0] : response
            });
            
            // Definir hoje ou a data filtrada
            const hoje = dataFiltro ? dataFiltro : new Date().toISOString().split('T')[0];
            const evolucoesDoDia = [];
            const evolucoesAntigas = [];
            const tabelaHoje = $('#listaEvolucoesDoDia');
            const tabelaAntigas = $('#listaEvolucoesAntigas');
            
            if (Array.isArray(response)) {
                // Ordenar todas as evoluções por data (mais recentes primeiro)
                response.sort((a, b) => {
                    return new Date(b.data_evolucao) - new Date(a.data_evolucao);
                });
                
                response.forEach(ev => {
                    // Garantir que a data esteja no formato correto
                    if (ev.data_evolucao) {
                        try {
                            // Corrigir o timezone se necessário (evitar problemas com UTC vs local)
                            const dataObj = new Date(ev.data_evolucao);
                            // Extrair a data no formato ISO (YYYY-MM-DD)
                            const dataEvolucao = dataObj.toISOString().split('T')[0];
                            
                            if (dataEvolucao === hoje) {
                                evolucoesDoDia.push({
                                    ...ev,
                                    dataObj: dataObj // Guardar o objeto Date para uso posterior
                                });
                            } else {
                                // Se temos filtro de data, não mostrar evoluções antigas
                                if (!dataFiltro) {
                                    evolucoesAntigas.push({
                                        ...ev,
                                        dataObj: dataObj // Guardar o objeto Date para uso posterior
                                    });
                                }
                            }
                        } catch (e) {
                            console.error('Erro ao processar data da evolução:', e, ev);
                        }
                    }
                });
                
                // Atualizar contador
                $('#contador-evolucoes-antigas').text(evolucoesAntigas.length);
                
                // Atualizar título com a data filtrada se necessário
                if (dataFiltro) {
                    const dataFormatada = new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR');
                    $('#titulo-evolucoes-hoje').text(`Evoluções de ${dataFormatada}`);
                    // Esconder seção de evoluções antigas quando filtrado
                    $('#antigas-container').hide();
                } else {
                    $('#titulo-evolucoes-hoje').text('Evoluções de Hoje');
                }
                
                // Renderizar evoluções do dia
                if (evolucoesDoDia.length > 0) {
                    let htmlDoDia = '';
                    evolucoesDoDia.forEach(ev => {
                        // Formatar hora garantindo formato consistente
                        const hora = ev.dataObj.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        htmlDoDia += `
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
                    tabelaHoje.html(htmlDoDia);
                } else {
                    tabelaHoje.html(`<tr><td colspan="3" class="text-center">
                        Nenhuma evolução registrada ${dataFiltro ? 'nesta data' : 'hoje'}.
                    </td></tr>`);
                }
                
                // Renderizar evoluções antigas (apenas quando não tiver filtro)
                if (!dataFiltro) {
                    if (evolucoesAntigas.length > 0) {
                        let htmlAntigas = '';
                        evolucoesAntigas.forEach(ev => {
                            // Formatar data e hora garantindo formato consistente
                            const dataFormatada = ev.dataObj.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            });
                            const hora = ev.dataObj.toLocaleTimeString('pt-BR', {
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
                        tabelaAntigas.html(htmlAntigas);
                    } else {
                        tabelaAntigas.html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                    }
                }
                
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
                    });
                }, 100);
                
                // Ocultar evoluções antigas por padrão se houver evoluções de hoje e não tiver filtro
                if (evolucoesDoDia.length > 0 && !dataFiltro) {
                    $('#antigas-container').hide();
                    $('#toggle-evolucoes-text').text('Mostrar Antigas');
                    $('#toggle-evolucoes-antigas').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
                }
            } else {
                console.log('Nenhuma evolução de enfermagem encontrada');
                tabelaHoje.html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada.</td></tr>');
                tabelaAntigas.html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                $('#contador-evolucoes-antigas').text('0');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções de enfermagem:', {
                status: status,
                errorMessage: error,
                responseText: xhr.responseText,
                statusCode: xhr.status,
                url: `/api/enfermagem/evolucao/${idInternacao}`
            });
            
            $('#listaEvolucoesDoDia').html(`<tr><td colspan="3" class="text-center text-danger">
                Erro ao carregar evoluções de enfermagem: ${error}<br>
                Status: ${status}<br>
                Código: ${xhr.status}
            </td></tr>`);
            
            $('#listaEvolucoesAntigas').html(`<tr><td colspan="3" class="text-center text-danger">
                Erro ao carregar evoluções de enfermagem: ${error}
            </td></tr>`);
            
            // Tentar novamente automaticamente apenas uma vez se for erro 404 ou 500
            if (xhr.status === 404 || xhr.status === 500) {
                console.log("Tentando carregar evoluções de enfermagem novamente após erro " + xhr.status);
                setTimeout(function() {
                    console.log("Recarregando após o erro...");
                    // Vamos esperar um tempo maior para garantir que a variável internacaoId esteja disponível
                    if (typeof window.internacaoId !== 'undefined' && window.internacaoId) {
                        carregarEvolucoesEnfermagem();
                    }
                }, 3000);
            }
        }
    });
}

// Adicionar a inicialização das evoluções ao evento DOMContentLoaded existente
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar módulo de evoluções de enfermagem
    console.log('Inicializando módulo de evoluções de enfermagem');
    configurarEvolucoesEnfermagem();
});

/**
 * Módulo para gerenciar a admissão de enfermagem
 */

// Função para configurar os eventos de admissão de enfermagem
function configurarAdmissaoEnfermagem() {
    console.log('Configurando eventos de admissão de enfermagem');
    
    // Botão para editar admissão
    $('#btn-editar-admissao').on('click', function() {
        // Esconder o texto e mostrar o formulário
        $('#admissao-texto-container').hide();
        $('#admissao-form-container').show();
        
        // Focar no textarea
        $('#admissao_enfermagem').focus();
    });
    
    // Botão para cancelar edição de admissão
    $('#btn-cancelar-admissao').on('click', function() {
        // Restaurar o texto original e esconder o formulário
        const textoOriginal = $('#admissao-texto-container').data('original-texto') || '';
        $('#admissao_enfermagem').val(textoOriginal);
        $('#admissao-form-container').hide();
        $('#admissao-texto-container').show();
    });
    
    // Botão para salvar admissão

}

// Adicionar a inicialização da admissão ao evento DOMContentLoaded existente
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar módulo de admissão de enfermagem
    console.log('Inicializando módulo de admissão de enfermagem');
    configurarAdmissaoEnfermagem();
    
    // Armazenar o texto original para eventual cancelamento
    const textoAdmissao = $('.texto-admissao').html();
    $('#admissao-texto-container').data('original-texto', textoAdmissao);
});

/**
 * Funções de aprazamento
 */

// Função para validar o formato de aprazamento
function validarFormatoAprazamento(texto) {
    if (!texto) return false;
    
    // Tentar corrigir o formato antes da validação
    texto = corrigirFormatoAprazamento(texto);
    
    // Remover espaços extras no início e fim
    texto = texto.trim();
    
    // Verificar se está vazio após remover espaços
    if (texto === '') return false;
    
    // Formato esperado: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM"
    const padrao = /^\d{2}\/\d{2}\/\d{4}\s*:\s*\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*(?:\s*;\s*\d{2}\/\d{2}\/\d{4}\s*:\s*\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*)*$/;
    
    // Se não estiver no formato padrão, tentar verificar se é um formato parcial válido
    if (!padrao.test(texto)) {
        // Verificar se é apenas horários no formato "HH:MM, HH:MM"
        const padraoApenasHorarios = /^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$/;
        
        // Se for formato de horários sem data, é considerado válido
        return padraoApenasHorarios.test(texto);
    }
    
    return true;
}

// Função para formatar aprazamento em formato mais legível
function formatarAprazamentoLegivel(texto) {
    if (!texto) return "Não aprazado";
    
    // Remover espaços extras no início e fim
    texto = texto.trim();
    
    // Verificar se o formato é apenas horários sem data (parcial)
    const padraoApenasHorarios = /^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$/;
    if (padraoApenasHorarios.test(texto)) {
        try {
            // Adicionar data atual para completar o formato
            const hoje = new Date();
            const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
            texto = `${dataAtual}: ${texto}`;
        } catch (e) {
            console.error('Erro ao formatar data para aprazamento parcial:', e);
        }
    }
    
    // Se o formato não for válido, retornar o texto original
    if (!validarFormatoAprazamento(texto)) {
        return texto;
    }
    
    // Dividir por datas
    const secoes = texto.split(';');
    const datasDias = [];
    
    secoes.forEach(secao => {
        secao = secao.trim();
        if (!secao) return;
        
        const partes = secao.split(':');
        if (partes.length < 2) return;
        
        const dataTrimmed = partes[0].trim();
        // Juntar o restante das partes caso haja mais de um ":" no texto
        const horariosTexto = partes.slice(1).join(':').trim();
        
        const horarios = horariosTexto.split(',').map(h => h.trim()).join(', ');
        
        datasDias.push(`${dataTrimmed}: ${horarios}`);
    });
    
    return datasDias.join(" | ");
}

// Função para contar o número total de doses em um aprazamento
function contarDosesAprazamento(texto) {
    if (!texto) return 0;
    
    // Primeiro corrigir o formato para lidar com undefined/undefined
    texto = corrigirFormatoAprazamento(texto);
    
    // Se for aprazamento parcial (apenas horários), tratar primeiro
    const padraoApenasHorarios = /^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$/;
    if (padraoApenasHorarios.test(texto.trim())) {
        return texto.split(',').filter(h => h.trim()).length;
    }
    
    let contador = 0;
    const secoes = texto.split(';');
    
    secoes.forEach(secao => {
        secao = secao.trim();
        if (!secao) return;
        
        const partes = secao.split(':');
        if (partes.length < 2) return;
        
        // A partir do segundo elemento são os horários
        const horarios = partes.slice(1).join(':').split(',');
        contador += horarios.filter(h => h.trim()).length;
    });
    
    return contador;
}

// Função para inicializar o campo de hora inicial nos aprazamentos
function inicializarCamposHoraInicial() {
    // Obter a hora atual
    const agora = new Date();
    const horaAtual = String(agora.getHours()).padStart(2, '0');
    const minutoAtual = String(agora.getMinutes()).padStart(2, '0');
    const horaFormatada = `${horaAtual}:${minutoAtual}`;
    
    // Campo para múltiplos dias (único campo presente no novo layout)
    if ($('#aprazamento_hora_inicial_multiplos').length) {
        $('#aprazamento_hora_inicial_multiplos').val(horaFormatada);
    }
    
    console.log('Campos de hora inicial configurados para:', horaFormatada);
}

// Função para processar os horários selecionados no formulário de múltiplos dias
function processarHorariosSelecionados(form) {
    console.log("Processando horários selecionados do formulário");
    
    // Inicializar contadores e objetos
    let horariosInvalidos = 0;
    const horariosPorData = {};
    
    // Obter inputs com name=horario e type=checkbox que estejam marcados
    const horariosSelecionados = Array.from(form.querySelectorAll('input[name="horario"][type="checkbox"]:checked'));
    console.log(`Total de horários selecionados: ${horariosSelecionados.length}`);
    
    if (horariosSelecionados.length === 0) {
        console.warn("Nenhum horário selecionado");
        return "";
    }
    
    // Processar cada horário selecionado
    for (const input of horariosSelecionados) {
        const valor = input.value.trim();
        console.log(`Processando valor: ${valor}`);
        
        // Validar formato esperado: DD/MM/YYYY:HH:MM
        const regex = /^(\d{2})\/(\d{2})\/(\d{4}):(\d{2}):(\d{2})$/;
        const match = valor.match(regex);
        
        if (!match) {
            console.warn(`Formato inválido para o valor: ${valor}`);
            horariosInvalidos++;
            continue;
        }
        
        // Extrair componentes da data e hora
        const [_, dia, mes, ano, hora, minuto] = match;
        
        // Validar componentes da data
        const diaNum = parseInt(dia, 10);
        const mesNum = parseInt(mes, 10);
        const anoNum = parseInt(ano, 10);
        
        if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 2000 || anoNum > 2100) {
            console.warn(`Data inválida: ${dia}/${mes}/${ano}`);
            horariosInvalidos++;
            continue;
        }
        
        // Validar componentes da hora
        const horaNum = parseInt(hora, 10);
        const minutoNum = parseInt(minuto, 10);
        
        if (horaNum < 0 || horaNum > 23 || minutoNum < 0 || minutoNum > 59) {
            console.warn(`Horário inválido: ${hora}:${minuto}`);
            horariosInvalidos++;
            continue;
        }
        
        // Formatar data e horário corretamente
        const dataFormatada = `${dia}/${mes}/${ano}`;
        const horaFormatada = `${hora}:${minuto}`;
        
        // Adicionar ao objeto horariosPorData
        if (!horariosPorData[dataFormatada]) {
            horariosPorData[dataFormatada] = [];
        }
        
        horariosPorData[dataFormatada].push(horaFormatada);
    }
    
    // Verificar se há horários válidos
    if (Object.keys(horariosPorData).length === 0) {
        console.warn("Nenhum horário válido processado");
        return "";
    }
    
    // Gerar string formatada para aprazamento
    let resultado = "";
    
    for (const data in horariosPorData) {
        // Ordenar horários para melhor legibilidade
        const horarios = horariosPorData[data].sort();
        
        if (resultado) {
            resultado += "; ";
        }
        
        resultado += `${data}: ${horarios.join(", ")}`;
    }
    
    console.log(`Horários inválidos: ${horariosInvalidos}`);
    console.log(`Resultado do processamento: ${resultado}`);
    
    // Verificação final do formato
    if (!validarFormatoAprazamento(resultado)) {
        console.warn("Formato final do resultado não está conforme esperado, tentando corrigir");
        
        // Tentar corrigir se possível
        try {
            const partes = resultado.split(";").map(parte => parte.trim());
            const partesCorrigidas = [];
            
            for (const parte of partes) {
                if (parte.includes(":")) {
                    const [data, ...horariosParts] = parte.split(":");
                    const dataLimpa = data.trim();
                    // Juntar novamente os horários caso haja mais de um ":" 
                    const horariosTexto = horariosParts.join(':').trim();
                    const horariosLimpos = horariosTexto.split(",").map(h => h.trim()).join(", ");
                    partesCorrigidas.push(`${dataLimpa}: ${horariosLimpos}`);
                }
            }
            
            resultado = partesCorrigidas.join("; ");
            console.log(`Resultado corrigido: ${resultado}`);
        } catch (e) {
            console.error("Erro ao tentar corrigir o formato:", e);
        }
    }
    
    return resultado;
}

// Função simplificada para processar horários, usada como fallback no helper
function processarHorariosSelecionadosSimplificado() {
    console.log("Usando função simplificada para processar horários selecionados");
    
    // Inicializar contadores e objetos
    const horariosPorData = {};
    
    // Obter inputs com name=horario e type=checkbox que estejam marcados
    const horariosSelecionados = Array.from(document.querySelectorAll('#horarios_multiplos_dias input[type="checkbox"]:checked'));
    console.log(`Total de horários selecionados: ${horariosSelecionados.length}`);
    
    if (horariosSelecionados.length === 0) {
        console.warn("Nenhum horário selecionado");
        return "";
    }
    
    // Processar cada horário selecionado
    for (const input of horariosSelecionados) {
        const valor = input.value.trim();
        if (!valor) continue;
        
        // Valor esperado: DD/MM/YYYY:HH:MM
        const partes = valor.split(':');
        if (partes.length !== 2) continue;
        
        const data = partes[0];
        const hora = partes[1];
        
        if (!data || !hora) continue;
        
        // Adicionar ao objeto horariosPorData
        if (!horariosPorData[data]) {
            horariosPorData[data] = [];
        }
        
        horariosPorData[data].push(hora);
    }
    
    // Verificar se há horários válidos
    if (Object.keys(horariosPorData).length === 0) {
        console.warn("Nenhum horário válido processado");
        return "";
    }
    
    // Gerar string formatada para aprazamento
    let resultado = "";
    
    for (const data in horariosPorData) {
        // Ordenar horários para melhor legibilidade
        const horarios = horariosPorData[data].sort();
        
        if (resultado) {
            resultado += "; ";
        }
        
        resultado += `${data}: ${horarios.join(", ")}`;
    }
    
    return resultado;
}

/**
 * Corrige o formato do aprazamento removendo "undefined/undefined/" e outros problemas
 * @param {string} textoOriginal - Texto original de aprazamento que pode conter erros
 * @returns {string} - Texto corrigido no formato adequado
 */
function corrigirFormatoAprazamento(textoOriginal) {
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
    
    // Processar cada seção para garantir o formato correto
    const secoes = texto.split(';').filter(s => s.trim());
    const secoesCorrigidas = [];
    
    secoes.forEach(secao => {
        const parts = secao.trim().split(':');
        if (parts.length >= 2) {
            const data = parts[0].trim();
            const horarios = parts.slice(1).join(':').trim();
            
            // Verificar se a data está no formato DD/MM/YYYY
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(data)) {
                // Garantir que a data está no formato correto (com zeros à esquerda)
                const [dia, mes, ano] = data.split('/');
                const dataFormatada = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
                
                secoesCorrigidas.push(`${dataFormatada}:${horarios}`);
            } else {
                // Tentar usar a data atual se a data estiver inválida
                const hoje = new Date();
                const dataHoje = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
                
                secoesCorrigidas.push(`${dataHoje}:${horarios}`);
            }
        }
    });
    
    return secoesCorrigidas.join('; ');
}

/**
 * Inicializa o modal de calendário de aprazamento
 * Configura os elementos e listeners para o modal
 * @param {string} textoAprazamento - Texto de aprazamento a ser visualizado
 * @param {string} titulo - Título do modal (opcional)
 */
function inicializarModalCalendarioAprazamento(textoAprazamento = '', titulo = 'Calendário de Aprazamento') {
    // Verificar se a função existe no arquivo calendario_aprazamento.js
    if (typeof window.inicializarModalCalendarioAprazamento === 'function') {
        // Chamar a função do outro arquivo
        window.inicializarModalCalendarioAprazamento(textoAprazamento, titulo);
        return;
    }

    // Corrigir o formato do aprazamento
    const textoCorrigido = corrigirFormatoAprazamento(textoAprazamento);
    
    // Verificar se o modal existe
    if (!document.getElementById('modal-visualizar-aprazamentos')) {
        // Criar o modal no DOM
        const modalHTML = `
            <div class="modal fade" id="modal-visualizar-aprazamentos" tabindex="-1" aria-labelledby="modal-visualizar-aprazamentos-label" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="modal-visualizar-aprazamentos-label">${titulo}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="lista-aprazamentos">
                                <!-- Aqui será inserida o calendário de aprazamentos -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHTML);
    } else {
        // Se o modal já existe, apenas atualizar o título
        $('#modal-visualizar-aprazamentos-label').text(titulo);
    }
    
    // Processar e exibir o calendário de aprazamentos
    const secoes = textoCorrigido.split(';');
    let htmlTabela = `
        <table class="table table-bordered table-striped mb-0">
            <thead class="table-light">
                <tr>
                    <th>Data</th>
                    <th>Horários</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let temAprazamentos = false;
    
    secoes.forEach(secao => {
        secao = secao.trim();
        if (!secao) return;
        
        const partes = secao.split(':');
        if (partes.length < 2) return;
        
        const dataTrimmed = partes[0].trim();
        // Juntar o restante das partes caso haja mais de um ":" no texto
        const horariosTexto = partes.slice(1).join(':').trim();
        
        const horarios = horariosTexto.split(',').map(h => h.trim()).join(', ');
        
        htmlTabela += `
            <tr>
                <td>${dataTrimmed}</td>
                <td>${horarios}</td>
            </tr>
        `;
        
        temAprazamentos = true;
    });
    
    htmlTabela += `
            </tbody>
        </table>
    `;
    
    if (!temAprazamentos) {
        htmlTabela = `<div class="alert alert-warning">Nenhum aprazamento registrado.</div>`;
    }
    
    $('#lista-aprazamentos').html(htmlTabela);
    
    // Abrir o modal
    try {
        // Verificar se o objeto Bootstrap 5 está disponível
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalElement = document.getElementById('modal-visualizar-aprazamentos');
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        } else {
            // Fallback para jQuery se bootstrap não estiver disponível
            $('#modal-visualizar-aprazamentos').modal('show');
        }
    } catch (error) {
        console.error('Erro ao inicializar o modal:', error);
        alert('Ocorreu um erro ao exibir os aprazamentos.');
    }
}

// Configurar eventos quando o documento estiver pronto
$(document).ready(function() {
    // Configurar o comportamento do formulário de aprazamento quando for carregado
    $('#formAprazamento').on('submit', function(e) {
        e.preventDefault();
        
        const prescricaoId = $('#aprazamento_prescricao_id').val();
        const medicamentoIndex = parseInt($('#aprazamento_medicamento_index').val(), 10);
        const medicamentoNome = $('#aprazamento_medicamento_nome').text().trim();
        const descricaoUso = ''; // Poderíamos implementar um campo para isso
        
        if (!prescricaoId || isNaN(medicamentoIndex)) {
            alert('Erro na identificação da prescrição ou medicamento');
            return;
        }
        
        // Mostrar indicador de carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
        btnSubmit.prop('disabled', true);
        
        // Verificar se existem horários calculados
        if ($('#horarios_multiplos_dias .horario-check').length === 0) {
            alert('Por favor, calcule os horários primeiro clicando no botão "Calcular Horários".');
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            return;
        }
        
        // Processar os horários selecionados para múltiplos dias
        const aprazamentoTexto = processarHorariosSelecionadosSimplificado();
        
        if (!aprazamentoTexto) {
            alert('Selecione pelo menos um horário de administração.');
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            return;
        }
        
        // Para depuração
        console.log('Aprazamento processado:', aprazamentoTexto);
        
        // Usar a função de registro de aprazamento do calendario_aprazamento.js
        if (typeof registrarAprazamento === 'function') {
            registrarAprazamento({
                prescricao_id: prescricaoId,
                medicamento_nome: medicamentoNome,
                descricao_uso: descricaoUso,
                enfermeiro_id: parseInt($('#formAprazamento').data('enfermeiro-id') || 0, 10),
                aprazamento: aprazamentoTexto
            }, function(response) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                if (response.success) {
                    // Fechar modal
                    $('#modalAprazamento').modal('hide');
                    
                    // Recarregar lista de prescrições
                    if (typeof carregarPrescricoes === 'function') {
                        // Garantir que o ID da internação está definido antes de chamar a função
                        // Dar preferência ao ATENDIMENTO_ID, que é mais confiável e já está definido no HTML
                        const idInternacao = window.ATENDIMENTO_ID || window.internacaoId || null;
                        
                        if (idInternacao) {
                            // Garantir também que a variável global está definida para futuros usos
                            window.internacaoId = idInternacao;
                            carregarPrescricoes(idInternacao);
                        } else {
                            console.error('Erro: Não foi possível determinar o ID da internação');
                        }
                    }
                    
                    // Mostrar mensagem de sucesso
                    alert('Aprazamento registrado com sucesso!');
                } else {
                    alert('Erro ao registrar aprazamento: ' + (response.message || 'Erro desconhecido'));
                }
            });
        } else {
            console.error('Função registrarAprazamento não encontrada');
            alert('Erro: Função de registro de aprazamento não está disponível');
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
        }
    });

    $(document).on('click', '.btn-visualizar-aprazamento', function () {
        const prescricaoId = $(this).data('prescricao-id');  // opcional
        const medicamentoIndex = $(this).data('medicamento-index');  // opcional
        const nomeMedicamento = $(this).data('medicamento') || 'Medicamento';  // nome do medicamento

        let textoAprazamento = $(this).data('aprazamento') || 'Aprazamento não encontrado.';
        
        // Corrigir o formato do aprazamento antes de passar para o modal
        if (textoAprazamento !== 'Aprazamento não encontrado.') {
            textoAprazamento = corrigirFormatoAprazamento(textoAprazamento);
        }

        // Título do modal com o nome do medicamento
        const tituloModal = `Aprazamento: ${nomeMedicamento}`;
        
        inicializarModalCalendarioAprazamento(textoAprazamento, tituloModal);
    });
    
    // Remover event handlers jQuery duplicados (definidos em outros arquivos)
    // Deixamos o listener JavaScript puro, registrado em static/js/calculo_horarios.js,
    // assumir o controle do clique – ele já contém toda a lógica necessária.
   $('#btn_calcular_multiplos_dias').off('click').on('click', function (e) {
        e.preventDefault();

        if (typeof calcularHorariosMultiplosDias === 'function') {
            calcularHorariosMultiplosDias();
             } else {
           console.error('Função calcularHorariosMultiplosDias não encontrada.');
           alert('Erro: não foi possível localizar a lógica de cálculo de horários.');
       }
   });
    
    // Mostrar/ocultar o campo de intervalo personalizado
    $(document).on('change', '#aprazamento_multiplos_intervalo', function() {
        if ($(this).val() === 'custom') {
            $('#multiplos_intervalo_custom').show();
        } else {
            $('#multiplos_intervalo_custom').hide();
        }
    });
    
    // Botões para selecionar/desmarcar todos os horários
    $(document).on('click', '#btn_selecionar_todos', function() {
        $('#horarios_multiplos_dias .horario-check').prop('checked', true);
    });
    
    $(document).on('click', '#btn_desmarcar_todos', function() {
        $('#horarios_multiplos_dias .horario-check').prop('checked', false);
    });
});

// Evento para abrir o modal de visualização do aprazamento ao clicar no botão
$(document).on('click', '.btn-ver-aprazamento', function () {
    const prescricaoId = $(this).data('prescricao-id');
    const medicamentoIndex = $(this).data('medicamento-index');

    // Você precisará pegar o aprazamento correspondente.
    // Para agora, vou buscar direto no HTML, supondo que em cada linha de medicamento tenha um atributo data-aprazamento.
    const textoAprazamento = $(this).data('aprazamento') || 'Aprazamento não encontrado.';

    inicializarModalCalendarioAprazamento(textoAprazamento, 'Aprazamento do Medicamento');
});

/**
 * Calcula horários entre dois horários com um intervalo específico
 * @param {string} horaInicio - Hora inicial no formato HH:MM
 * @param {string} horaFim - Hora final no formato HH:MM
 * @param {number} intervaloHoras - Intervalo em horas
 * @returns {string[]} Array com os horários calculados
 */
function calcularHorariosEntreIntervalo(horaInicio, horaFim, intervaloHoras) {
    // Converter horas para minutos para facilitar o cálculo
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFimH, horaFimM] = horaFim.split(':').map(Number);
    
    const inicioMinutos = horaInicioH * 60 + horaInicioM;
    const fimMinutos = horaFimH * 60 + horaFimM;
    
    // Converter intervalo de horas para minutos
    const intervaloMinutos = Math.round(intervaloHoras * 60);
    
    const horarios = [];
    let minutoAtual = inicioMinutos;
    
    // Adicionar o horário inicial
    horarios.push(formatarHoraMinutos(minutoAtual));
    
    // Calcular horários subsequentes
    while (minutoAtual + intervaloMinutos <= fimMinutos) {
        minutoAtual += intervaloMinutos;
        horarios.push(formatarHoraMinutos(minutoAtual));
    }
    
    return horarios;
}

/**
 * Formata minutos para o formato de hora HH:MM
 * @param {number} minutos - Total de minutos a ser formatado
 * @returns {string} Hora formatada no padrão HH:MM
 */
function formatarHoraMinutos(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Carrega as prescrições da internação
 * @param {number} idInternacao - ID da internação (opcional)
 * @param {boolean} lastUpdate - Indica se é uma última tentativa de atualização
 */
function carregarPrescricoes(idInternacao = null, lastUpdate = false) {
    // Se internacaoId não foi fornecido, use a variável global
    const id = idInternacao || window.internacaoId;
    
    console.log(`Iniciando carregarPrescricoes com ID: ${id}, lastUpdate: ${lastUpdate}`);
    
    if (!lastUpdate) {
        $("#listaPrescricoes").html("<tr><td class='text-center'><i class='fas fa-spinner fa-spin'></i> Carregando prescrições...</td></tr>");
    }
    
    $.ajax({
        url: "/api/prescricoes/" + id,
        type: 'GET',
        success: function(response) {
            console.log("Resposta recebida:", response);
            
            if (!response.success) {
                $("#listaPrescricoes").html("<tr><td class='text-center text-warning'>Erro ao carregar prescrições: " + response.error + "</td></tr>");
                console.error("Erro ao carregar prescrições:", response.error);
                return;
            }
            
            if (!response.prescricoes || response.prescricoes.length === 0) {
                $("#listaPrescricoes").html("<tr><td class='text-center'>Nenhuma prescrição encontrada</td></tr>");
                console.log("Nenhuma prescrição encontrada");
                return;
            }
            
            console.log(`${response.prescricoes.length} prescrições encontradas`);
            
            // Ordenar prescrições por data (mais recente primeiro)
            var prescricoes = response.prescricoes.sort(function(a, b) {
                return new Date(b.data_prescricao) - new Date(a.data_prescricao);
            });
            
            // Agrupar prescrições por data
            var prescricoesPorData = {};
            prescricoes.forEach(function(p) {
                // Extrair apenas a data (sem a hora)
                var dataApenas = p.data_prescricao ? p.data_prescricao.split(' ')[0] : 'Sem data';
                
                if (!prescricoesPorData[dataApenas]) {
                    prescricoesPorData[dataApenas] = [];
                }
                prescricoesPorData[dataApenas].push(p);
            });
            
            var html = "<tr><td>";
            
            // Para cada data
            Object.keys(prescricoesPorData).forEach(function(data) {
                html += '<div class="card mb-3">' +
                    '<div class="card-header bg-info text-white">' +
                    '<h5 class="mb-0">Prescrições do dia ' + data + '</h5>' +
                    '</div>' +
                    '<div class="card-body">';
                
                // Para cada prescrição na data
                prescricoesPorData[data].forEach(function(prescricao) {
                    var horario = prescricao.data_prescricao ? prescricao.data_prescricao.split(' ')[1] : '';
                    
                    html += '<div class="prescricao-item mb-4" data-id="' + prescricao.id + '">' +
                        '<h6 class="prescricao-horario text-secondary">' +
                        '<i class="fas fa-clock mr-1"></i> ' + horario + ' - ' +
                        '<span class="text-primary">' + (prescricao.medico_nome || 'Médico não informado') + '</span>';
                    
                    // Mostrar botão Editar apenas para médicos
                    if (window.cargoUsuario && window.cargoUsuario.toLowerCase().trim() === "medico") {
                        html += '<button class="btn btn-sm btn-outline-info float-right ml-2 btn-editar-prescricao" ' +
                        'data-id="' + prescricao.id + '" style="float: right;">' +
                        '<i class="fas fa-edit"></i> Editar' +
                        '</button>';
                    }
                    
                    html += '</h6>';
                        
                    // Seção de Dieta
                    if (prescricao.texto_dieta) {
                        html += '<div class="mt-3 mb-2">' +
                            '<h6><i class="fas fa-utensils text-success mr-1"></i> Dieta</h6>' +
                            '<div class="card card-body bg-light">' + prescricao.texto_dieta + '</div>' +
                            '</div>';
                    }
                    
                    // Seção de Medicamentos
                    if (prescricao.medicamentos && prescricao.medicamentos.length > 0) {
                        html += '<div class="mt-3 mb-2">' +
                            '<h6><i class="fas fa-pills text-danger mr-1"></i> Medicamentos</h6>' +
                            '<div class="table-responsive">' +
                            '<table class="table table-sm table-bordered table-striped">' +
                            '<thead class="thead-light">' +
                            '<tr>' +
                            '<th>Medicamento</th>' +
                            '<th>Uso</th>' +
                            '<th>Aprazamento</th>' +
                            '<th>Enfermeiro</th>' +
                            '<th>Ações</th>' +
                            '</tr>' +
                            '</thead>' +
                            '<tbody>';

                        prescricao.medicamentos.forEach(function(medicamento) {
                            html += '<tr>' +
                                '<td>' + (medicamento.nome_medicamento || '') + '</td>' +
                                '<td>' + (medicamento.descricao_uso || '') + '</td>' +
                                '<td>';

                                if (medicamento.aprazamentos_novos && medicamento.aprazamentos_novos.length > 0) {
                                    html += '<div class="d-flex justify-content-center">' +
                                        '<button type="button" class="btn btn-sm btn-outline-primary btn-ver-aprazamentos" ' +
                                        'data-atendimento-id="' + window.ATENDIMENTO_ID + '" ' +
                                        'data-medicamento-nome="' + medicamento.nome_medicamento.replace(/"/g, '&quot;') + '">' +
                                        '<i class="fas fa-list"></i> Ver Horários' +
                                        '</button>' +
                                        '</div>';
                                } else {
                                    html += '<span class="text-muted">Não aprazado</span>';
                                }

                                html += '</td>' +
                                    '<td>' + (medicamento.enfermeiro_nome || '') + '</td>' +
                                    '<td>';

                                if (window.cargoUsuario && window.cargoUsuario.toLowerCase().trim() === "enfermeiro") {
                                    html += '<button class="btn btn-primary btn-sm btn-aprazamento" ' +
                                        'data-prescricao-id="' + prescricao.id + '" ' +
                                        'data-medicamento-index="' + prescricao.medicamentos.indexOf(medicamento) + '" ' +
                                        'data-medicamento-nome="' + medicamento.nome_medicamento.replace(/"/g, '&quot;') + '">' +
                                        '<i class="fas fa-clock"></i> Aprazar' +
                                        '</button>';
                                }

                                html += '</td></tr>';
                        });

                        html += '</tbody></table></div></div>';
                    }
                    
                    // Seção de Procedimentos Médicos
                    if (prescricao.texto_procedimento_medico) {
                        html += '<div class="mt-3">' +
                            '<h6><i class="fas fa-user-md text-primary mr-1"></i> Procedimentos Médicos</h6>' +
                            '<div class="card card-body bg-light">' + prescricao.texto_procedimento_medico + '</div>' +
                            '</div>';
                    }
                    
                    // Seção de Procedimentos Multidisciplinares
                    if (prescricao.texto_procedimento_multi) {
                        html += '<div class="mt-3">' +
                            '<h6><i class="fas fa-users text-warning mr-1"></i> Procedimentos Multidisciplinares</h6>' +
                            '<div class="card card-body bg-light">' + prescricao.texto_procedimento_multi + '</div>' +
                            '</div>';
                    }
                    
                    html += '</div>';
                    
                    // Adicionar divisor entre prescrições, exceto na última
                    if (prescricoesPorData[data].indexOf(prescricao) < prescricoesPorData[data].length - 1) {
                        html += '<hr class="my-3">';
                    }
                });
                
                html += '</div></div>';
            });
            
            html += "</td></tr>";
            $("#listaPrescricoes").html(html);
        },
        error: function(xhr, status, error) {
            console.error("Erro na requisição AJAX:", xhr.responseText);
            $("#listaPrescricoes").html("<tr><td class='text-center text-danger'>Erro ao carregar prescrições: " + error + "</td></tr>");
            
            // Tentar novamente automaticamente apenas uma vez se for erro 404 ou 500
            if ((xhr.status === 404 || xhr.status === 500) && !lastUpdate) {
                console.log("Tentando carregar prescrições novamente após erro " + xhr.status);
                setTimeout(function() {
                    carregarPrescricoes(id, true);
                }, 2000);
            }
        }
    });
}

/**
 * Carrega as evoluções da internação
 */
function carregarEvolucoes() {
    console.log('Carregando evoluções para internacaoId:', window.internacaoId);
    
    if (!window.internacaoId || isNaN(window.internacaoId)) {
        console.error('ID de internação inválido ao carregar evoluções:', window.internacaoId);
        $('#listaEvolucoes').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    $.ajax({
        url: `/api/evolucoes/${window.internacaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API de evoluções:', response);
            const tabela = $('#listaEvolucoes');
            tabela.empty();
            
            if (response.success && response.evolucoes && response.evolucoes.length > 0) {
                response.evolucoes.forEach(ev => {
                    const evolucaoHtml = ev.evolucao || '---';
                    
                    // Criar um container para a evolução com estilo seguro
                    tabela.append(`
                        <tr>
                            <td>${ev.data_evolucao || '---'}</td>
                            <td>${ev.nome_medico || '---'}</td>
                            <td>
                                <div class="texto-evolucao">
                                    ${evolucaoHtml}
                                </div>
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
                tabela.html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada até o momento.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções:', xhr.responseText, status, error);
            $('#listaEvolucoes').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
        }
    });
}

/**
 * Configura o scroll moderno para elementos do editor Quill
 * @param {HTMLElement} container - Elemento container que contém os editores Quill
 */
function setupModernScroll(container) {
    if (!container) return;
    
    // Elementos que podem precisar de scroll
    const scrollElements = container.querySelectorAll('.ql-editor');
    
    scrollElements.forEach(element => {
        // Assegurar que o elemento tem estilo de overflow adequado
        element.style.overflowY = 'auto';
        element.style.maxHeight = '100%';
        
        // Observar redimensionamento do conteúdo
        const resizeObserver = new ResizeObserver(() => {
            // Ajustar posição de scroll quando o conteúdo mudar
            const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
            if (isAtBottom) {
                element.scrollTop = element.scrollHeight;
            }
        });
        
        // Observar mudanças no conteúdo
        const mutationObserver = new MutationObserver(() => {
            // Verificar se o scroll precisa ser ajustado
            const shouldScrollToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
            if (shouldScrollToBottom) {
                element.scrollTop = element.scrollHeight;
            }
        });
        
        // Iniciar observadores
        resizeObserver.observe(element);
        mutationObserver.observe(element, { 
            childList: true, 
            subtree: true, 
            characterData: true 
        });
        
        // Armazenar observadores para limpeza futura
        element._scrollObservers = {
            resize: resizeObserver,
            mutation: mutationObserver
        };
    });
}

/**
 * Verifica e aplica correções no editor Quill após o carregamento
 */
function checkQuillAndApplyFixes() {
    // Aguardar um momento para garantir que o Quill tenha carregado completamente
    setTimeout(() => {
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            setupModernScroll(editorContainer);
            console.log('Scroll moderno aplicado ao editor Quill');
        } else {
            console.log('Elemento editor-container não encontrado ao tentar aplicar scroll moderno');
        }
    }, 500);
}

/**
 * Limpa todos os campos do formulário de prescrição
 */
function limparFormularioPrescricao() {
    $('#prescricao_id').val('');
    $('#nome_medicamento').val('');
    $('#descricao_uso').val('');
    $('#aprazamento').val('');
    $('#texto_dieta').val('');
    $('#texto_procedimento_medico').val('');
    $('#texto_procedimento_multi').val('');
    $('#avisoAlergia').hide();
    medicamentosAdicionados = [];
    atualizarTabelaMedicamentos();
    $('#modalPrescricaoLabel').text('Nova Prescrição');
}

/**
 * Edita uma prescrição existente
 * @param {number} prescricaoId - ID da prescrição a ser editada
 */
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
                            // Converter formato de data se necessário
                            let aprazamento = med.aprazamento;
                            if (aprazamento && typeof aprazamento === 'string') {
                                // Converter de DD/MM/YYYY HH:MM para YYYY-MM-DDTHH:MM
                                const partes = aprazamento.split(' ');
                                if (partes.length === 2) {
                                    const dataPartes = partes[0].split('/');
                                    if (dataPartes.length === 3) {
                                        aprazamento = `${dataPartes[2]}-${dataPartes[1]}-${dataPartes[0]}T${partes[1]}`;
                                    }
                                }
                            }
                            
                            medicamentosAdicionados.push({
                                nome_medicamento: med.nome_medicamento,
                                descricao_uso: med.descricao_uso,
                                aprazamento: aprazamento
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
                alert('Erro ao buscar prescrição: ' + (response.error || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar prescrição:', xhr.responseText);
            alert('Erro ao buscar prescrição: ' + error);
        }
    });
}

function atualizarTabelaMedicamentos() {
    const tabela = $('#tabelaMedicamentosAdicionados tbody');
    
    if (medicamentosAdicionados.length === 0) {
        tabela.html('<tr id="semMedicamentos"><td colspan="4" class="text-center">Nenhum medicamento adicionado</td></tr>');
        return;
    }
    
    // Esconder a mensagem de "nenhum medicamento"
    $('#semMedicamentos').hide();
    
    // Limpar e reconstruir a tabela
    tabela.empty();
    
    medicamentosAdicionados.forEach((med, index) => {
        const aprazamentoFormatado = med.aprazamento ? 
            new Date(med.aprazamento).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
        
        tabela.append(`
            <tr data-index="${index}">
                <td>${med.nome_medicamento}</td>
                <td>${med.descricao_uso}</td>
                <td>${aprazamentoFormatado}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm btn-remover-medicamento">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

/**
 * Observa mutações no DOM para um determinado seletor
 * @param {string} seletor - Seletor CSS do elemento a ser observado
 * @param {function} callback - Função a ser chamada quando houver mutações
 * @returns {MutationObserver|null} - Observador criado ou null se o elemento não for encontrado
 */
function observarMutacoesDom(seletor, callback) {
    const elemento = document.querySelector(seletor);
    if (!elemento) return null;
    
    const observer = new MutationObserver(callback);
    observer.observe(elemento, { 
        childList: true, 
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    return observer;
}

/**
 * Remove eventos depreciados do DOM para melhor performance
 */
function removerEventosDepreciados() {
    // Lista de eventos depreciados
    const eventosDepreciados = [
        'DOMNodeInserted',
        'DOMNodeRemoved',
        'DOMSubtreeModified',
        'DOMAttrModified',
        'DOMCharacterDataModified'
    ];
    
    // Função para limpar o evento
    function limparEvento(event) {
        const elementos = document.querySelectorAll('*');
        for (let i = 0; i < elementos.length; i++) {
            const el = elementos[i];
            if (el._events && el._events[event]) {
                delete el._events[event];
                console.log(`Evento depreciado ${event} removido do elemento:`, el);
            }
        }
    }
    
    // Limpar todos os eventos depreciados
    eventosDepreciados.forEach(limparEvento);
}

/**
 * Configura o comportamento dos tooltips em dispositivos touch
 */
function setupTooltips() {
    // Verifica se é um dispositivo touch
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouch) {
        // Em dispositivos touch, mostrar o título em um tooltip
        document.querySelectorAll('.menu-link').forEach(link => {
            const title = link.getAttribute('title');
            if (title) {
                link.addEventListener('click', function(e) {
                    // Não mostrar tooltip ao navegar entre seções
                    if (link.getAttribute('data-target')) {
                        e.preventDefault();
                    }
                });
            }
        });
    }
}

$(document).on('click', '.btn-aprazamento', function () {
    const prescricaoId = $(this).data('prescricao-id');
    const medicamentoIndex = $(this).data('medicamento-index');
    const medicamentoNome = $(this).data('medicamento-nome');

    // Preencher os campos do modal de aprazamento
    $('#aprazamento_prescricao_id').val(prescricaoId);
    $('#aprazamento_medicamento_index').val(medicamentoIndex);
    $('#aprazamento_medicamento_nome').text(medicamentoNome);

    // Limpar campos do formulário, se necessário
    $('#aprazamento_data_inicio').val('');
    $('#aprazamento_data_fim').val('');
    $('#aprazamento_hora_inicial_multiplos').val('');
    $('#horarios_multiplos_dias').html('');

    // Abrir o modal de aprazamento
    $('#modalAprazamento').modal('show');
});

/**
 * Arquivo para cálculo e visualização de horários de aprazamento
 * Integra com botão de calcular horários
 */