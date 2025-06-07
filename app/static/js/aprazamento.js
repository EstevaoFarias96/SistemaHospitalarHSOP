// Arquivo auxiliar para funções de aprazamento
// Este arquivo contém funções de apoio para o processo de aprazamento
// As funções principais estão em calculo_horarios.js e calendario_aprazamento.js



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



// Função centralizada para registro de aprazamento
async function registrarAprazamento(payload, callback) {
    console.group('registrarAprazamento');
    console.log('Dados de entrada:', payload);

    /* -------------------------------------------------------- */
    /* 1. Validação mínima – só o que o backend realmente quer  */
    /* -------------------------------------------------------- */
    const obrig = ['prescricao_id', 'nome_medicamento',
                   'data_hora_aprazamento', 'enfermeiro_responsavel_id'];
    const faltando = obrig.filter(k => !payload[k]);
    if (faltando.length) {
        const msg = `Campos obrigatórios ausentes: ${faltando.join(', ')}`;
        console.error(msg);
        console.groupEnd();
        if (typeof callback === 'function') callback({ success:false, message:msg });
        return;
    }

    /* -------------------------------------------------------- */
    /* 2. Chamada ao endpoint                                   */
    /* -------------------------------------------------------- */
    try {
        const resp = await fetch('/api/aprazamentos', {
            method : 'POST',
            headers: { 'Content-Type':'application/json' },
            body   : JSON.stringify(payload)
        });
        const json = await resp.json();
        console.log('Resposta:', json);
        console.groupEnd();
        if (typeof callback === 'function') callback(json);
    } catch (err) {
        console.error('Erro de rede:', err);
        console.groupEnd();
        if (typeof callback === 'function') {
            callback({ success:false,
                       message:'Falha de comunicação com o servidor',
                       error:err });
        }
    }
}

function converterDataHoraParaISO(dataBR, hora) {
    // dataBR: "20/05/2025", hora: "15:45"
    const [dia, mes, ano] = dataBR.split('/');
    // Garante sempre dois dígitos para dia e mês
    const diaPad = String(dia).padStart(2, '0');
    const mesPad = String(mes).padStart(2, '0');
    // Garante sempre HH:MM
    let [h, m] = hora.split(':');
    h = String(h).padStart(2, '0');
    m = String(m || '00').padStart(2, '0');
    // Retorna no formato ISO: YYYY-MM-DDTHH:MM:00
    return `${ano}-${mesPad}-${diaPad}T${h}:${m}:00`;
}

/**
 * Função para validar se um ID parece ser um ID válido (não uma data ou outro valor incorreto)
 * @param {string|number} id - ID a ser validado
 * @returns {boolean} - true se o ID for válido, false caso contrário
 */
function validarIdInternacao(id) {
    if (!id) return false;
    
    // Converter para string para facilitar a validação
    const idStr = String(id);
    
    // Verificar casos básicos de invalidade
    if (idStr === 'undefined' || idStr === 'null' || idStr === 'NaN') return false;
    
    // Verificar se é um número e se tem comprimento razoável (geralmente menor que 10 dígitos)
    if (isNaN(parseInt(idStr)) || idStr.length > 10) return false;
    
    // Verificar se não contém caracteres suspeitos como '/'
    if (idStr.includes('/')) return false;
    
    return true;
}

function carregarPrescricoes(idInternacao = null, lastUpdate = false) {
    // Se internacaoId não foi fornecido, tente diferentes fontes, em ordem de prioridade
    // 1. O parâmetro passado diretamente
    // 2. O ID global de atendimento (definido no HTML)
    // 3. A variável internacaoId
    
    let id = idInternacao || window.ATENDIMENTO_ID || window.internacaoId;
    
    console.log('[Debug] carregarPrescricoes - fontes de ID:', { 
        idInternacao, 
        ATENDIMENTO_ID: window.ATENDIMENTO_ID, 
        internacaoId: window.internacaoId,
        idFinal: id 
    });
    
    // Verificar se o ID contém apenas dígitos e não é muito longo (não é uma data ou outro valor incorreto)
    if (!validarIdInternacao(id)) {
        console.error(`[Debug] ID suspeito detectado: ${id} - parece ser inválido. Tentando fontes alternativas.`);
        
        // Tentar fontes alternativas em ordem específica
        const fontes = [
            { nome: 'DOM: internacao_id', valor: document.getElementById('internacao_id')?.value },
            { nome: 'DOM: atendimento_id', valor: document.getElementById('atendimento_id')?.value },
            { nome: 'URL path', valor: window.location.pathname.split('/').pop() }
        ];
        
        // Procurar primeira fonte válida
        for (const fonte of fontes) {
            if (validarIdInternacao(fonte.valor)) {
                id = fonte.valor;
                console.log(`[Debug] ID recuperado de ${fonte.nome}: ${id}`);
                break;
            }
        }
        
        // Se ainda não for válido, procurar qualquer elemento com data-internacao-id no DOM
        if (!validarIdInternacao(id)) {
            const elementosComId = document.querySelectorAll('[data-internacao-id]');
            for (const elem of elementosComId) {
                const idCandidato = elem.dataset.internacaoId;
                if (validarIdInternacao(idCandidato)) {
                    id = idCandidato;
                    console.log(`[Debug] ID recuperado de elemento com atributo data: ${id}`);
                    break;
                }
            }
        }
        
        // Se ainda não encontrou ID válido
        if (!validarIdInternacao(id)) {
            console.error("[Debug] Não foi possível encontrar um ID válido após todas as tentativas");
            $("#listaPrescricoes").html(`
                <tr>
                    <td class='text-center text-danger'>
                        <div class="alert alert-danger">
                            <strong>Erro:</strong> ID de internação inválido. 
                            <hr>
                            <small>Por favor, recarregue a página ou contate o suporte técnico.</small>
                        </div>
                    </td>
                </tr>`);
            return;
        }
    }
    
    console.log(`[Debug] Iniciando carregarPrescricoes com ID: ${id}, lastUpdate: ${lastUpdate}`);
    
    // Verificar se o ID é válido (verificação final)
    if (!validarIdInternacao(id)) {
        console.error("[Debug] ID de internação inválido ou não definido após todas as validações.");
        $("#listaPrescricoes").html(`
            <tr>
                <td class='text-center text-danger'>
                    <div class="alert alert-danger">
                        <strong>Erro:</strong> ID de internação não definido. 
                        <hr>
                        <small>Verifique se o paciente está corretamente selecionado.</small>
                    </div>
                </td>
            </tr>`);
        return;
    }
    
    // Garantir que a variável global esteja sempre atualizada para uso futuro
    window.internacaoId = id;
    
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
    
    // Configurar evento para calcular horários múltiplos dias
    $('#btn_calcular_multiplos_dias').click(function() {
        const dataInicio = $('#aprazamento_data_inicio').val();
        const dataFim = $('#aprazamento_data_fim').val();
        const horaInicial = $('#aprazamento_hora_inicial_multiplos').val();
        
        if (!dataInicio || !dataFim) {
            alert('Por favor, defina as datas de início e fim.');
            return;
        }
        
        // Verificar se data de início é menor que data de fim
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        if (inicio > fim) {
            alert('A data de início deve ser menor ou igual à data de fim.');
            return;
        }
        
        // Obter o intervalo
        let intervaloHoras;
        if ($('#aprazamento_multiplos_intervalo').val() === 'custom') {
            intervaloHoras = parseFloat($('#aprazamento_multiplos_intervalo_custom').val());
            if (!intervaloHoras || intervaloHoras <= 0 || intervaloHoras > 24) {
                alert('Por favor, defina um intervalo válido entre 0.5 e 24 horas.');
                return;
            }
        } else {
            intervaloHoras = parseFloat($('#aprazamento_multiplos_intervalo').val());
        }
        
        try {
            // Calcular horários usando a função do arquivo calculo_horarios.js
            const horariosPorDia = calcularHorariosIntervaloFixo(dataInicio, dataFim, intervaloHoras, horaInicial);
            
            if (Object.keys(horariosPorDia).length === 0) {
                $('#horarios_multiplos_dias').html('<p class="text-danger">Não foi possível calcular horários com os parâmetros informados. Verifique se o intervalo não é muito grande para o período definido.</p>');
                return;
            }
            
            // Formatar HTML com dias e horários
            const html = gerarHTMLHorariosPorDia(horariosPorDia);
            $('#horarios_multiplos_dias').html(html);
        } catch (error) {
            console.error('Erro ao calcular horários:', error);
            $('#horarios_multiplos_dias').html(`<p class="text-danger">Erro ao calcular horários: ${error.message}</p>`);
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


// Exportação para uso em outros módulos
// Usado quando o sistema é construído com webpack ou similar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validarFormatoAprazamento,
        formatarAprazamentoLegivel,
        contarDosesAprazamento,
        inicializarCamposHoraInicial
    };
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



// Evento para abrir o modal de visualização do aprazamento ao clicar no botão
$(document).on('click', '.btn-ver-aprazamento', function () {
    const prescricaoId = $(this).data('prescricao-id');
    const medicamentoIndex = $(this).data('medicamento-index');

    // Você precisará pegar o aprazamento correspondente.
    // Para agora, vou buscar direto no HTML, supondo que em cada linha de medicamento tenha um atributo data-aprazamento.
    const textoAprazamento = $(this).data('aprazamento') || 'Aprazamento não encontrado.';

    inicializarModalCalendarioAprazamento(textoAprazamento, 'Aprazamento do Medicamento');
});

// Exportar a função para uso em outros arquivos
if (typeof window !== 'undefined') {
    window.corrigirFormatoAprazamento = corrigirFormatoAprazamento;
}