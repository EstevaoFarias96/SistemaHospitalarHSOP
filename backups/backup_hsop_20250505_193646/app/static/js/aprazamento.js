// Arquivo auxiliar para funções de aprazamento
// Este arquivo contém funções de apoio para o processo de aprazamento
// As funções principais estão em calculo_horarios.js e calendario_aprazamento.js

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

// Atualização da função para submissão do formulário de aprazamento no novo layout
$(document).ready(function() {
    // Configurar o comportamento do formulário de aprazamento quando for carregado
    $('#formAprazamento').on('submit', function(e) {
        e.preventDefault();
        
        const prescricaoId = $('#aprazamento_prescricao_id').val();
        const medicamentoIndex = parseInt($('#aprazamento_medicamento_index').val(), 10);
        
        if (!prescricaoId || isNaN(medicamentoIndex)) {
            alert('Erro na identificação da prescrição ou medicamento');
            return;
        }
        
        // Mostrar indicador de carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
        btnSubmit.prop('disabled', true);
        
        // Processar apenas a aba de múltiplos dias (única disponível no novo layout)
        if ($('#horarios_multiplos_dias .horario-check').length === 0) {
            alert('Por favor, calcule os horários primeiro.');
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            return;
        }
        
        // Processar os horários selecionados para múltiplos dias
        const aprazamentoTexto = processarHorariosSelecionados($('#formAprazamento'));
        
        if (!aprazamentoTexto) {
            alert('Selecione pelo menos um horário de administração.');
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            return;
        }
        
        // Para depuração
        console.log('Aprazamento processado para múltiplos dias:', aprazamentoTexto);
        
        const dados = {
            prescricao_id: prescricaoId,
            medicamento_index: medicamentoIndex,
            enfermeiro_id: parseInt($('#formAprazamento').data('enfermeiro-id') || 0, 10),
            aprazamento: aprazamentoTexto
        };
        
        // Enviar requisição para registrar o aprazamento
        $.ajax({
            url: '/api/prescricoes/aprazamento',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function(response) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                if (response.success) {
                    // Fechar modal
                    $('#modalAprazamento').modal('hide');
                    
                    // Recarregar lista de prescrições
                    if (typeof carregarPrescricoes === 'function') {
                        carregarPrescricoes();
                    }
                    
                    // Mostrar mensagem de sucesso
                    alert('Aprazamento registrado com sucesso!');
                } else {
                    alert('Erro ao registrar aprazamento: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function(xhr, status, error) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                console.error('Erro ao registrar aprazamento:', xhr.responseText);
                alert('Erro de comunicação ao tentar registrar aprazamento: ' + (xhr.responseJSON?.error || error));
            }
        });
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
    
    // Configurar evento para calcular horários múltiplos dias
    $(document).on('click', '#btn_calcular_multiplos_dias', function() {
        gerarAprazamentoMultiplosDias();
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

/**
 * Gera o texto de aprazamento para intervalos de horários no mesmo dia
 */
function gerarAprazamentoIntervaloMesmoDia() {
    try {
        const data = $('#data-aprazamento').val();
        const horaInicio = $('#hora-inicio').val();
        const horaFim = $('#hora-fim').val();
        const intervalo = parseInt($('#intervalo-horas').val());
        
        if (!data || !horaInicio || !horaFim || !intervalo) {
            console.error('Dados incompletos para gerar aprazamento');
            return;
        }
        
        // Parsing das horas
        const inicio = moment(horaInicio, 'HH:mm');
        const fim = moment(horaFim, 'HH:mm');
        
        // Verificar se a hora de fim é maior que a hora de início
        if (fim.isBefore(inicio)) {
            alert('A hora de fim deve ser maior que a hora de início.');
            return;
        }
        
        // Gerar os horários com o intervalo especificado
        let horarios = [];
        let atual = inicio.clone();
        
        while (atual.isSameOrBefore(fim)) {
            horarios.push(atual.format('HH:mm'));
            atual.add(intervalo, 'hours');
        }
        
        // Formatar a saída
        let resultado = `${moment(data).format('DD/MM/YYYY')}: ${horarios.join(', ')}`;
        
        // Aplicar formatação simplificada
        resultado = formatarAprazamentoSimplificado(resultado);
        
        console.log('Aprazamento gerado:', resultado);
        $('#texto-aprazamento').val(resultado);
        
        // Visualizar no calendário
        $('#texto-aprazamento-modal').val(resultado);
        visualizarCalendarioAprazamento('texto-aprazamento-modal', 'calendario-aprazamento-conteudo');
        
        // Abrir o modal
        const modal = new bootstrap.Modal(document.getElementById('modal-calendario-aprazamento'));
        modal.show();
    } catch (e) {
        console.error('Erro ao gerar aprazamento:', e);
        alert('Erro ao gerar aprazamento. Verifique os dados e tente novamente.');
    }
}

/**
 * Gera o texto de aprazamento para múltiplos dias
 */
function gerarAprazamentoMultiplosDias() {
    const dataInicio = $('#aprazamento_data_inicio').val();
    const dataFim = $('#aprazamento_data_fim').val();
    const horaInicial = $('#aprazamento_hora_inicial_multiplos').val();
    
    if (!dataInicio || !dataFim || !horaInicial) {
        alert('Por favor, preencha todos os campos: data de início, data de fim e hora inicial.');
        return;
    }
    
    // Verificar se a data de fim é posterior à data de início
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    
    if (dataFimObj < dataInicioObj) {
        alert('A data de fim deve ser igual ou posterior à data de início.');
        return;
    }
    
    // Obter intervalo de horas
    let intervaloHoras;
    
    if ($('#aprazamento_multiplos_intervalo').val() === 'custom') {
        intervaloHoras = parseFloat($('#aprazamento_multiplos_intervalo_custom').val());
        
        if (!intervaloHoras || intervaloHoras <= 0) {
            alert('O intervalo personalizado deve ser um valor válido maior que zero.');
            return;
        }
    } else {
        intervaloHoras = parseFloat($('#aprazamento_multiplos_intervalo').val());
    }
    
    // Verificar quais dias da semana estão selecionados
    const diasSelecionados = {
        0: $('#dia_dom').prop('checked'), // Domingo
        1: $('#dia_seg').prop('checked'), // Segunda
        2: $('#dia_ter').prop('checked'), // Terça
        3: $('#dia_qua').prop('checked'), // Quarta
        4: $('#dia_qui').prop('checked'), // Quinta
        5: $('#dia_sex').prop('checked'), // Sexta
        6: $('#dia_sab').prop('checked')  // Sábado
    };
    
    // Se nenhum dia da semana estiver selecionado, alertar o usuário
    if (!Object.values(diasSelecionados).some(v => v)) {
        alert('Selecione pelo menos um dia da semana para o aprazamento.');
        return;
    }
    
    // Calcular as datas e horários de administração
    const horarios = [];
    const [hora, minuto] = horaInicial.split(':').map(Number);
    
    // Loop através dos dias
    let dataAtual = new Date(dataInicioObj);
    while (dataAtual <= dataFimObj) {
        // Verificar se o dia da semana está selecionado
        const diaSemana = dataAtual.getDay(); // 0 = Domingo, 1 = Segunda, etc.
        
        if (diasSelecionados[diaSemana]) {
            // Calcular horários para este dia
            const dia = String(dataAtual.getDate()).padStart(2, '0');
            const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
            const ano = dataAtual.getFullYear();
            const dataFormatada = `${dia}/${mes}/${ano}`;
            
            let horaAtual = new Date(dataAtual);
            horaAtual.setHours(hora, minuto, 0, 0);
            
            // Loop de horários dentro do dia
            let horasAdicionadas = 0;
            while (horasAdicionadas < 24) {
                const horaFormatada = `${String(horaAtual.getHours()).padStart(2, '0')}:${String(horaAtual.getMinutes()).padStart(2, '0')}`;
                
                // Adicionar o horário formatado
                horarios.push({
                    data: dataFormatada,
                    hora: horaFormatada,
                    valor: `${dataFormatada}:${horaFormatada}`
                });
                
                // Avançar para o próximo horário
                horaAtual.setTime(horaAtual.getTime() + (intervaloHoras * 60 * 60 * 1000));
                horasAdicionadas += intervaloHoras;
                
                // Se o próximo horário é no dia seguinte, parar o loop
                if (horaAtual.getDate() !== dataAtual.getDate()) {
                    break;
                }
            }
        }
        
        // Avançar para o próximo dia
        dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Ordenar os horários por data e hora
    horarios.sort((a, b) => {
        // Primeiro ordenar por data (convertendo DD/MM/YYYY para objeto Date)
        const partsA = a.data.split('/');
        const partsB = b.data.split('/');
        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
        
        const dateComparison = dateA - dateB;
        if (dateComparison !== 0) {
            return dateComparison;
        }
        
        // Se a data for a mesma, ordenar por hora
        return a.hora.localeCompare(b.hora);
    });
    
    // Gerar o HTML com os horários calculados
    let dataAnterior = null;
    let html = '';
    
    // Agrupar horários por data
    const horariosPorData = {};
    
    horarios.forEach(item => {
        if (!horariosPorData[item.data]) {
            horariosPorData[item.data] = [];
        }
        horariosPorData[item.data].push(item);
    });
    
    // Gerar HTML para cada data
    Object.keys(horariosPorData).sort().forEach(data => {
        const horariosData = horariosPorData[data];
        
        html += `
            <div class="mb-2 px-1">
                <div class="d-flex align-items-center mb-1">
                    <div class="small fw-bold me-2">${data}</div>
                    <div class="flex-grow-1" style="height: 1px; background-color: #dee2e6;"></div>
                    <div class="ms-2">
                        <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-1 selecionar-dia" data-data="${data}">
                            <i class="fas fa-check-square" style="font-size: 10px;"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-1 desmarcar-dia" data-data="${data}">
                            <i class="fas fa-square" style="font-size: 10px;"></i>
                        </button>
                    </div>
                </div>
                <div class="d-flex flex-wrap gap-1">
        `;
        
        horariosData.forEach(item => {
            html += `
                <div class="form-check form-check-inline m-0 me-1" style="min-width: 55px;">
                    <input class="form-check-input horario-check" type="checkbox" 
                          id="hora_${item.valor.replace(/[/:]/g, '_')}" 
                          value="${item.valor}" data-data="${data}" checked>
                    <label class="form-check-label small" for="hora_${item.valor.replace(/[/:]/g, '_')}">
                        ${item.hora}
                    </label>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    // Atualizar o elemento com os horários calculados
    if (horarios.length === 0) {
        $('#horarios_multiplos_dias').html('<p class="text-muted small text-center mb-0">Nenhum horário disponível para os dias selecionados.</p>');
    } else {
        $('#horarios_multiplos_dias').html(html);
        
        // Adicionar eventos para os botões de selecionar/desmarcar por dia
        $('.selecionar-dia').on('click', function() {
            const data = $(this).data('data');
            $(`.horario-check[data-data="${data}"]`).prop('checked', true);
        });
        
        $('.desmarcar-dia').on('click', function() {
            const data = $(this).data('data');
            $(`.horario-check[data-data="${data}"]`).prop('checked', false);
        });
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
