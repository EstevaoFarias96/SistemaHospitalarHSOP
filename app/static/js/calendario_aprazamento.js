/**
 * Adiciona estilos CSS para o calendário de aprazamento
 */

// Definir dias da semana para uso em múltiplas funções
const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function adicionarEstilosCalendarioAprazamento() {
    // Verificar se os estilos já foram adicionados
    if (document.getElementById('estilos-calendario-aprazamento')) return;
    
    // Criar o elemento de estilo
    const estilos = document.createElement('style');
    estilos.id = 'estilos-calendario-aprazamento';
    estilos.innerHTML = `
        .calendario-container {
            padding: 10px 0;
            border-radius: 8px;
            background-color: #f8f9fa;
        }
        
        .dia-aprazamento {
            padding: 10px 15px;
            border-left: 4px solid #0d6efd;
            margin-bottom: 12px !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border-radius: 0 8px 8px 0;
            background-color: white;
            transition: all 0.2s ease;
        }
        
        .dia-aprazamento:hover {
            transform: translateX(2px);
            border-left-width: 6px;
        }
        
        .data-aprazamento {
            color: #0d6efd;
            font-size: 1.1rem;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
        }
        
        .data-aprazamento::before {
            content: "\\f133";
            font-family: "Bootstrap-icons";
            margin-right: 8px;
            font-size: 0.9rem;
        }
        
        .horarios-aprazamento {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .horario {
            background-color: #e7f1ff;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            color: #0d6efd;
            display: inline-flex;
            align-items: center;
        }
        
        .horario::before {
            content: "\\f550";
            font-family: "Bootstrap-icons";
            margin-right: 5px;
            font-size: 0.8rem;
        }
        
        .erro-aprazamento {
            padding: 15px;
            border-radius: 8px;
            background-color: #fff0f0;
            border-left: 4px solid #dc3545;
        }
        
        .texto-aprazamento {
            font-style: italic;
            color: #495057;
        }
    `;
    
    // Adicionar ao head
    document.head.appendChild(estilos);
}

/**
 * Visualiza o calendário de aprazamento em um container especificado
 * @param {string|Element} input - Texto de aprazamento ou elemento input
 * @param {string} containerId - ID do container onde o calendário será exibido
 */
function visualizarCalendarioAprazamento(input, containerId = 'calendario-aprazamento-container', aprazamentosRealizados = []) {
    try {
        // Verificar tipo de entrada
        let textoAprazamento;
        
        if (typeof input === 'string') {
            // Input é um texto direto
            textoAprazamento = input;
        } else if (input instanceof Element || input instanceof HTMLElement) {
            // Input é um elemento HTML
            textoAprazamento = input.value || input.innerHTML || '';
        } else if (input && typeof input === 'object' && input.jquery) {
            // Input é um objeto jQuery
            textoAprazamento = input.val() || input.html() || '';
        } else {
            console.error('Erro: Tipo de input inválido para visualização do calendário', input);
            return false;
        }
        
        // Verificar se o texto de aprazamento é válido
        if (!textoAprazamento || typeof textoAprazamento !== 'string') {
            console.error('Erro: Texto de aprazamento inválido');
            const containerElement = document.getElementById(containerId);
            if (containerElement) {
                containerElement.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> Formato de aprazamento inválido
                    </div>`;
            }
            return false;
        }
        
        // Corrigir o formato do aprazamento se necessário
        textoAprazamento = corrigirAprazamentoInvalido(textoAprazamento);
        
        // Verificar se o container existe
        const containerElement = document.getElementById(containerId);
        if (!containerElement) {
            console.error(`Erro: Container #${containerId} não encontrado`);
            return false;
        }
        
        // Gerar e exibir o calendário
        const calendarioHTML = gerarCalendarioHTML(textoAprazamento, aprazamentosRealizados);
        containerElement.innerHTML = calendarioHTML;
        
        return true;
    } catch (error) {
        console.error('Erro ao visualizar calendário de aprazamento:', error);
        
        const containerElement = document.getElementById(containerId);
        if (containerElement) {
            containerElement.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> Erro ao gerar calendário: ${error.message}
                </div>`;
        }
        
        return false;
    }
}

/**
 * Formata a data no formato DD/MM/YYYY para um formato mais legível
 * @param {string} data - Data no formato DD/MM/YYYY
 * @returns {string} Data formatada
 */
function formatarData(data) {
    if (!data || typeof data !== 'string' || !data.includes('/')) {
        return data;
    }
    
    const [dia, mes, ano] = data.split('/');
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const nomeMes = meses[parseInt(mes, 10) - 1] || mes;
    const diaSemana = obterDiaSemana(new Date(ano, mes - 1, dia));
    
    return `${dia} de ${nomeMes} (${diaSemana})`;
}

/**
 * Retorna o nome do dia da semana para uma data
 * @param {Date} data - Objeto Date
 * @returns {string} Nome do dia da semana
 */
function obterDiaSemana(data) {
    return diasSemana[data.getDay()];
}

/**
 * Exporta o calendário como uma imagem PNG
 * @param {string} containerId - ID do container do calendário
 */
function exportarCalendarioComoImagem(containerId = 'calendario-aprazamento-container') {
    try {
        const containerCalendario = document.getElementById(containerId);
        
        if (!containerCalendario) {
            console.error('Container do calendário não encontrado:', containerId);
            alertaErro('Não foi possível exportar o calendário. Container não encontrado.');
            return;
        }
        
        // Verificar se o calendário está vazio
        if (!containerCalendario.innerHTML.trim()) {
            alertaErro('Não há conteúdo no calendário para exportar. Verifique se o calendário foi gerado corretamente.');
            return;
        }
        
        // Usar html2canvas para gerar a imagem (verifica se a biblioteca está disponível)
        if (typeof html2canvas === 'undefined') {
            // Carregar dinamicamente a biblioteca html2canvas se não estiver disponível
            console.log('html2canvas não encontrado, carregando biblioteca...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = function() {
                console.log('html2canvas carregado com sucesso');
                // Quando a biblioteca for carregada, continuar com a exportação
                gerarImagemCalendario(containerCalendario);
            };
            script.onerror = function(err) {
                console.error('Erro ao carregar html2canvas:', err);
                alertaErro('Não foi possível carregar a biblioteca necessária para exportação.');
            };
            document.head.appendChild(script);
        } else {
            // A biblioteca já está disponível, continuar com a exportação
            console.log('html2canvas já está disponível, gerando imagem...');
            gerarImagemCalendario(containerCalendario);
        }
    } catch (error) {
        console.error('Erro ao exportar calendário como imagem:', error);
        alertaErro('Ocorreu um erro ao exportar o calendário: ' + error.message);
    }
}

/**
 * Gera a imagem do calendário usando html2canvas
 * @param {HTMLElement} container - Container do calendário
 */
function gerarImagemCalendario(container) {
    // Configurações para captura com melhor qualidade
    const options = {
        scale: 2, // Aumenta a escala para melhor qualidade
        backgroundColor: '#ffffff', // Fundo branco
        logging: false, // Desativa logs
        useCORS: true // Permite imagens de outros domínios
    };
    
    // Mostrar indicador de carregamento
    const loadingEl = document.createElement('div');
    loadingEl.className = 'alert alert-info text-center';
    loadingEl.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Gerando imagem do calendário...';
    container.parentNode.insertBefore(loadingEl, container.nextSibling);
    
    // Converter o elemento para canvas
    html2canvas(container, options).then(canvas => {
        // Converter canvas para URL de dados
        const imgData = canvas.toDataURL('image/png');
        
        // Criar link para download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'calendario_aprazamento.png';
        link.click();
        
        // Remover indicador de carregamento
        loadingEl.remove();
        
        // Mostrar alerta de sucesso
        const alertaSuccesso = document.createElement('div');
        alertaSuccesso.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertaSuccesso.innerHTML = `
            <i class="bi bi-check-circle me-2"></i> Calendário exportado com sucesso!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        container.parentNode.insertBefore(alertaSuccesso, container.nextSibling);
        
        // Remover alerta após 3 segundos
        setTimeout(() => {
            if (alertaSuccesso.parentNode) {
                alertaSuccesso.remove();
            }
        }, 3000);
    }).catch(error => {
        // Remover indicador de carregamento
        loadingEl.remove();
        
        console.error('Erro ao gerar imagem do calendário:', error);
        alertaErro('Não foi possível gerar a imagem do calendário: ' + error.message);
    });
}

/**
 * Mostra um alerta de erro
 * @param {string} mensagem - Mensagem de erro
 */
function alertaErro(mensagem) {
    const alertaEl = document.createElement('div');
    alertaEl.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertaEl.innerHTML = `
        <i class="bi bi-exclamation-circle me-2"></i> ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Adicionar ao body ou a um container específico
    const container = document.getElementById('calendario-aprazamento-container') || document.body;
    container.parentNode.insertBefore(alertaEl, container.nextSibling);
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        if (alertaEl.parentNode) {
            alertaEl.remove();
        }
    }, 5000);
}

/**
 * Corrige formatos inválidos de aprazamento, especialmente o problema de 'undefined/undefined/'
 * @param {string} textoAprazamento - Texto original do aprazamento que pode conter erros
 * @returns {string} - Texto corrigido
 */
function corrigirAprazamentoInvalido(textoAprazamento) {
    // Verificar se o texto é válido
    if (!textoAprazamento) return '';
    
    // Converter para string se não for
    let texto = String(textoAprazamento).trim();
    
    console.log('Corrigindo aprazamento:', texto);
    
    // Remover 'undefined/undefined/' que pode aparecer no início das datas
    texto = texto.replace(/undefined\/undefined\//g, '');
    
    // Remover qualquer outro 'undefined' restante
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
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
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
    
    const resultado = secoesCorrigidas.join('; ');
    console.log('Aprazamento corrigido:', resultado);
    return resultado;
}

/**
 * Inicializa o modal para exibição do calendário de aprazamento
 * @param {string} aprazamentoTexto - Texto de aprazamento a ser exibido
 * @param {string} tituloModal - Título personalizado para o modal (opcional)
 */
function inicializarModalCalendarioAprazamento(aprazamentoTexto, tituloModal = 'Calendário de Aprazamento') {
    // Verificar se já existe o modal
    let modalElement = document.getElementById('modal-calendario-aprazamento');
    
    // Se não existir, criar novo modal
    if (!modalElement) {
        // Criar o elemento modal
        modalElement = document.createElement('div');
        modalElement.id = 'modal-calendario-aprazamento';
        modalElement.className = 'modal fade';
        modalElement.setAttribute('tabindex', '-1');
        modalElement.setAttribute('role', 'dialog');
        modalElement.setAttribute('aria-labelledby', 'calendario-titulo');
        modalElement.setAttribute('aria-hidden', 'true');
        
        // Estrutura do modal
        modalElement.innerHTML = `
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="calendario-titulo">${tituloModal}</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Fechar">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body p-0">
                        <div id="modal-calendario-container" class="p-3"></div>
                    </div>
                    <div class="modal-footer bg-light">
                        <button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal">Fechar</button>
                        <button type="button" class="btn btn-sm btn-primary" id="btn-exportar-calendario">
                            <i class="fas fa-download"></i> Exportar Imagem
                        </button>
                        <button type="button" class="btn btn-sm btn-info" id="btn-alternar-visualizacao">
                            <i class="fas fa-exchange-alt"></i> Alternar Visualização
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar ao body
        document.body.appendChild(modalElement);
        
        // Configurar botão de exportar imagem
        document.getElementById('btn-exportar-calendario').addEventListener('click', function() {
            exportarCalendarioComoImagem('modal-calendario-container');
        });
        
        // Configurar botão para alternar entre visualização completa e compacta
        let visualizacaoCompacta = false;
        document.getElementById('btn-alternar-visualizacao').addEventListener('click', function() {
            visualizacaoCompacta = !visualizacaoCompacta;
            
            const container = document.getElementById('modal-calendario-container');
            
            if (visualizacaoCompacta) {
                container.innerHTML = gerarCalendarioHTMLCompacto(aprazamentoTexto);
                this.innerHTML = '<i class="fas fa-table"></i> Visualização Completa';
            } else {
                container.innerHTML = gerarCalendarioHTML(aprazamentoTexto);
                this.innerHTML = '<i class="fas fa-list"></i> Visualização Compacta';
            }
        });
    } else {
        // Atualizar título do modal caso já exista
        document.getElementById('calendario-titulo').textContent = tituloModal;
    }
    
    // Adicionar estilos necessários
    adicionarEstilosCalendarioAprazamento();
    
    // Corrigir o texto de aprazamento para evitar problemas
    aprazamentoTexto = corrigirAprazamentoInvalido(aprazamentoTexto);
    
    // Gerar e exibir o calendário no modal
    const calendarioHTML = gerarCalendarioHTML(aprazamentoTexto);
    document.getElementById('modal-calendario-container').innerHTML = calendarioHTML;
    
    // Abrir o modal
    $('#modal-calendario-aprazamento').modal('show');
    
    // Quando o modal for fechado, podemos querer limpar recursos
    $('#modal-calendario-aprazamento').on('hidden.bs.modal', function () {
        // Opcional: limpar dados ou cancelar solicitações pendentes
    });
}

/**
 * Gera HTML para a tabela de aprazamentos do banco de dados
 * @param {Array} aprazamentos - Array de objetos de aprazamento do banco
 * @returns {string} HTML da tabela de aprazamentos
 */
function gerarTabelaAprazamentosDoBanco(aprazamentos) {
    try {
        if (!Array.isArray(aprazamentos) || aprazamentos.length === 0) {
            return `<div class="alert alert-warning">Nenhum aprazamento registrado.</div>`;
        }
        
        console.log("Dados recebidos para gerar tabela:", aprazamentos);
        
        // Agrupar por dia para melhor visualização
        const aprazamentosPorDia = {};
        const agora = new Date();
        
        // Processar cada aprazamento
        aprazamentos.forEach(apraz => {
            // Obter a data do aprazamento
            let dataObj;
            if (typeof apraz.data_hora_aprazamento === 'string') {
                // Pode estar em formato ISO ou DD/MM/YYYY HH:MM
                if (apraz.data_hora_aprazamento.includes('/')) {
                    // DD/MM/YYYY HH:MM
                    const [dataStr, horaStr] = apraz.data_hora_aprazamento.split(' ');
                    const [dia, mes, ano] = dataStr.split('/').map(num => parseInt(num, 10));
                    const [horas, minutos] = horaStr.split(':').map(num => parseInt(num, 10));
                    
                    dataObj = new Date(ano, mes - 1, dia, horas, minutos);
                } else {
                    // ISO
                    dataObj = new Date(apraz.data_hora_aprazamento);
                }
            } else {
                console.warn("Formato de data inválido:", apraz.data_hora_aprazamento);
                return;
            }
            
            // Verificar se a data é válida
            if (isNaN(dataObj.getTime())) {
                console.warn("Data inválida:", apraz.data_hora_aprazamento);
                return;
            }
            
            // Obter a data formatada para agrupar (DD/MM/YYYY)
            const dataFormatada = `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth() + 1).padStart(2, '0')}/${dataObj.getFullYear()}`;
            
            // Criar entrada para esta data se não existir
            if (!aprazamentosPorDia[dataFormatada]) {
                aprazamentosPorDia[dataFormatada] = [];
            }
            
            // Adicionar informações adicionais ao aprazamento
            const horaFormatada = `${String(dataObj.getHours()).padStart(2, '0')}:${String(dataObj.getMinutes()).padStart(2, '0')}`;
            
            // Determinar status
            let status, statusClass, statusIcon;
            if (apraz.realizado) {
                status = "Realizado";
                statusClass = "text-success";
                statusIcon = "fa-check-circle";
            } else if (dataObj < agora) {
                status = "Atrasado";
                statusClass = "text-danger";
                statusIcon = "fa-exclamation-circle";
            } else {
                status = "Pendente";
                statusClass = "text-warning";
                statusIcon = "fa-clock";
            }
            
            // Formatar data de realização
            let dataRealizacao = '';
            if (apraz.data_realizacao) {
                const dataRealizacaoObj = new Date(apraz.data_realizacao);
                if (!isNaN(dataRealizacaoObj.getTime())) {
                    dataRealizacao = dataRealizacaoObj.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
            
            // Adicionar ao grupo do dia
            aprazamentosPorDia[dataFormatada].push({
                ...apraz,
                dataObj,
                horaFormatada,
                status,
                statusClass,
                statusIcon,
                dataRealizacaoFormatada: dataRealizacao
            });
        });
        
        // Ordenar as datas
        const diasOrdenados = Object.keys(aprazamentosPorDia).sort((a, b) => {
            // Converter para objetos Date para comparação
            const [diaA, mesA, anoA] = a.split('/').map(Number);
            const [diaB, mesB, anoB] = b.split('/').map(Number);
            
            const dataA = new Date(anoA, mesA - 1, diaA);
            const dataB = new Date(anoB, mesB - 1, diaB);
            
            return dataA - dataB;
        });
        
        let htmlTabelaCompleta = '';
        
        // Gerar uma tabela para cada dia
        diasOrdenados.forEach(data => {
            const aprazamentosDoDia = aprazamentosPorDia[data];
            
            // Ordenar por hora
            aprazamentosDoDia.sort((a, b) => a.dataObj - b.dataObj);
            
            // Verificar se é hoje
            const hoje = new Date();
            const [dia, mes, ano] = data.split('/').map(Number);
            const dataComparar = new Date(ano, mes - 1, dia);
            
            const ehHoje = dataComparar.getDate() === hoje.getDate() && 
                          dataComparar.getMonth() === hoje.getMonth() && 
                          dataComparar.getFullYear() === hoje.getFullYear();
            
            // Determinar classe para o cabeçalho
            let headerClass = "bg-primary";
            if (ehHoje) {
                headerClass = "bg-success";
            } else if (dataComparar < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
                headerClass = "bg-secondary";
            }
            
            // Gerar a tabela para este dia
            htmlTabelaCompleta += `
                <div class="card mb-3">
                    <div class="card-header ${headerClass} text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <strong>${data} ${ehHoje ? '(Hoje)' : ''}</strong>
                            <span class="badge bg-light text-dark">${aprazamentosDoDia.length} horários</span>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Hora</th>
                                        <th>Medicamento</th>
                                        <th>Status</th>
                                        <th>Realizado em</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            // Adicionar cada aprazamento como uma linha na tabela
            aprazamentosDoDia.forEach(apraz => {
                htmlTabelaCompleta += `
                    <tr>
                        <td class="align-middle"><strong>${apraz.horaFormatada}</strong></td>
                        <td class="align-middle">${apraz.nome_medicamento || 'Não especificado'}</td>
                        <td class="align-middle ${apraz.statusClass}">
                            <i class="fas ${apraz.statusIcon} me-1"></i> ${apraz.status}
                        </td>
                        <td class="align-middle">${apraz.dataRealizacaoFormatada || '-'}</td>
                    </tr>
                `;
            });
            
            htmlTabelaCompleta += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return htmlTabelaCompleta;
    } catch (error) {
        console.error("Erro ao gerar tabela de aprazamentos:", error);
        return `<div class="alert alert-danger">Erro ao processar os aprazamentos: ${error.message}</div>`;
    }
}

/**
 * Atualiza o resumo do aprazamento com dados do banco
 * @param {Array} aprazamentos - Array de objetos Aprazamento
 */
function atualizarResumoAprazamentoBanco(aprazamentos) {
    try {
        const resumoElement = document.getElementById('resumo-aprazamento');
        if (!resumoElement || !Array.isArray(aprazamentos)) return;
        
        // Contar aprazamentos por status
        const totalAprazamentos = aprazamentos.length;
        const realizados = aprazamentos.filter(a => a.realizado).length;
        
        // Verificar aprazamentos atrasados (não realizados e já passaram da hora)
        const agora = new Date();
        const atrasados = aprazamentos.filter(a => {
            if (a.realizado) return false;
            
            // Converter string para objeto Date
            let dataAprazamento;
            if (typeof a.data_hora_aprazamento === 'string') {
                if (a.data_hora_aprazamento.includes('/')) {
                    // Formato DD/MM/YYYY HH:MM
                    const [dataStr, horaStr] = a.data_hora_aprazamento.split(' ');
                    const [dia, mes, ano] = dataStr.split('/').map(num => parseInt(num, 10));
                    const [horas, minutos] = horaStr.split(':').map(num => parseInt(num, 10));
                    
                    dataAprazamento = new Date(ano, mes - 1, dia, horas, minutos);
                } else {
                    // Formato ISO
                    dataAprazamento = new Date(a.data_hora_aprazamento);
                }
            } else {
                return false;
            }
            
            return dataAprazamento < agora;
        }).length;
        
        // Pendentes são os que não estão realizados e não estão atrasados
        const pendentes = totalAprazamentos - realizados - atrasados;
        
        resumoElement.innerHTML = `
            <div>Total: <strong>${totalAprazamentos}</strong> doses</div>
            <div class="mt-1">
                <span class="text-success">${realizados} realizadas</span> | 
                <span class="text-warning">${pendentes} pendentes</span> | 
                <span class="text-danger">${atrasados} atrasadas</span>
            </div>
        `;
    } catch (error) {
        console.error("Erro ao atualizar resumo com dados do banco:", error);
    }
}

/**
 * Função interna para visualizar o calendário
 * @param {string} textoAprazamento - Texto de aprazamento a ser visualizado
 * @param {Array} aprazamentosRealizados - Lista de aprazamentos realizados (opcional)
 */
function visualizarCalendario(textoAprazamento, aprazamentosRealizados = []) {
    try {
        // Verificar e corrigir formato inválido de aprazamento
        textoAprazamento = corrigirAprazamentoInvalido(textoAprazamento);
        
        // Gerar e exibir o calendário
        const calendarioHTML = gerarCalendarioHTML(textoAprazamento, aprazamentosRealizados);
        const container = document.getElementById('calendario-aprazamento-container');
        
        if (!container) {
            console.error("Container do calendário não encontrado");
            return;
        }
        
        // Configurar o container e exibir o calendário
        container.innerHTML = calendarioHTML;
        container.style.maxWidth = '100%';
        container.style.margin = '0 auto';
        container.style.padding = '8px';
        
        // Adicionar eventos após a renderização
        setTimeout(() => {
            // Adicionar tooltips ou comportamentos interativos se necessário
            const dosesPills = container.querySelectorAll('.dose-pill');
            dosesPills.forEach(pill => {
                pill.addEventListener('click', function() {
                    // Opcional: adicionar funcionalidade para marcar como realizado ao clicar
                    console.log('Clicou em dose:', this.textContent);
                });
            });
        }, 100);
    } catch (error) {
        console.error('Erro ao visualizar calendário:', error);
        document.getElementById('calendario-aprazamento-container').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> Erro ao processar o calendário: ${error.message}
            </div>
        `;
    }
}

// Exportar para o objeto window para estar disponível globalmente
window.inicializarModalCalendarioAprazamento = inicializarModalCalendarioAprazamento;

// Exportação para uso em outros módulos
// Usado quando o sistema é construído com webpack ou similar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        visualizarCalendarioAprazamento,
        adicionarEstilosCalendarioAprazamento,
        exportarCalendarioComoImagem,
        inicializarModalCalendarioAprazamento
    };
}

/**
 * Exibe os horários de aprazamento de forma organizada e prática
 * @param {string} textoAprazamento - Texto com horários de aprazamento
 * @param {string} idContainerDestino - ID do elemento onde os horários serão exibidos
 */
function exibirHorariosAprazamento(textoAprazamento, idContainerDestino) {
    // Verificar se o container existe
    const container = document.getElementById(idContainerDestino);
    if (!container) {
        console.error(`Container com ID ${idContainerDestino} não encontrado`);
        return;
    }
    
    // Adicionar estilos CSS
    adicionarEstilosCalendarioAprazamento();
    
    // Verificar se o texto está vazio
    if (!textoAprazamento || textoAprazamento.trim() === '') {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i> Nenhum horário de aprazamento definido.
            </div>
        `;
        return;
    }
    
    try {
        // Processar o texto de aprazamento
        // Formato esperado: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
        const secoes = textoAprazamento.split(';').filter(s => s.trim());
        
        // Se não houver seções válidas
        if (secoes.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i> Formato de aprazamento inválido.
                </div>
            `;
            return;
        }
        
        // Construir a tabela de horários
        let html = `
            <div class="table-responsive">
                <table class="table table-sm table-bordered table-hover">
                    <thead class="table-light">
                        <tr>
                            <th class="text-center" style="width: 30%">Data</th>
                            <th class="text-center">Horários</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Processar cada seção (dia)
        secoes.forEach(secao => {
            secao = secao.trim();
            
            // Verificar se a seção contém o separador de data e horários
            if (secao.includes(':')) {
                const [data, horariosTexto] = secao.split(':').map(s => s.trim());
                
                // Criar badges para os horários
                const horarios = horariosTexto.split(',').map(h => h.trim());
                const badgesHorarios = horarios.map(h => 
                    `<span class="badge bg-primary me-1 mb-1">${h}</span>`
                ).join('');
                
                html += `
                    <tr>
                        <td class="text-center align-middle fw-bold">${formatarDataSimples(data)}</td>
                        <td class="p-2">${badgesHorarios}</td>
                    </tr>
                `;
            }
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
                <button type="button" class="btn btn-sm btn-outline-primary" id="btn-copiar-aprazamento">
                    <i class="bi bi-clipboard me-1"></i> Copiar
                </button>
                <small class="text-muted">Total: ${contarDosesTextoAprazamento(textoAprazamento)} doses</small>
            </div>
        `;
        
        // Atualizar o conteúdo do container
        container.innerHTML = html;
        
        // Adicionar event listener para o botão de copiar
        const btnCopiar = document.getElementById('btn-copiar-aprazamento');
        if (btnCopiar) {
            btnCopiar.addEventListener('click', function() {
                navigator.clipboard.writeText(textoAprazamento)
                    .then(() => {
                        // Feedback visual temporário
                        const btnOriginal = btnCopiar.innerHTML;
                        btnCopiar.innerHTML = '<i class="bi bi-check me-1"></i> Copiado!';
                        btnCopiar.classList.replace('btn-outline-primary', 'btn-success');
                        
                        setTimeout(() => {
                            btnCopiar.innerHTML = btnOriginal;
                            btnCopiar.classList.replace('btn-success', 'btn-outline-primary');
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Erro ao copiar texto:', err);
                        alert('Não foi possível copiar o texto. Por favor, tente novamente.');
                    });
            });
        }
        
    } catch (error) {
        console.error('Erro ao exibir horários de aprazamento:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle me-2"></i> Erro ao processar horários de aprazamento: ${error.message}
            </div>
        `;
    }
}

/**
 * Formata uma data no formato DD/MM/YYYY para exibição simples
 * @param {string} data - Data no formato DD/MM/YYYY
 * @returns {string} - Data formatada
 */
function formatarDataSimples(data) {
    if (!data) return '';
    
    // Verificar se a data já está no formato DD/MM/YYYY
    const partes = data.split('/');
    if (partes.length === 3) {
        const [dia, mes, ano] = partes;
        
        // Converter mês para nome abreviado
        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesAbreviado = nomesMeses[parseInt(mes) - 1] || mes;
        
        return `${dia} ${mesAbreviado} ${ano}`;
    }
    
    return data;
}

/**
 * Conta o número total de doses em um texto de aprazamento
 * @param {string} textoAprazamento - Texto de aprazamento no formato DD/MM/YYYY HH:MM, HH:MM, HH:MM; DD/MM/YYYY HH:MM, ...
 * @returns {number} Número total de doses
 */
function contarDosesTextoAprazamento(textoAprazamento) {
    if (!textoAprazamento) return 0;
    
    try {
        let totalDoses = 0;
        
        // Dividir o texto por ponto e vírgula para ter os grupos de aprazamento
        const gruposAprazamento = textoAprazamento.split(';').map(item => item.trim()).filter(Boolean);
        
        // Para cada grupo, contar os horários separados por vírgula
        gruposAprazamento.forEach(grupo => {
            const grupo_trim = grupo.trim();
            if (!grupo_trim) return;
            
            // Remover a parte da data (se existir) para contar apenas os horários
            const partesGrupo = grupo_trim.split(' ');
            
            // Se a primeira parte for uma data (DD/MM/YYYY), o horário começa a partir do segundo elemento
            let inicio = 0;
            if (partesGrupo[0].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                inicio = 1;
            }
            
            // Juntar as partes restantes, que devem conter os horários
            const horariosTexto = partesGrupo.slice(inicio).join(' ');
            
            // Contar os horários separados por vírgula
            const horarios = horariosTexto.split(',').filter(h => h.trim());
            totalDoses += horarios.length;
        });
        
        return totalDoses;
    } catch (error) {
        console.error("Erro ao contar doses:", error);
        return 0;
    }
}

/**
 * Gera o HTML do calendário a partir do texto de aprazamento ou aprazamentos do banco
 * @param {string|null} textoAprazamento - Texto formatado de aprazamento ou null se usar dados do banco
 * @param {Array} listaAprazamentosRealizados - Lista de aprazamentos do banco de dados
 * @returns {string} HTML do calendário
 */
function gerarCalendarioHTML(textoAprazamento, listaAprazamentosRealizados = []) {
    console.log("Gerando calendário para texto:", textoAprazamento);
    console.log("Lista de aprazamentos do banco:", listaAprazamentosRealizados);
    
    try {
        // Verificar se estamos usando dados do banco ou texto de aprazamento
        const usarDadosBanco = !textoAprazamento && Array.isArray(listaAprazamentosRealizados) && listaAprazamentosRealizados.length > 0;
        
        if (usarDadosBanco) {
            console.log("Usando dados do banco de dados");
            return gerarCalendarioHTMLDoBanco(listaAprazamentosRealizados);
        }
        
        // Validar se a entrada é uma string quando não estamos usando dados do banco
        if (!textoAprazamento || typeof textoAprazamento !== 'string') {
            console.error("Erro: Formato de aprazamento inválido (não é uma string)");
            return `<div class="alert alert-danger">
                      <i class="fas fa-exclamation-triangle"></i> Formato de aprazamento inválido
                    </div>`;
        }
        
        // Se chegou aqui, estamos usando o formato de texto
        // Corrigir o formato do aprazamento para evitar problemas
        textoAprazamento = corrigirAprazamentoInvalido(textoAprazamento);
        
        // Resto do código existente para o formato de texto
        // ... existing code ...
    } catch (error) {
        console.error("Erro ao gerar calendário:", error);
        return `<div class="alert alert-danger">
                  <i class="fas fa-exclamation-triangle"></i> Erro ao gerar calendário: ${error.message}
                </div>`;
    }
}

/**
 * Gera o HTML do calendário a partir de aprazamentos do banco de dados
 * @param {Array} aprazamentos - Lista de objetos de aprazamento do banco
 * @returns {string} HTML do calendário
 */
function gerarCalendarioHTMLDoBanco(aprazamentos) {
    try {
        // Verificar se temos dados válidos
        if (!Array.isArray(aprazamentos) || aprazamentos.length === 0) {
            return `<div class="alert alert-warning">
                      <i class="fas fa-info-circle"></i> Nenhum aprazamento encontrado
                    </div>`;
        }
        
        // Agrupar aprazamentos por data
        const aprazamentosPorData = {};
        const agora = new Date();
        
        // Processar cada aprazamento e agrupá-los por data
        aprazamentos.forEach(apraz => {
            // Converter string de data para objeto Date
            let dataObj;
            if (typeof apraz.data_hora_aprazamento === 'string') {
                if (apraz.data_hora_aprazamento.includes('/')) {
                    // Formato DD/MM/YYYY HH:MM
                    const [dataStr, horaStr] = apraz.data_hora_aprazamento.split(' ');
                    const [dia, mes, ano] = dataStr.split('/').map(num => parseInt(num, 10));
                    const [horas, minutos] = horaStr.split(':').map(num => parseInt(num, 10));
                    dataObj = new Date(ano, mes - 1, dia, horas, minutos);
                } else {
                    // Formato ISO
                    dataObj = new Date(apraz.data_hora_aprazamento);
                }
            } else if (apraz.data_hora_aprazamento instanceof Date) {
                dataObj = apraz.data_hora_aprazamento;
            } else {
                console.warn("Formato de data inválido:", apraz.data_hora_aprazamento);
                return;
            }
            
            // Formatação da data como chave (YYYY-MM-DD)
            const dataChave = dataObj.toISOString().split('T')[0];
            
            // Inicializar o array para esta data se não existir
            if (!aprazamentosPorData[dataChave]) {
                aprazamentosPorData[dataChave] = [];
            }
            
            // Adicionar o aprazamento completo ao array, junto com informações adicionais
            aprazamentosPorData[dataChave].push({
                ...apraz,
                dataObj,
                hora: dataObj.getHours().toString().padStart(2, '0') + ':' + 
                      dataObj.getMinutes().toString().padStart(2, '0'),
                status: apraz.realizado ? 'realizado' : 
                        (dataObj < agora ? 'atrasado' : 'pendente')
            });
        });
        
        // Ordenar as datas
        const datasOrdenadas = Object.keys(aprazamentosPorData).sort();
        
        // Gerar legenda de cores
        const html = `
            <div class="calendario-aprazamento mb-4">
                <div class="legenda-container mb-3">
                    <div class="d-flex flex-wrap justify-content-center gap-3">
                        <div class="legenda-item">
                            <span class="badge bg-success text-white">■</span> Realizado
                        </div>
                        <div class="legenda-item">
                            <span class="badge bg-warning text-white">■</span> Pendente
                        </div>
                        <div class="legenda-item">
                            <span class="badge bg-danger text-white">■</span> Atrasado
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-bordered table-hover calendario-table">
                        <thead>
                            <tr class="bg-primary text-white">
                                <th class="text-center">Medicamento</th>
                                ${datasOrdenadas.map(data => {
                                    const dataObj = new Date(data);
                                    const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit'
                                    });
                                    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' });
                                    return `<th class="text-center">
                                                ${dataFormatada}<br>
                                                <small>${diaSemana}</small>
                                            </th>`;
                                }).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${gerarLinhasCalendarioBanco(aprazamentosPorData, datasOrdenadas)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return html;
    } catch (error) {
        console.error("Erro ao gerar calendário do banco:", error);
        return `<div class="alert alert-danger">
                  <i class="fas fa-exclamation-circle"></i> Erro ao gerar calendário: ${error.message}
                </div>`;
    }
}

/**
 * Gera as linhas da tabela do calendário a partir dos dados do banco
 * @param {Object} aprazamentosPorData - Objeto com aprazamentos agrupados por data
 * @param {Array} datasOrdenadas - Array com as datas ordenadas
 * @returns {string} HTML das linhas da tabela
 */
function gerarLinhasCalendarioBanco(aprazamentosPorData, datasOrdenadas) {
    // Agrupar por medicamento
    const medicamentos = {};
    
    // Para cada data, processar os aprazamentos e agrupar por medicamento
    datasOrdenadas.forEach(data => {
        const aprazamentos = aprazamentosPorData[data] || [];
        
        aprazamentos.forEach(apraz => {
            const nomeMedicamento = apraz.nome_medicamento || 'Não especificado';
            
            if (!medicamentos[nomeMedicamento]) {
                medicamentos[nomeMedicamento] = {
                    nome: nomeMedicamento,
                    descricao: apraz.descricao_uso || '',
                    aprazamentosPorData: {}
                };
            }
            
            if (!medicamentos[nomeMedicamento].aprazamentosPorData[data]) {
                medicamentos[nomeMedicamento].aprazamentosPorData[data] = [];
            }
            
            medicamentos[nomeMedicamento].aprazamentosPorData[data].push(apraz);
        });
    });
    
    // Gerar as linhas da tabela
    let html = '';
    Object.values(medicamentos).forEach(med => {
        html += `
            <tr>
                <td>
                    <strong>${med.nome}</strong>
                    ${med.descricao ? `<br><small class="text-muted">${med.descricao}</small>` : ''}
                </td>
                ${datasOrdenadas.map(data => {
                    const aprazamentos = med.aprazamentosPorData[data] || [];
                    let htmlCelula = '<td class="text-center">';
                    
                    if (aprazamentos.length === 0) {
                        htmlCelula += '-';
                    } else {
                        // Ordenar por hora
                        aprazamentos.sort((a, b) => a.dataObj - b.dataObj);
                        
                        // Gerar badges para cada horário
                        aprazamentos.forEach(apraz => {
                            let badgeClass;
                            let icon = '';
                            
                            switch (apraz.status) {
                                case 'realizado':
                                    badgeClass = 'bg-success text-white';
                                    icon = '<i class="fas fa-check me-1"></i>';
                                    break;
                                case 'atrasado':
                                    badgeClass = 'bg-danger text-white';
                                    icon = '<i class="fas fa-exclamation-triangle me-1"></i>';
                                    break;
                                default: // pendente
                                    badgeClass = 'bg-warning text-white';
                                    icon = '<i class="fas fa-clock me-1"></i>';
                                    break;
                            }
                            
                            htmlCelula += `
                                <span class="badge ${badgeClass} m-1" 
                                      data-bs-toggle="tooltip" 
                                      title="${apraz.status.toUpperCase()}: ${apraz.nome_medicamento}">
                                    ${icon}${apraz.hora}
                                </span>
                            `;
                        });
                    }
                    
                    htmlCelula += '</td>';
                    return htmlCelula;
                }).join('')}
            </tr>
        `;
    });
    
    return html;
}

/**
 * Gera HTML para o calendário em formato compacto
 * @param {string} textoAprazamento - Texto de aprazamento no formato padrão
 * @returns {string} HTML do calendário compacto
 */
function gerarCalendarioHTMLCompacto(textoAprazamento) {
    if (!textoAprazamento || typeof textoAprazamento !== 'string') {
        return '<div class="alert alert-warning p-1 small">Formato inválido</div>';
    }
    
    try {
        // Corrigir o formato do aprazamento para evitar problemas com undefined
        textoAprazamento = corrigirAprazamentoInvalido(textoAprazamento);
        
        // Separar o texto por datas (formato: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM")
        const secoes = textoAprazamento.split(';').map(s => s.trim()).filter(s => s);
        
        // Data e hora atual para comparação
        const agora = new Date();
        
        // Processar dados para exibição
        const diasProcessados = [];
        let totalDoses = 0;
        
        secoes.forEach(secao => {
            const partes = secao.split(':');
            if (partes.length < 2) return;
            
            const data = partes[0].trim();
            const horariosTexto = partes.slice(1).join(':').trim();
            
            // Validar data
            const dataMatch = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (!dataMatch) return;
            
            // Extrair componentes da data
            const [, dia, mes, ano] = dataMatch;
            const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            
            // Extrair horários
            const horarios = horariosTexto.split(',')
                .map(h => h.trim())
                .filter(h => h)
                .map(h => {
                    // Padronizar formato HH:MM
                    const partesHora = h.split(':');
                    if (partesHora.length === 2) {
                        return `${partesHora[0].padStart(2, '0')}:${partesHora[1].padStart(2, '0')}`;
                    }
                    return h;
                });
            
            // Verificar status de cada horário
            const horariosComStatus = horarios.map(horario => {
                // Verificar se o horário é válido
                if (horario.includes(':')) {
                    const [horas, minutos] = horario.split(':').map(Number);
                    const dataHorario = new Date(dataObj);
                    dataHorario.setHours(horas, minutos, 0);
                    
                    // Determinar status
                    let status = "pendente";
                    if (dataHorario < agora) {
                        status = "atrasado";
                    }
                    
                    return { horario, status };
                }
                return { horario, status: "pendente" };
            });
            
            // Incrementar contador de doses
            totalDoses += horarios.length;
            
            // Verificar se é hoje
            const hoje = new Date();
            const ehHoje = dataObj.getDate() === hoje.getDate() && 
                           dataObj.getMonth() === hoje.getMonth() && 
                           dataObj.getFullYear() === hoje.getFullYear();
            
            // Formatar data legível
            const options = { day: 'numeric', month: 'short' };
            const dataFormatada = dataObj.toLocaleDateString('pt-BR', options);
            const diaSemana = diasSemana[dataObj.getDay()];
            
            // Adicionar ao array de dias processados
            diasProcessados.push({
                data: data,
                dataFormatada: dataFormatada,
                diaSemana: diaSemana,
                ehHoje: ehHoje,
                horarios: horariosComStatus
            });
        });
        
        // Ordenar dias cronologicamente
        diasProcessados.sort((a, b) => {
            const [diaA, mesA, anoA] = a.data.split('/').map(Number);
            const [diaB, mesB, anoB] = b.data.split('/').map(Number);
            
            const dataA = new Date(anoA, mesA - 1, diaA);
            const dataB = new Date(anoB, mesB - 1, diaB);
            
            return dataA - dataB;
        });
        
        // Estilos CSS para o calendário compacto
        const estilos = `
            <style>
                .minicard-calendario {
                    font-family: 'Arial', sans-serif;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                    overflow: hidden;
                    margin-bottom: 10px;
                }
                
                .minicard-header {
                    padding: 8px 12px;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.9rem;
                }
                
                .minicard-header-hoje {
                    background-color: #e8f4ff;
                }
                
                .minicard-data {
                    font-weight: bold;
                    color: #4a5568;
                }
                
                .minicard-data i {
                    color: #4299e1;
                    margin-right: 4px;
                }
                
                .minicard-semana {
                    color: #718096;
                    font-size: 0.85em;
                }
                
                .minicard-content {
                    padding: 8px 12px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                
                .hora-pill {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    text-align: center;
                    white-space: nowrap;
                }
                
                .hora-realizado {
                    background-color: #d1fae5;
                    color: #047857;
                    border: 1px solid #a7f3d0;
                }
                
                .hora-pendente {
                    background-color: #fef3c7;
                    color: #92400e;
                    border: 1px solid #fde68a;
                }
                
                .hora-atrasado {
                    background-color: #fee2e2;
                    color: #b91c1c;
                    border: 1px solid #fecaca;
                }
                
                .mini-calendario-footer {
                    text-align: center;
                    padding: 8px;
                    background-color: #f8fafc;
                    border-top: 1px solid #f0f0f0;
                    font-size: 0.8rem;
                    color: #64748b;
                }
                
                .mini-calendario-legenda {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 6px;
                }
                
                .mini-legenda-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                }
                
                .mini-legenda-cor {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
            </style>
        `;
        
        // Começar a construir o HTML
        let html = estilos + '<div class="minicard-calendario">';
        
        // Cabeçalho do mini-calendário
        html += `<div class="mini-calendario-header"></div>`;
        
        // Conteúdo - dias com horários
        diasProcessados.forEach(dia => {
            const headerClass = dia.ehHoje ? 'minicard-header minicard-header-hoje' : 'minicard-header';
            const hojeIndicator = dia.ehHoje ? '<i class="fas fa-star"></i> ' : '';
            
            html += `
                <div class="${headerClass}">
                    <div class="minicard-data">${hojeIndicator}${dia.dataFormatada}</div>
                    <div class="minicard-semana">${dia.diaSemana}</div>
                </div>
                <div class="minicard-content">
            `;
            
            // Adicionar horários
            dia.horarios.forEach(item => {
                let pillClass = '';
                
                switch(item.status) {
                    case 'realizado':
                        pillClass = 'hora-realizado';
                        break;
                    case 'atrasado':
                        pillClass = 'hora-atrasado';
                        break;
                    case 'pendente':
                    default:
                        pillClass = 'hora-pendente';
                        break;
                }
                
                html += `<span class="hora-pill ${pillClass}">${item.horario}</span>`;
            });
            
            html += `</div>`;
        });
        
        // Rodapé com resumo e legenda
        html += `
            <div class="mini-calendario-footer">
                <div>Total: ${totalDoses} ${totalDoses === 1 ? 'dose' : 'doses'}</div>
                <div class="mini-calendario-legenda">
                    <div class="mini-legenda-item">
                        <div class="mini-legenda-cor" style="background-color: #047857;"></div>
                        <span>Realizado</span>
                    </div>
                    <div class="mini-legenda-item">
                        <div class="mini-legenda-cor" style="background-color: #92400e;"></div>
                        <span>Pendente</span>
                    </div>
                    <div class="mini-legenda-item">
                        <div class="mini-legenda-cor" style="background-color: #b91c1c;"></div>
                        <span>Atrasado</span>
                    </div>
                </div>
            </div>
        `;
        
        html += '</div>';
        
        return html;
    } catch (error) {
        console.error("Erro ao gerar calendário HTML compacto:", error);
        return `<div class="alert alert-danger p-1 small">Erro ao processar: ${error.message}</div>`;
    }
}

/**
 * Função para converter lista de aprazamentos para texto (mantida por compatibilidade)
 * @param {Array} listaAprazamentos - Lista de objetos { data_hora_aprazamento, realizado }
 * @returns {string} Texto formatado para o calendário
 */
function converterListaAprazamentosParaTexto(listaAprazamentos) {
    if (!Array.isArray(listaAprazamentos) || listaAprazamentos.length === 0) {
        return '';
    }

    const agrupadosPorData = {};

    listaAprazamentos.forEach(item => {
        if (!item.data_hora_aprazamento) return;

        const dataObj = new Date(item.data_hora_aprazamento);
        if (isNaN(dataObj)) return;

        const dataStr = `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth() + 1).padStart(2, '0')}/${dataObj.getFullYear()}`;
        const horaStr = `${String(dataObj.getHours()).padStart(2, '0')}:${String(dataObj.getMinutes()).padStart(2, '0')}`;

        if (!agrupadosPorData[dataStr]) {
            agrupadosPorData[dataStr] = [];
        }
        agrupadosPorData[dataStr].push(horaStr);
    });

    const textoFinal = Object.entries(agrupadosPorData)
        .map(([data, horas]) => `${data}: ${horas.join(', ')}`)
        .join('; ');

    return textoFinal;
}

/**
 * Registra aprazamentos para um medicamento usando o novo endpoint da API
 * @param {Object} dados - Dados para registro do aprazamento
 * @param {function} callback - Função de callback após o registro
 */
function registrarAprazamento(dados, callback) {
    // Informações para debug
    console.group('registrarAprazamento');
    console.log('Dados de entrada:', dados);
    
    if (!dados.prescricao_id || !dados.aprazamento) {
        console.error('Dados incompletos para registrar aprazamento');
        console.groupEnd();
        if (typeof callback === 'function') {
            callback({success: false, message: 'Dados incompletos para aprazamento'});
        }
        return;
    }

    // Processar o texto de aprazamento para extrair os horários
    const aprazamentos = processarTextoAprazamento(dados.aprazamento, dados.medicamento_nome, dados.descricao_uso);
    console.log('Aprazamentos processados:', aprazamentos);

    // Verificar se há aprazamentos válidos
    if (!aprazamentos || aprazamentos.length === 0) {
        console.error('Nenhum aprazamento válido extraído do texto');
        console.groupEnd();
        if (typeof callback === 'function') {
            callback({success: false, message: 'Formato de aprazamento inválido'});
        }
        return;
    }

    // Criar o objeto de dados a ser enviado para a API
    const dadosEnvio = {
        prescricao_id: parseInt(dados.prescricao_id, 10),
        aprazamentos: aprazamentos,
        sobrescrever: true
    };
    
    console.log('Dados de envio:', dadosEnvio);
    console.log('URL da requisição:', '/api/prescricoes/aprazamento');
    console.groupEnd();

    $.ajax({
        url: '/api/prescricoes/aprazamento',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dadosEnvio),
        success: function(response) {
            console.log('Resposta de sucesso:', response);
            if (typeof callback === 'function') {
                callback(response);
            }
            
            // Debug adicional se disponível
            if (typeof debugAprazamento === 'function') {
                debugAprazamento({
                    dados: dadosEnvio,
                    response: response
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao registrar aprazamento:', xhr.responseText);
            
            // Debug adicional se disponível
            if (typeof debugAprazamento === 'function') {
                debugAprazamento({
                    dados: dadosEnvio,
                    error: error,
                    xhr: xhr
                });
            }
            
            if (typeof callback === 'function') {
                callback({
                    success: false, 
                    message: 'Erro ao registrar aprazamento: ' + (xhr.responseJSON?.message || error)
                });
            }
        }
    });
}

/**
 * Processa o texto de aprazamento para extrair as datas e horários
 * @param {string} textoAprazamento - Texto no formato "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
 * @param {string} nomeMedicamento - Nome do medicamento
 * @param {string} descricaoUso - Descrição de uso do medicamento
 * @returns {Array} Array de objetos com data_hora_aprazamento formatados
 */
function processarTextoAprazamento(textoAprazamento, nomeMedicamento, descricaoUso) {
    console.group('processarTextoAprazamento');
    console.log('Texto de aprazamento:', textoAprazamento);
    console.log('Nome do medicamento:', nomeMedicamento);
    console.log('Descrição de uso:', descricaoUso);
    
    const aprazamentos = [];

    if (!textoAprazamento) {
        console.warn('Texto de aprazamento vazio ou null');
        console.groupEnd();
        return aprazamentos;
    }

    // Normalizar o texto de aprazamento (remover espaços extras, etc.)
    textoAprazamento = textoAprazamento.replace(/\s+/g, ' ').trim();
    console.log('Texto após normalização:', textoAprazamento);
    
    // Dividir o texto por dias (separados por ';')
    const diasAprazamentos = textoAprazamento.split(';').map(item => item.trim()).filter(Boolean);
    console.log('Dias de aprazamento:', diasAprazamentos);
    
    // Para cada dia de aprazamento
    for (const diaAprazamento of diasAprazamentos) {
        console.log('Processando dia:', diaAprazamento);
        
        // Verificar se contém o separador ':' entre data e horários
        if (!diaAprazamento.includes(':')) {
            console.warn(`Aviso: Item de aprazamento sem formato válido (não contém ':'): ${diaAprazamento}`);
            continue;
        }
        
        // Dividir entre data e horários (apenas na primeira ocorrência de ':')
        const indexDoisPontos = diaAprazamento.indexOf(':');
        const dataStr = diaAprazamento.substring(0, indexDoisPontos).trim();
        const horariosStr = diaAprazamento.substring(indexDoisPontos + 1).trim();
        
        console.log(`Data: "${dataStr}", Horários: "${horariosStr}"`);
        
        // Validar formato da data (DD/MM/YYYY)
        const dataMatch = dataStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!dataMatch) {
            console.warn(`Aviso: Formato de data inválido: ${dataStr}`);
            continue;
        }
        
        // Extrair componentes da data
        let [, dia, mes, ano] = dataMatch;
        
        // Normalizar dia e mês com zeros à esquerda
        dia = dia.padStart(2, '0');
        mes = mes.padStart(2, '0');
        
        console.log(`Data normalizada: ${dia}/${mes}/${ano}`);
        
        // Extrair horários (formato HH:MM)
        const horarios = horariosStr.split(',').map(h => h.trim()).filter(Boolean);
        console.log('Horários encontrados:', horarios);
        
        for (const horario of horarios) {
            // Validar formato do horário
            const horarioMatch = horario.match(/^(\d{1,2}):(\d{1,2})$/);
            if (!horarioMatch) {
                console.warn(`Aviso: Formato de horário inválido: ${horario}`);
                continue;
            }
            
            // Normalizar hora e minuto com zeros à esquerda
            let [, hora, minuto] = horarioMatch;
            hora = hora.padStart(2, '0');
            minuto = minuto.padStart(2, '0');
            
            // Criar data completa no formato "DD/MM/YYYY HH:MM"
            const dataHoraAprazamento = `${dia}/${mes}/${ano} ${hora}:${minuto}`;
            console.log(`Aprazamento formatado: ${dataHoraAprazamento}`);
            
            aprazamentos.push({
                data_hora_aprazamento: dataHoraAprazamento,
                nome_medicamento: nomeMedicamento || 'Sem nome',
                descricao_uso: descricaoUso || ''
            });
        }
    }
    
    console.log(`Total de aprazamentos processados: ${aprazamentos.length}`);
    console.log('Aprazamentos:', aprazamentos);
    console.groupEnd();
    
    return aprazamentos;
}

function atualizarResumoAprazamento(aprazamentos) {
    try {
        const resumoElement = document.getElementById('resumo-aprazamento');
        if (!resumoElement) return;
        
        // Verificar se é uma string (formato legado) ou array de objetos
        if (typeof aprazamentos === 'string') {
            // Processar texto de aprazamento no formato "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
            const secoes = aprazamentos.split(';').filter(s => s.trim());
            let totalHorarios = 0;
            
            // Contar horários em todas as seções
            secoes.forEach(secao => {
                const partes = secao.trim().split(':');
                if (partes.length < 2) return;
                
                const horarios = partes.slice(1).join(':').split(',').filter(h => h.trim());
                totalHorarios += horarios.length;
            });
            
            // Como é formato legado, não temos informação sobre status (realizado, pendente, atrasado)
            resumoElement.innerHTML = `
                <div>Total: <strong>${totalHorarios}</strong> doses</div>
                <div class="mt-1">
                    <span class="text-muted">Formato legado - status não disponível</span>
                </div>
            `;
            return;
        }
        
        // Processamento original para arrays
        if (!Array.isArray(aprazamentos)) return;
        
        // Contar aprazamentos por status
        const totalAprazamentos = aprazamentos.length;
        const realizados = aprazamentos.filter(a => a.realizado).length;
        
        // Verificar aprazamentos atrasados (não realizados e já passaram da hora)
        const agora = new Date();
        const atrasados = aprazamentos.filter(a => {
            if (a.realizado) return false;
            
            // Converter string para objeto Date
            let dataAprazamento;
            if (typeof a.data_hora_aprazamento === 'string') {
                if (a.data_hora_aprazamento.includes('/')) {
                    // Formato DD/MM/YYYY HH:MM
                    const [dataStr, horaStr] = a.data_hora_aprazamento.split(' ');
                    const [dia, mes, ano] = dataStr.split('/').map(num => parseInt(num, 10));
                    const [horas, minutos] = horaStr.split(':').map(num => parseInt(num, 10));
                    
                    dataAprazamento = new Date(ano, mes - 1, dia, horas, minutos);
                } else {
                    // Formato ISO
                    dataAprazamento = new Date(a.data_hora_aprazamento);
                }
            } else {
                return false;
            }
            
            return dataAprazamento < agora;
        }).length;
        
        // Pendentes são os que não estão realizados e não estão atrasados
        const pendentes = totalAprazamentos - realizados - atrasados;
        
        resumoElement.innerHTML = `
            <div>Total: <strong>${totalAprazamentos}</strong> doses</div>
            <div class="mt-1">
                <span class="text-success">${realizados} realizadas</span> | 
                <span class="text-warning">${pendentes} pendentes</span> | 
                <span class="text-danger">${atrasados} atrasadas</span>
            </div>
        `;
    } catch (error) {
        console.error("Erro ao atualizar resumo do aprazamento:", error);
    }
}

/**
 * Carrega os aprazamentos do banco de dados e exibe no calendário
 * @param {number} prescricaoId - ID da prescrição para buscar aprazamentos
 * @param {string} containerId - ID do container onde o calendário será exibido
 */
function carregarAprazamentosDoBanco(prescricaoId, containerId = null) {
    console.group('carregarAprazamentosDoBanco');
    console.log(`Carregando aprazamentos para prescrição ID: ${prescricaoId}`);

    // Definir containerId automaticamente se não for passado
    if (!containerId) {
        containerId = `calendario-aprazamento-container-${prescricaoId}`;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container não encontrado: #${containerId}`);
        console.groupEnd();
        return;
    }

    container.innerHTML = `
        <div class="alert alert-info text-center">
            <i class="fas fa-circle-notch fa-spin me-2"></i> Carregando aprazamentos...
        </div>
    `;

    $.ajax({
        url: `/api/aprazamentos/prescricao/${prescricaoId}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            console.log('Resposta do servidor:', response);

            if (!response.success) {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i> 
                        Não foi possível carregar os aprazamentos: ${response.message || 'Dados inválidos'}
                    </div>
                `;
                console.warn('Resposta inválida ou erro reportado:', response);
                console.groupEnd();
                return;
            }

            if (!response.aprazamentos || !Array.isArray(response.aprazamentos)) {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i> 
                        Formato de resposta inválido
                    </div>
                `;
                console.warn('Formato de resposta inválido:', response);
                console.groupEnd();
                return;
            }

            const aprazamentos = response.aprazamentos;
            console.log(`Total de aprazamentos encontrados: ${aprazamentos.length}`);

            if (aprazamentos.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-info-circle me-2"></i> 
                        Nenhum aprazamento registrado para esta prescrição.
                    </div>
                `;
                console.warn('Nenhum aprazamento encontrado');
                console.groupEnd();
                return;
            }

            // Exibir como tabela
            const tabelaHTML = gerarTabelaAprazamentosDoBanco(aprazamentos);
            container.innerHTML = tabelaHTML;

            // Adicionar resumo
            atualizarResumoAprazamento(aprazamentos);

            // Ativar tooltips se existir
            if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                const tooltips = container.querySelectorAll('[data-bs-toggle="tooltip"]');
                tooltips.forEach(el => new bootstrap.Tooltip(el));
            }

            console.log('Aprazamentos carregados com sucesso');
            console.groupEnd();
        },
        error: function(xhr, status, error) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Erro ao carregar aprazamentos: ${xhr.responseJSON?.message || error}
                </div>
            `;
            console.error('Erro na requisição AJAX:', xhr.responseText);
            console.groupEnd();
        }
    });
}

$(document).on('click', '.btn-ver-aprazamento', function() {
    var prescricaoId = $(this).data('prescricao-id');

    $('#modalVisualizarAprazamentoLabel').text('Aprazamentos da Prescrição ' + prescricaoId);
    $('#aprazamento-container-dinamico').html('<div class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Carregando aprazamentos...</div>');

    $('#modalVisualizarAprazamento').modal('show');

    var containerId = 'aprazamentos_modal_container_' + prescricaoId;
    $('#aprazamento-container-dinamico').html('<div id="' + containerId + '"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>');

    carregarAprazamentosDoBanco(prescricaoId, containerId);
});

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
            console.log('Horários recebidos:', response);

            if (response.success && response.horarios && response.horarios.length > 0) {
                let html = '<div class="table-responsive">';
                html += '<table class="table table-striped">';
                html += '<thead><tr>';
                html += '<th>Data/Hora</th>';
                html += '<th>Status</th>';
                html += '<th>Enfermeiro</th>';
                html += '</tr></thead>';
                html += '<tbody>';
                
                response.horarios.forEach(horario => {
                    let statusClass = horario.status === 'Realizado' ? 'bg-success' : 'bg-warning';
                    html += '<tr>';
                    html += `<td>${horario.horario}</td>`;
                    html += `<td><span class="badge ${statusClass}">${horario.status}</span></td>`;
                    html += `<td>${horario.enfermeiro || '-'}</td>`;
                    html += '</tr>';
                });
                
                html += '</tbody></table></div>';
                $('#modalVisualizarAprazamentoBody').html(html);
            } else {
                $('#modalVisualizarAprazamentoBody').html('<p class="text-muted text-center">Nenhum horário encontrado.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar horários:', xhr.responseText);
            $('#modalVisualizarAprazamentoBody').html('<p class="text-danger text-center">Erro ao carregar horários.</p>');
        }
    });
}

// Adicionar listener para os botões de visualização de aprazamento
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

function visualizarCalendarioAprazamento(prescricaoId, medicamentoIndex, medicamentoNome) {
    // Exibir carregamento enquanto busca dados
    $('#modalVisualizarAprazamentoBody').html('<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando horários...</p>');

    // Buscar os horários via AJAX
    $.ajax({
        url: `/api/prescricoes/aprazamento/${prescricaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.aprazamentos) {
                const aprazamentos = response.aprazamentos;
                
                // Agrupar aprazamentos por data
                const aprazamentosPorData = {};
                aprazamentos.forEach(apr => {
                    const dataHora = new Date(apr.data_hora_aprazamento);
                    const dataKey = dataHora.toLocaleDateString('pt-BR');
                    
                    if (!aprazamentosPorData[dataKey]) {
                        aprazamentosPorData[dataKey] = [];
                    }
                    aprazamentosPorData[dataKey].push({
                        ...apr,
                        hora: dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    });
                });

                renderizarCalendarioAprazamento(aprazamentosPorData, prescricaoId, medicamentoIndex, medicamentoNome);
            } else {
                $('#modalVisualizarAprazamentoBody').html('<p class="text-muted text-center">Nenhum horário encontrado.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar horários:', xhr.responseText);
            $('#modalVisualizarAprazamentoBody').html('<p class="text-danger text-center">Erro ao carregar horários.</p>');
        }
    });
}

function renderizarCalendarioAprazamento(aprazamentosPorData, prescricaoId, medicamentoIndex, medicamentoNome) {
    let html = '';
    
    // Para cada data
    Object.keys(aprazamentosPorData).sort().forEach(data => {
        html += `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0">Data: ${data}</h6>
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
            const statusClass = apr.realizado ? 'text-success' : 'text-warning';
            const statusIcon = apr.realizado ? 'fa-check-circle' : 'fa-clock';
            const statusText = apr.realizado ? 'Realizado' : 'Pendente';

            html += `
                <tr>
                    <td class="align-middle">${apr.hora}</td>
                    <td class="align-middle ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </td>
                    <td class="align-middle">${apr.enfermeiro_responsavel || '-'}</td>
                    <td class="align-middle">
            `;

            if (!apr.realizado) {
                html += `
                    <button class="btn btn-sm btn-success btn-realizar-aprazamento" 
                            data-id="${apr.id}"
                            data-prescricao-id="${prescricaoId}"
                            data-medicamento-index="${medicamentoIndex}">
                        <i class="fas fa-check"></i> Realizar
                    </button>
                `;
            } else {
                html += `
                    <span class="badge bg-success">
                        <i class="fas fa-check"></i> Realizado em ${new Date(apr.data_realizacao).toLocaleString('pt-BR')}
                    </span>
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
    const totalAprazamentos = Object.values(aprazamentosPorData).flat().length;
    const realizados = Object.values(aprazamentosPorData)
        .flat()
        .filter(a => a.realizado).length;
    const pendentes = totalAprazamentos - realizados;

    html += `
        <div class="card">
            <div class="card-body">
                <h6 class="card-title">Resumo do Aprazamento</h6>
                <div class="row text-center">
                    <div class="col-4">
                        <div class="p-3 border rounded bg-light">
                            <div class="small text-muted">Total</div>
                            <div class="h4 mb-0">${totalAprazamentos}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-3 border rounded bg-success bg-opacity-10">
                            <div class="small text-success">Realizados</div>
                            <div class="h4 mb-0">${realizados}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-3 border rounded bg-warning bg-opacity-10">
                            <div class="small text-warning">Pendentes</div>
                            <div class="h4 mb-0">${pendentes}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#modalVisualizarAprazamentoBody').html(html);
    configurarEventosCalendario(prescricaoId, medicamentoIndex, medicamentoNome);
}

function configurarEventosCalendario(prescricaoId, medicamentoIndex, medicamentoNome) {
    // Handler para o botão de realizar aprazamento
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
                        // Recarregar o calendário
                        visualizarCalendarioAprazamento(prescricaoId, medicamentoIndex, medicamentoNome);
                        // Atualizar a visualização da prescrição
                        if (typeof carregarPrescricoes === 'function') {
                            carregarPrescricoes();
                        }
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
}

// Exportar funções necessárias
window.visualizarCalendarioAprazamento = visualizarCalendarioAprazamento;
