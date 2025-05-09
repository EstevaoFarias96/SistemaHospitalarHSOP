/**
 * Aprazamento Helper - Funções auxiliares para o sistema de aprazamento
 * 
 * Este arquivo contém funções que ajudam a resolver problemas comuns
 * do sistema de aprazamento de medicamentos.
 */

// Função para verificar se o aprazamento foi realmente armazenado
function verificarAprazamentoRealizado(prescricaoId) {
    console.log(`Verificando aprazamento para prescrição ID: ${prescricaoId}`);
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `/api/prescricoes/aprazamento/${prescricaoId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.aprazamento) {
                    console.log('Aprazamento confirmado no banco de dados:', response.aprazamento);
                    resolve(response.aprazamento);
                } else {
                    console.warn('Aprazamento não encontrado na verificação:', response);
                    reject('Aprazamento não encontrado');
                }
            },
            error: function(xhr) {
                console.error('Erro ao verificar aprazamento:', xhr.responseText);
                reject('Erro ao verificar aprazamento');
            }
        });
    });
}

/**
 * Corrige problemas comuns em aprazamentos
 * @param {string} textoAprazamento - O texto de aprazamento para corrigir
 * @return {string} - O texto de aprazamento corrigido
 */
function corrigirAprazamentoInvalido(textoAprazamento) {
    if (!textoAprazamento) return "";
    
    console.log(`Tentando corrigir aprazamento: "${textoAprazamento}"`);
    
    // Remover espaços extras e linhas novas
    let resultado = textoAprazamento.trim().replace(/\n/g, ' ');
    
    // Se é apenas horários no formato HH:MM sem a data, adicionar a data atual
    if (/^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$/.test(resultado)) {
        try {
            const hoje = new Date();
            const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
            resultado = `${dataAtual}: ${resultado}`;
            console.log(`Aprazamento parcial corrigido com data atual: "${resultado}"`);
        } catch (e) {
            console.error('Erro ao adicionar data atual ao aprazamento:', e);
        }
    }
    
    // Verificar formato com múltiplos ":"
    if (resultado.split(':').length > 2) {
        try {
            // Dividir por ";" primeiro para lidar com múltiplos dias
            const partes = resultado.split(';').map(p => p.trim()).filter(p => p);
            const partesCorrigidas = [];
            
            for (const parte of partes) {
                // Verificar se a parte tem formato de data DD/MM/YYYY
                const dataMatch = parte.match(/^(\d{2}\/\d{2}\/\d{4})/);
                
                if (dataMatch) {
                    // Extrair a data
                    const data = dataMatch[1];
                    // Resto do texto após a data
                    const resto = parte.substring(data.length);
                    
                    // Verificar se o formato é com ":" logo após a data
                    if (resto.startsWith(':')) {
                        // Formato correto, apenas limpar espaços extras
                        const horarios = resto.substring(1).trim();
                        partesCorrigidas.push(`${data}: ${horarios}`);
                    } else {
                        // Formato incorreto, tentar encontrar onde estão os horários
                        const horariosMatch = parte.match(/(\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*)/);
                        if (horariosMatch) {
                            partesCorrigidas.push(`${data}: ${horariosMatch[1]}`);
                        } else {
                            // Não foi possível extrair horários, manter original
                            partesCorrigidas.push(parte);
                        }
                    }
                } else {
                    // Não tem formato de data, verificar se é apenas horários
                    const horariosMatch = parte.match(/^(\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*)/);
                    if (horariosMatch) {
                        // Adicionar data atual
                        const hoje = new Date();
                        const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
                        partesCorrigidas.push(`${dataAtual}: ${horariosMatch[1]}`);
                    } else {
                        // Formato não reconhecido, manter original
                        partesCorrigidas.push(parte);
                    }
                }
            }
            
            // Juntar as partes corrigidas
            resultado = partesCorrigidas.join('; ');
            console.log(`Aprazamento com múltiplos ":" corrigido: "${resultado}"`);
        } catch (e) {
            console.error('Erro ao corrigir formato com múltiplos ":":', e);
        }
    }
    
    return resultado;
}

// Função para processar os medicamentos de uma prescrição e garantir que o aprazamento seja exibido corretamente
function processarMedicamentosComAprazamento(prescricao) {
    if (!prescricao) return prescricao;
    
    // Garantir que medicamentos seja sempre um array
    if (!prescricao.medicamentos) {
        prescricao.medicamentos = [];
    }
    
    // Iterar pelos medicamentos e garantir que o campo aprazamento esteja formatado corretamente
    prescricao.medicamentos.forEach(medicamento => {
        if (!medicamento) return;
        
        // Verificar se o aprazamento existe
        if (medicamento.aprazamento) {
            try {
                // Tentar corrigir aprazamentos com formato inválido
                medicamento.aprazamento = corrigirAprazamentoInvalido(medicamento.aprazamento);
                
                // Garantir que o aprazamento esteja em um formato legível usando a função existente
                // formatarAprazamentoLegivel (se disponível)
                if (typeof formatarAprazamentoLegivel === 'function') {
                    // Armazenar o aprazamento original para debugging
                    medicamento._aprazamento_original = medicamento.aprazamento;
                    
                    // Formatar o aprazamento para exibição
                    medicamento.aprazamento_formatado = formatarAprazamentoLegivel(medicamento.aprazamento);
                } else {
                    medicamento.aprazamento_formatado = medicamento.aprazamento;
                }
            } catch (e) {
                console.error('Erro ao formatar aprazamento:', e);
                medicamento.aprazamento_formatado = medicamento.aprazamento;
            }
        } else {
            medicamento.aprazamento_formatado = "Não aprazado";
        }
    });
    
    // Se a prescrição tem aprazamento geral, mas os medicamentos não, distribuir para os medicamentos
    if (prescricao.aprazamento && prescricao.medicamentos.length > 0) {
        // Garantir que o aprazamento geral esteja correto
        prescricao.aprazamento = corrigirAprazamentoInvalido(prescricao.aprazamento);
        
        let aplicouAprazamento = false;
        
        // Verificar se algum medicamento já tem aprazamento
        const algumTemAprazamento = prescricao.medicamentos.some(med => med.aprazamento);
        
        // Se nenhum medicamento tiver aprazamento, distribuir o geral para todos
        if (!algumTemAprazamento) {
            prescricao.medicamentos.forEach(medicamento => {
                if (!medicamento.aprazamento) {
                    medicamento.aprazamento = prescricao.aprazamento;
                    medicamento.aprazamento_formatado = medicamento.aprazamento;
                    aplicouAprazamento = true;
                }
            });
        }
        
        if (aplicouAprazamento) {
            console.log("Aplicado aprazamento geral da prescrição aos medicamentos");
        }
    }
    
    return prescricao;
}

// Função envoltória para carregarPrescricoes que adiciona o processamento de aprazamento
function carregarPrescricoesComAprazamento(idInternacao = null, lastUpdate = false) {
    console.log(`🔄 Carregando prescrições com processamento de aprazamento`);
    console.log(`- ID fornecido: ${idInternacao}`);
    console.log(`- lastUpdate: ${lastUpdate}`);
    
    // Se a função original existe, chamá-la com argumentos corretos
    if (typeof window.carregarPrescricoesOriginal === 'function') {
        console.log(`✓ Usando função original carregarPrescricoes`);
        const resultadoOriginal = window.carregarPrescricoesOriginal(idInternacao, lastUpdate);
        return resultadoOriginal;
    }
    
    // Caso contrário, implementar uma versão própria
    console.log(`ℹ️ Implementando versão própria de carregarPrescricoes`);
    
    // Mostrar indicador de carregamento, se não for atualização
    if (!lastUpdate) {
        $("#listaPrescricoes").html(`
            <tr>
                <td class='text-center'>
                    <div class='spinner-border text-primary' role='status'>
                        <span class='visually-hidden'>Carregando...</span>
                    </div>
                    <p class="mt-2">Carregando prescrições...</p>
                </td>
            </tr>
        `);
    }
    
    // Tentar obter ID da internação de várias fontes, em ordem de prioridade
    let id = null;
    
    // 1. ID fornecido como parâmetro tem prioridade
    if (idInternacao && !isNaN(parseInt(idInternacao))) {
        id = parseInt(idInternacao);
        console.log(`✓ Usando ID fornecido por parâmetro: ${id}`);
    } 
    // 2. ID global definido na variável window.internacaoId
    else if (window.internacaoId && !isNaN(parseInt(window.internacaoId))) {
        id = parseInt(window.internacaoId);
        console.log(`✓ Usando ID da variável global window.internacaoId: ${id}`);
    }
    // 3. Tentar encontrar na página usando a função de busca avançada
    else {
        id = getInternacaoIdFromPage();
        if (id) {
            console.log(`✓ ID encontrado na página: ${id}`);
            // Definir o ID encontrado como global para uso futuro
            window.internacaoId = id;
        }
    }
    
    // Verificar se o ID foi encontrado
    if (!id) {
        console.error("❌ Falha: ID da internação não disponível por nenhum método");
        $("#listaPrescricoes").html(`
            <tr>
                <td class='text-center text-danger'>
                    <div class="alert alert-danger">
                        <strong>Erro:</strong> ID da internação não disponível
                        <hr>
                        <small>Por favor, verifique se você está na página correta de um paciente internado.</small>
                    </div>
                </td>
            </tr>
        `);
        return;
    }
    
    // Log para diagnóstico
    console.log(`🔍 Tentando carregar prescrições para ID: ${id}`);
    
    // Fazer requisição AJAX para obter prescrições
    $.ajax({
        url: "/api/prescricoes/" + id,
        type: 'GET',
        success: function(response) {
            console.log("✓ Resposta recebida da API de prescrições:", response);
            
            // Verificar se a resposta tem sucesso
            if (!response.success) {
                console.error("❌ Erro retornado pela API:", response.error);
                $("#listaPrescricoes").html(`
                    <tr>
                        <td class='text-center text-warning'>
                            <div class="alert alert-warning">
                                <strong>Erro ao carregar prescrições:</strong> ${response.error || 'Erro desconhecido'}
                            </div>
                        </td>
                    </tr>
                `);
                return;
            }
            
            // Verificar se há prescrições
            if (!response.prescricoes || response.prescricoes.length === 0) {
                console.log("ℹ️ Nenhuma prescrição encontrada");
                $("#listaPrescricoes").html(`
                    <tr>
                        <td class='text-center'>
                            <div class="alert alert-info">
                                Nenhuma prescrição encontrada para este paciente
                            </div>
                        </td>
                    </tr>
                `);
                return;
            }
            
            // Log para diagnóstico
            console.log(`✓ ${response.prescricoes.length} prescrições encontradas`);
            
            // Processar cada prescrição para garantir formato correto de aprazamento
            response.prescricoes.forEach((prescricao, index) => {
                console.log(`Processando prescrição #${index + 1}, ID: ${prescricao.id}`);
                
                // Verificar se o campo medicamentos existe ou precisa ser criado
                if (!prescricao.medicamentos && prescricao.medicamentos_json) {
                    try {
                        // Se medicamentos_json é uma string, converter para objeto
                        if (typeof prescricao.medicamentos_json === 'string' && prescricao.medicamentos_json.trim() !== '') {
                            console.log(`Convertendo medicamentos_json (string) para objeto...`);
                            prescricao.medicamentos = JSON.parse(prescricao.medicamentos_json);
                        } else if (Array.isArray(prescricao.medicamentos_json)) {
                            console.log(`medicamentos_json já é um array, usando diretamente`);
                            prescricao.medicamentos = prescricao.medicamentos_json;
                        }
                    } catch (e) {
                        console.error(`❌ Erro ao processar medicamentos_json para prescrição ID ${prescricao.id}:`, e);
                        console.error(`Texto problemático:`, prescricao.medicamentos_json);
                        prescricao.medicamentos = [];
                    }
                }
                
                // Garantir que medicamentos seja sempre um array
                if (!prescricao.medicamentos || !Array.isArray(prescricao.medicamentos)) {
                    console.log(`Criando array vazio para medicamentos da prescrição ID ${prescricao.id}`);
                    prescricao.medicamentos = [];
                }
                
                // Processar medicamentos
                prescricao = processarMedicamentosComAprazamento(prescricao);
                
                // Verificar se o processamento adicionou aprazamentos
                const numAprazados = prescricao.medicamentos.filter(med => med.aprazamento).length;
                console.log(`Prescrição #${index + 1} processada: ${numAprazados}/${prescricao.medicamentos.length} medicamentos com aprazamento`);
            });
            
            // Ordenar prescrições por data (mais recente primeiro)
            var prescricoes = response.prescricoes.sort(function(a, b) {
                return new Date(b.data_prescricao) - new Date(a.data_prescricao);
            });
            
            // Reconstruir a interface com as prescrições processadas
            console.log(`Renderizando ${prescricoes.length} prescrições na interface`);
            renderizarPrescricoes(prescricoes);
        },
        error: function(xhr, status, error) {
            console.error('❌ Erro ao buscar prescrições:', xhr.responseText);
            $("#listaPrescricoes").html(`
                <tr>
                    <td class='text-center text-danger'>
                        <div class="alert alert-danger">
                            <strong>Erro de comunicação ao buscar prescrições</strong>
                            <hr>
                            <small>${error || 'Erro desconhecido'}</small>
                            <br>
                            <small>Status: ${status}, Código: ${xhr.status}</small>
                        </div>
                    </td>
                </tr>
            `);
            
            // Verificar se precisa tentar novamente com outro método
            if (xhr.status === 404 && !lastUpdate) {
                console.log("⚠️ Erro 404, tentando novamente com outro método de obtenção do ID...");
                setTimeout(() => {
                    // Limpar o ID atual que não funcionou
                    window.internacaoId = null;
                    // Tentar encontrar novamente, ignorando o cache
                    const novoId = getInternacaoIdFromPage();
                    if (novoId && novoId !== id) {
                        console.log(`🔄 Tentando novamente com novo ID: ${novoId}`);
                        carregarPrescricoesComAprazamento(novoId, true);
                    }
                }, 1000);
            }
        }
    });
}

// Função para tentar extrair o ID da internação da página
function getInternacaoIdFromPage() {
    console.log("🔍 Tentando obter ID da internação através de múltiplos métodos");
    let idEncontrado = null;
    
    // Método 1: Verificar variáveis globais diretamente
    try {
        const possibleVars = ['internacaoId', 'id', 'idInternacao', 'atendimentoId', 'idAtendimento'];
        for (const varName of possibleVars) {
            if (window[varName] && !isNaN(parseInt(window[varName]))) {
                idEncontrado = parseInt(window[varName]);
                console.log(`ID da internação encontrado na variável global ${varName}:`, idEncontrado);
                return idEncontrado;
            }
        }
    } catch (e) {
        console.error("Erro ao verificar variáveis globais:", e);
    }
    
    // Método 2: Extrair da URL
    try {
        // Padrões comuns de URL para páginas de internação
        const regexPatterns = [
            /\/internacao\/(\d+)/,               // /internacao/123
            /\/paciente\/(\d+)\/internacao/,     // /paciente/123/internacao
            /\/atendimento[\/\-\_](\d+)/,        // /atendimento/123, /atendimento-123, /atendimento_123
            /\/evolucao\-paciente\-[^\/]+\/(\d+)/,  // /evolucao-paciente-medico/123
            /\/(clinica|enfermeiro|medico)\/(\d+)/, // /clinica/123, /enfermeiro/123, /medico/123
            /\/(\d+)$/                           // qualquer URL terminando com número
        ];
        
        const currentPath = window.location.pathname;
        console.log(`Analisando URL atual: ${currentPath}`);
        
        for (const pattern of regexPatterns) {
            const matches = currentPath.match(pattern);
            if (matches) {
                // O último grupo de captura deve ser o ID
                const possibleId = matches[matches.length - 1];
                if (possibleId && !isNaN(parseInt(possibleId))) {
                    idEncontrado = parseInt(possibleId);
                    console.log(`ID da internação extraído da URL usando padrão ${pattern}:`, idEncontrado);
                    return idEncontrado;
                }
            }
        }
    } catch (e) {
        console.error("Erro ao extrair ID da URL:", e);
    }
    
    // Método 3: Buscar parâmetros na URL (query string)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const paramNames = ['id', 'internacao_id', 'internacaoId', 'atendimento_id', 'atendimentoId'];
        
        for (const param of paramNames) {
            if (urlParams.has(param)) {
                const paramValue = urlParams.get(param);
                if (paramValue && !isNaN(parseInt(paramValue))) {
                    idEncontrado = parseInt(paramValue);
                    console.log(`ID da internação encontrado no parâmetro de URL ${param}:`, idEncontrado);
                    return idEncontrado;
                }
            }
        }
    } catch (e) {
        console.error("Erro ao extrair ID dos parâmetros da URL:", e);
    }
    
    // Método 4: Buscar elementos no HTML com IDs ou data attributes
    try {
        // Arrays de seletores para buscar
        const idSelectors = [
            '[data-internacao-id]',
            '[data-id]',
            '[data-atendimento-id]',
            '#internacao-id',
            '#internacaoId',
            '#internacao_id',
            '#atendimento-id',
            '#atendimentoId',
            '#atendimento_id',
            '[name="internacao_id"]',
            '[name="internacaoId"]',
            '[name="atendimento_id"]',
            'input[value*="internacao_id"]',
            '#prescricao_enfermagem_internacao_id',
            '#internacao_id_evolucao'
        ];
        
        for (const selector of idSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                const element = elements.first();
                
                // Tentar obter de várias maneiras
                let id = null;
                
                // Verificar data attribute
                if (element.data('internacao-id')) {
                    id = element.data('internacao-id');
                } else if (element.data('id')) {
                    id = element.data('id');
                } else if (element.data('atendimento-id')) {
                    id = element.data('atendimento-id');
                }
                // Verificar value attribute
                else if (element.val()) {
                    id = element.val();
                }
                // Verificar text content
                else if (element.text() && !isNaN(parseInt(element.text().trim()))) {
                    id = element.text().trim();
                }
                
                if (id && !isNaN(parseInt(id))) {
                    idEncontrado = parseInt(id);
                    console.log(`ID da internação encontrado no DOM com seletor "${selector}":`, idEncontrado);
                    return idEncontrado;
                }
            }
        }
    } catch (e) {
        console.error("Erro ao buscar ID no DOM:", e);
    }
    
    // Método 5: Procurar no HTML inteiro por padrões
    try {
        const pageHtml = document.body.innerHTML;
        const patterns = [
            /internacao[_\-\s]?id['"]\s*[:=]\s*['"]?(\d+)['"]?/i,
            /atendimento[_\-\s]?id['"]\s*[:=]\s*['"]?(\d+)['"]?/i,
            /internacao\.id['"]\s*[:=]\s*['"]?(\d+)['"]?/i,
            /id\s*da\s*internacao['"]\s*[:=]\s*['"]?(\d+)['"]?/i
        ];
        
        for (const pattern of patterns) {
            const matches = pageHtml.match(pattern);
            if (matches && matches[1]) {
                idEncontrado = parseInt(matches[1]);
                console.log(`ID da internação encontrado no HTML usando regex:`, idEncontrado);
                return idEncontrado;
            }
        }
    } catch (e) {
        console.error("Erro ao analisar HTML da página:", e);
    }
    
    // Método 6: Verificar se há um ID na sessão do usuário
    try {
        if (window.session) {
            if (window.session.internacao_id) {
                idEncontrado = parseInt(window.session.internacao_id);
                console.log("ID da internação encontrado na sessão:", idEncontrado);
                return idEncontrado;
            }
            if (window.session.atendimento_id) {
                idEncontrado = parseInt(window.session.atendimento_id);
                console.log("ID do atendimento encontrado na sessão:", idEncontrado);
                return idEncontrado;
            }
        }
    } catch (e) {
        console.error("Erro ao verificar sessão:", e);
    }
    
    // Método 7: Tentar encontrar através de scripts na página
    try {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i].innerHTML;
            const matches = script.match(/(?:internacao|atendimento)[_\-\s]?id\s*[:=]\s*['"]?(\d+)['"]?/i);
            if (matches && matches[1]) {
                idEncontrado = parseInt(matches[1]);
                console.log("ID encontrado em scripts da página:", idEncontrado);
                return idEncontrado;
            }
        }
    } catch (e) {
        console.error("Erro ao analisar scripts da página:", e);
    }
    
    // Se chegou aqui, não conseguiu encontrar o ID
    console.warn("⚠️ Não foi possível encontrar o ID da internação através de nenhum método");
    return null;
}

// Função para renderizar as prescrições na interface
function renderizarPrescricoes(prescricoes) {
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
            if (window.session && window.session.cargo && window.session.cargo.toLowerCase().trim() === "medico") {
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
                    '<table class="table table-sm table-bordered table-striped">' +
                    '<thead class="thead-light">' +
                    '<tr>' +
                    '<th>Medicamento</th>' +
                    '<th>Uso</th>' +
                    '<th>Aprazamento</th>' +
                    '<th>Enfermeiro</th>' +
                    ((window.session && window.session.cargo && window.session.cargo.toLowerCase().trim() === "enfermeiro") ? '<th>Ações</th>' : '') +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>';
                    
                // Verificar e destacar problemas de aprazamento para debugging
                let problemasAprazamento = false;
                
                prescricao.medicamentos.forEach(function(medicamento, idx) {
                    // Verificar se medicamento é válido
                    if (!medicamento) {
                        console.warn("Medicamento inválido encontrado no índice", idx);
                        return;
                    }
                    
                    html += '<tr>' +
                        '<td>' + (medicamento.nome_medicamento || '') + '</td>' +
                        '<td>' + (medicamento.descricao_uso || '') + '</td>' +
                        '<td>';
                        
                    // Adicionar o texto de aprazamento com botão para visualizar em calendário
                    if (medicamento.aprazamento) {
                        html += '<div class="d-flex justify-content-center">' +
                            '<button type="button" class="btn btn-sm btn-primary btn-visualizar-aprazamento" ' +
                            'data-aprazamento="' + (medicamento.aprazamento || '').replace(/"/g, '&quot;') + '" ' +
                            'data-medicamento="' + (medicamento.nome_medicamento || '').replace(/"/g, '&quot;') + '">' +
                            '<i class="fas fa-calendar-alt"></i> Ver Aprazamentos' +
                            '</button>' +
                            '</div>';
                    } else {
                        html += '<span class="text-muted">Não aprazado</span>';
                        
                        // Destacar se houver inconsistência
                        if (medicamento.aprazamento_formatado && medicamento.aprazamento_formatado !== "Não aprazado") {
                            problemasAprazamento = true;
                            html += '<small class="text-danger d-block mt-1">⚠️ Possível problema de exibição</small>';
                        }
                    }
                    
                    html += '</td>' +
                        '<td>' + (medicamento.enfermeiro_nome || '') + '</td>';
                    
                    // Adicionar botão de aprazamento para enfermeiros
                    if (window.session && window.session.cargo && window.session.cargo.toLowerCase().trim() === "enfermeiro") {
                        html += '<td>' +
                            '<button class="btn btn-primary btn-sm btn-aprazamento" ' +
                            'data-prescricao-id="' + prescricao.id + '" ' +
                            'data-medicamento-index="' + idx + '" ' +
                            'data-medicamento-nome="' + (medicamento.nome_medicamento || '').replace(/"/g, '&quot;') + '">' +
                            '<i class="fas fa-clock"></i> Aprazar' +
                            '</button>' +
                            '</td>';
                    }
                    
                    html += '</tr>';
                });
                
                // Adicionar aviso de debugging se necessário
                if (problemasAprazamento) {
                    html += '<tr class="table-warning"><td colspan="' + (window.session?.cargo?.toLowerCase() === 'enfermeiro' ? '5' : '4') + '">' +
                           '<div class="alert alert-warning mb-0 py-1"><small>⚠️ Possível problema na exibição de aprazamentos. Por favor, recarregue a página.</small></div>' +
                           '</td></tr>';
                }
                
                html += '</tbody></table></div>';
            } else if (prescricao.aprazamento) {
                // Se há um aprazamento geral na prescrição (sem detalhar medicamentos)
                html += '<div class="mt-3 mb-2">' +
                    '<h6><i class="fas fa-pills text-danger mr-1"></i> Aprazamentos</h6>' +
                    '<div class="d-flex justify-content-center mb-2">' +
                    '<button type="button" class="btn btn-primary btn-visualizar-aprazamento" ' +
                    'data-aprazamento="' + (prescricao.aprazamento || '').replace(/"/g, '&quot;') + '" ' +
                    'data-medicamento="Medicamentos da prescrição">' +
                    '<i class="fas fa-calendar-alt"></i> Ver Aprazamentos' +
                    '</button>' +
                    '</div>' +
                    '</div>';
            }
            
            // Seção de Procedimentos Médicos
            if (prescricao.texto_procedimento_medico) {
                html += '<div class="mt-3 mb-2">' +
                    '<h6><i class="fas fa-user-md text-primary mr-1"></i> Procedimentos Médicos</h6>' +
                    '<div class="card card-body bg-light">' + prescricao.texto_procedimento_medico + '</div>' +
                    '</div>';
            }
            
            // Seção de Procedimentos Multidisciplinares
            if (prescricao.texto_procedimento_multi) {
                html += '<div class="mt-3 mb-2">' +
                    '<h6><i class="fas fa-users text-info mr-1"></i> Procedimentos Multidisciplinares</h6>' +
                    '<div class="card card-body bg-light">' + prescricao.texto_procedimento_multi + '</div>' +
                    '</div>';
            }
            
            html += '</div>';
        });
        
        html += '</div></div>';
    });
    
    html += "</td></tr>";
    
    $("#listaPrescricoes").html(html);
    
    // Reativar os botões após a renderização
    ativarBotoesInterface();
    
    // Verificar se algum botão de aprazamento foi renderizado
    const botoes = $('.btn-visualizar-aprazamento').length;
    console.log(`Renderizados ${botoes} botões de visualização de aprazamento`);
}

// Função para ativar os botões na interface após renderização
function ativarBotoesInterface() {
    // Ativar botões de aprazamento
    $('.btn-aprazamento').off('click').on('click', function() {
        const prescricaoId = $(this).data('prescricao-id');
        const medicamentoIndex = $(this).data('medicamento-index');
        const medicamentoNome = $(this).data('medicamento-nome');
        
        // Preencher os campos do modal de aprazamento
        $('#aprazamento_prescricao_id').val(prescricaoId);
        $('#aprazamento_medicamento_index').val(medicamentoIndex);
        $('#aprazamento_medicamento_nome').text(medicamentoNome);
        
        // Armazenar o ID do enfermeiro para uso no formulário
        $('#formAprazamento').data('enfermeiro-id', window.session ? window.session.user_id : 0);
        
        // Definir data/hora atual como valores padrão
        const agora = new Date();
        const anoAtual = agora.getFullYear();
        const mesAtual = String(agora.getMonth() + 1).padStart(2, '0');
        const diaAtual = String(agora.getDate()).padStart(2, '0');
        const horaAtual = String(agora.getHours()).padStart(2, '0');
        const minutoAtual = String(agora.getMinutes()).padStart(2, '0');
        
        // Definir datas de início e fim para aprazamento de múltiplos dias
        $('#aprazamento_data_inicio').val(`${anoAtual}-${mesAtual}-${diaAtual}`);
        
        // Data de fim como padrão de 7 dias depois
        const dataFim = new Date(agora);
        dataFim.setDate(dataFim.getDate() + 7);
        const anoFim = dataFim.getFullYear();
        const mesFim = String(dataFim.getMonth() + 1).padStart(2, '0');
        const diaFim = String(dataFim.getDate()).padStart(2, '0');
        $('#aprazamento_data_fim').val(`${anoFim}-${mesFim}-${diaFim}`);
        
        // Inicializar campo de hora
        $('#aprazamento_hora_inicial_multiplos').val(`${horaAtual}:${minutoAtual}`);
        
        // Limpar os horários calculados
        $('#horarios_multiplos_dias').html('<p class="text-muted small text-center mb-0">Clique em "Calcular Horários" para visualizar os horários</p>');
        
        // Abrir o modal
        $('#modalAprazamento').modal('show');
    });
    
    // Ativar botões de visualização de aprazamento
    $('.btn-visualizar-aprazamento').off('click').on('click', function(e) {
        e.preventDefault();
        const aprazamento = $(this).data('aprazamento');
        const medicamento = $(this).data('medicamento');
        
        if (typeof inicializarModalCalendarioAprazamento === 'function') {
            inicializarModalCalendarioAprazamento(aprazamento, `Aprazamentos para ${medicamento}`);
        } else {
            // Criar um modal simples se a função não estiver disponível
            mostrarModalAprazamentoSimples(aprazamento, medicamento);
        }
    });
    
    // Ativar botões de edição de prescrição
    $('.btn-editar-prescricao').off('click').on('click', function() {
        const prescricaoId = $(this).data('id');
        if (typeof editarPrescricao === 'function') {
            editarPrescricao(prescricaoId);
        } else {
            console.warn('Função editarPrescricao não encontrada');
            alert('Funcionalidade de edição não disponível.');
        }
    });
}

// Função para mostrar um modal simples de aprazamento (fallback)
function mostrarModalAprazamentoSimples(aprazamento, medicamento) {
    // Verificar se já existe o modal
    let modalAprazamento = $('#modal-aprazamento-simples');
    if (modalAprazamento.length === 0) {
        // Criar o modal se não existir
        $('body').append(`
            <div class="modal fade" id="modal-aprazamento-simples" tabindex="-1" aria-labelledby="modal-aprazamento-simples-titulo" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="modal-aprazamento-simples-titulo">Aprazamentos</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body">
                            <h5 id="aprazamento-medicamento-nome" class="text-center mb-3"></h5>
                            <div class="table-responsive">
                                <table class="table table-bordered table-striped mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="text-center">Data</th>
                                            <th class="text-center">Horários</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabela-aprazamentos">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        modalAprazamento = $('#modal-aprazamento-simples');
    }
    
    // Atualizar o título
    $('#modal-aprazamento-simples-titulo').text('Aprazamentos');
    $('#aprazamento-medicamento-nome').text(medicamento);
    
    // Processar o aprazamento para a tabela
    const tabela = $('#tabela-aprazamentos');
    tabela.empty();
    
    if (!aprazamento || aprazamento.trim() === '') {
        tabela.append('<tr><td colspan="2" class="text-center">Nenhum aprazamento registrado</td></tr>');
    } else {
        // Dividir por ';' para obter diferentes datas
        const secoes = aprazamento.split(';');
        let temAprazamento = false;
        
        secoes.forEach(secao => {
            if (!secao || secao.trim() === '') return;
            
            // Dividir cada seção por ':' para separar data e horários
            const partes = secao.trim().split(':');
            if (partes.length < 2) return;
            
            const data = partes[0].trim();
            const horarios = partes.slice(1).join(':').split(',').map(h => h.trim()).filter(h => h);
            
            if (horarios.length === 0) return;
            
            temAprazamento = true;
            
            tabela.append(`
                <tr>
                    <td class="text-center">${data}</td>
                    <td>${horarios.join(', ')}</td>
                </tr>
            `);
        });
        
        if (!temAprazamento) {
            tabela.append('<tr><td colspan="2" class="text-center">Formato de aprazamento inválido ou vazio</td></tr>');
        }
    }
    
    // Mostrar o modal
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalElement = document.getElementById('modal-aprazamento-simples');
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        } else {
            $('#modal-aprazamento-simples').modal('show');
        }
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        alert(`Aprazamentos para ${medicamento}: ${aprazamento}`);
    }
}

// Função para adicionar botão de diagnóstico aos problemas de aprazamento
function adicionarBotaoDiagnosticoAprazamento() {
    console.log('Adicionando botão de diagnóstico de aprazamento');
    
    // Verificar se o botão já existe
    if (document.getElementById('btn-diagnostico-aprazamento')) {
        console.log('Botão de diagnóstico já existe, pulando...');
        return;
    }
    
    // Criar um botão de diagnóstico para adicionar ao UI
    const botaoDiagnostico = document.createElement('button');
    botaoDiagnostico.id = 'btn-diagnostico-aprazamento';
    botaoDiagnostico.className = 'btn btn-sm btn-outline-warning position-fixed';
    botaoDiagnostico.style.bottom = '20px';
    botaoDiagnostico.style.right = '20px';
    botaoDiagnostico.style.zIndex = '1050';
    botaoDiagnostico.innerHTML = '<i class="fas fa-stethoscope"></i> Diagnóstico de Aprazamento';
    
    // Adicionar evento de clique
    botaoDiagnostico.addEventListener('click', function() {
        executarDiagnosticoAprazamento();
    });
    
    // Adicionar o botão ao body
    document.body.appendChild(botaoDiagnostico);
}

// Função para executar o diagnóstico completo de aprazamentos na página
function executarDiagnosticoAprazamento() {
    console.log('Executando diagnóstico completo de aprazamentos...');
    
    // Verificar se já existe um modal de diagnóstico
    let modalDiagnostico = document.getElementById('modal-diagnostico-aprazamento');
    
    if (!modalDiagnostico) {
        // Criar o modal de diagnóstico
        const htmlModal = `
            <div class="modal fade" id="modal-diagnostico-aprazamento" tabindex="-1" aria-labelledby="modal-diagnostico-aprazamento-label" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title" id="modal-diagnostico-aprazamento-label">
                                <i class="fas fa-stethoscope me-2"></i> Diagnóstico de Aprazamentos
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex justify-content-between mb-3">
                                <h6>Verificando todos os aprazamentos da página...</h6>
                                <button id="btn-atualizar-diagnostico" class="btn btn-sm btn-outline-secondary">
                                    <i class="fas fa-sync-alt me-1"></i> Atualizar
                                </button>
                            </div>
                            <div id="resultados-diagnostico">
                                <div class="d-flex justify-content-center p-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Carregando...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="btn-corrigir-todos">
                                <i class="fas fa-magic me-1"></i> Tentar Corrigir Todos
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar o modal ao body
        document.body.insertAdjacentHTML('beforeend', htmlModal);
        modalDiagnostico = document.getElementById('modal-diagnostico-aprazamento');
        
        // Adicionar evento para o botão de atualizar
        document.getElementById('btn-atualizar-diagnostico').addEventListener('click', function() {
            executarDiagnosticoAprazamento();
        });
        
        // Adicionar evento para o botão de corrigir todos
        document.getElementById('btn-corrigir-todos').addEventListener('click', function() {
            corrigirTodosAprazamentos();
        });
    }
    
    // Abrir o modal
    if (typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modalDiagnostico);
        bsModal.show();
    } else if (typeof $ !== 'undefined' && typeof $.fn.modal === 'function') {
        $(modalDiagnostico).modal('show');
    } else {
        alert('Não foi possível abrir o modal. Biblioteca Bootstrap não encontrada.');
        return;
    }
    
    // Executar o diagnóstico e preencher o modal
    setTimeout(() => {
        const aprazamentosEncontrados = buscarAprazamentosNaPagina();
        preencherResultadosDiagnostico(aprazamentosEncontrados);
    }, 500);
}

// Função para buscar todos os aprazamentos na página
function buscarAprazamentosNaPagina() {
    const resultado = {
        total: 0,
        problematicos: 0,
        items: []
    };
    
    // 1. Buscar elementos que exibem aprazamentos
    const botoesAprazamento = document.querySelectorAll('.btn-visualizar-aprazamento');
    
    // 2. Extrair informações de cada botão de aprazamento
    botoesAprazamento.forEach((botao, index) => {
        const textoAprazamento = botao.getAttribute('data-aprazamento') || '';
        const nomeMedicamento = botao.getAttribute('data-medicamento') || `Item #${index + 1}`;
        
        // Verificar se o formato é válido usando a função do sistema
        const formatoValido = typeof validarFormatoAprazamento === 'function' 
            ? validarFormatoAprazamento(textoAprazamento)
            : Boolean(textoAprazamento); // Fallback simples
        
        resultado.total++;
        
        const item = {
            id: index,
            textoOriginal: textoAprazamento,
            medicamento: nomeMedicamento,
            formatoValido: formatoValido,
            problemas: [],
            botaoElemento: botao
        };
        
        // Detectar problemas específicos
        if (!textoAprazamento) {
            item.problemas.push('Texto de aprazamento vazio');
            resultado.problematicos++;
        } else {
            // Verificar se o formato é inválido
            if (!formatoValido) {
                item.problemas.push('Formato inválido');
                resultado.problematicos++;
            }
            
            // Verificar problemas comuns
            if (textoAprazamento.includes('\n')) {
                item.problemas.push('Contém quebras de linha');
                resultado.problematicos++;
            }
            
            // Verificar múltiplos dois-pontos sem data
            const partes = textoAprazamento.split(':');
            if (partes.length > 2 && !textoAprazamento.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                item.problemas.push('Múltiplos dois-pontos sem formato de data válido');
                resultado.problematicos++;
            }
            
            // Verificar apenas horários sem data
            if (textoAprazamento.match(/^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$/) &&
                !textoAprazamento.match(/\d{2}\/\d{2}\/\d{4}/)) {
                item.problemas.push('Apenas horários sem data');
                resultado.problematicos++;
            }
        }
        
        // Adicionar o item ao resultado
        resultado.items.push(item);
    });
    
    return resultado;
}

// Função para preencher o modal de diagnóstico com os resultados
function preencherResultadosDiagnostico(diagnostico) {
    const containerResultados = document.getElementById('resultados-diagnostico');
    
    if (!containerResultados) {
        console.error('Container de resultados não encontrado');
        return;
    }
    
    // Criar o HTML do resumo
    let html = `
        <div class="alert ${diagnostico.problematicos > 0 ? 'alert-warning' : 'alert-success'} mb-3">
            <h6 class="alert-heading">Resumo do Diagnóstico:</h6>
            <p class="mb-0">
                Total de aprazamentos encontrados: <strong>${diagnostico.total}</strong><br>
                Aprazamentos com problemas: <strong>${diagnostico.problematicos}</strong>
            </p>
        </div>
    `;
    
    // Se não houver aprazamentos, mostrar mensagem
    if (diagnostico.total === 0) {
        html += `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> Nenhum aprazamento encontrado na página atual.
            </div>
        `;
    } else {
        // Criar tabela com os resultados
        html += `
            <div class="table-responsive">
                <table class="table table-sm table-hover border">
                    <thead class="table-light">
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Medicamento</th>
                            <th scope="col">Formato</th>
                            <th scope="col">Problemas</th>
                            <th scope="col">Texto Original</th>
                            <th scope="col">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Adicionar cada item à tabela
        diagnostico.items.forEach((item, index) => {
            const formatoClass = item.formatoValido ? 'text-success' : 'text-danger';
            const formatoIcon = item.formatoValido ? 'check-circle' : 'exclamation-circle';
            
            html += `
                <tr ${item.problemas.length > 0 ? 'class="table-warning"' : ''}>
                    <td>${index + 1}</td>
                    <td>${item.medicamento}</td>
                    <td>
                        <span class="${formatoClass}">
                            <i class="fas fa-${formatoIcon} me-1"></i>
                            ${item.formatoValido ? 'Válido' : 'Inválido'}
                        </span>
                    </td>
                    <td>
                        ${item.problemas.length > 0 
                            ? `<ul class="mb-0 ps-3 small">${item.problemas.map(p => `<li>${p}</li>`).join('')}</ul>` 
                            : '<span class="text-muted">Nenhum</span>'}
                    </td>
                    <td>
                        <code class="small">${item.textoOriginal || '(vazio)'}</code>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-visualizar-item" data-index="${item.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${item.problemas.length > 0 ? `
                            <button class="btn btn-sm btn-outline-warning btn-corrigir-item" data-index="${item.id}">
                                <i class="fas fa-magic"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Atualizar o conteúdo
    containerResultados.innerHTML = html;
    
    // Adicionar eventos para os botões de visualizar
    document.querySelectorAll('.btn-visualizar-item').forEach(botao => {
        botao.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const item = diagnostico.items.find(i => i.id === index);
            
            if (item && item.textoOriginal) {
                // Usar a função do sistema para visualizar o calendário, se existir
                if (typeof inicializarModalCalendarioAprazamento === 'function') {
                    inicializarModalCalendarioAprazamento(item.textoOriginal, `Calendário: ${item.medicamento}`);
                } else {
                    alert(`Aprazamento: ${item.textoOriginal}`);
                }
            }
        });
    });
    
    // Adicionar eventos para os botões de corrigir
    document.querySelectorAll('.btn-corrigir-item').forEach(botao => {
        botao.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const item = diagnostico.items.find(i => i.id === index);
            
            if (item) {
                corrigirAprazamentoItem(item);
            }
        });
    });
}

// Função para tentar corrigir um item específico
function corrigirAprazamentoItem(item) {
    if (!item || !item.textoOriginal) return;
    
    console.log(`Tentando corrigir aprazamento: ${item.textoOriginal}`);
    
    // Usar a função de correção de aprazamento, se existir
    let textoCorrigido;
    
    if (typeof corrigirAprazamentoInvalido === 'function') {
        textoCorrigido = corrigirAprazamentoInvalido(item.textoOriginal);
    } else {
        // Implementação simplificada se a função não estiver disponível
        textoCorrigido = item.textoOriginal.trim();
        
        // Verificar se é apenas horários no formato HH:MM
        if (/^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$/.test(textoCorrigido)) {
            const hoje = new Date();
            const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
            textoCorrigido = `${dataAtual}: ${textoCorrigido}`;
        }
    }
    
    if (textoCorrigido === item.textoOriginal) {
        alert(`Não foi possível corrigir o formato automaticamente.`);
        return;
    }
    
    // Confirmar a correção com o usuário
    if (confirm(`Deseja corrigir o aprazamento de:\n\n"${item.textoOriginal}"\n\npara:\n\n"${textoCorrigido}"?`)) {
        // Atualizar o atributo data-aprazamento do botão
        if (item.botaoElemento) {
            item.botaoElemento.setAttribute('data-aprazamento', textoCorrigido);
            console.log(`Aprazamento corrigido para: ${textoCorrigido}`);
            
            // Reexecutar o diagnóstico para atualizar a interface
            executarDiagnosticoAprazamento();
        }
    }
}

// Função para tentar corrigir todos os aprazamentos com problemas
function corrigirTodosAprazamentos() {
    const diagnostico = buscarAprazamentosNaPagina();
    let corrigidos = 0;
    
    // Filtrar apenas itens com problemas
    const itensProblematicos = diagnostico.items.filter(item => item.problemas.length > 0);
    
    if (itensProblematicos.length === 0) {
        alert('Não há aprazamentos com problemas para corrigir.');
        return;
    }
    
    // Confirmar a operação
    if (!confirm(`Deseja tentar corrigir automaticamente ${itensProblematicos.length} aprazamentos com problemas?`)) {
        return;
    }
    
    // Tentar corrigir cada item
    itensProblematicos.forEach(item => {
        if (!item.textoOriginal) return;
        
        let textoCorrigido;
        
        if (typeof corrigirAprazamentoInvalido === 'function') {
            textoCorrigido = corrigirAprazamentoInvalido(item.textoOriginal);
        } else {
            // Implementação simplificada
            textoCorrigido = item.textoOriginal.trim();
            
            // Verificar se é apenas horários no formato HH:MM
            if (/^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$/.test(textoCorrigido)) {
                const hoje = new Date();
                const dataAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
                textoCorrigido = `${dataAtual}: ${textoCorrigido}`;
            }
        }
        
        // Se houve mudança, aplicar a correção
        if (textoCorrigido !== item.textoOriginal) {
            item.botaoElemento.setAttribute('data-aprazamento', textoCorrigido);
            corrigidos++;
        }
    });
    
    // Mostrar resultado e reexecutar o diagnóstico
    alert(`${corrigidos} de ${itensProblematicos.length} aprazamentos foram corrigidos.`);
    executarDiagnosticoAprazamento();
}

// Adicionar o botão de diagnóstico quando a página carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um tempo para garantir que todos os elementos foram carregados
    setTimeout(adicionarBotaoDiagnosticoAprazamento, 1000);
});

// ... Resto do código ... 