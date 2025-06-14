// Função para resolver o problema de visualização de aprazamentos
$(document).ready(function() {
    console.log("Inicializando fix_aprazamento.js");
    
    // Sinalizar que o script foi carregado
    window.aprazamentoFixLoaded = true;
    
    // Função para adicionar diagnóstico ao modal
    function adicionarDiagnostico(modal, mensagem, tipo = "info") {
        console.log(`[Diagnóstico] ${mensagem}`);
        
        // Criar container para diagnóstico se não existir
        let diagContainer = modal.find("#diagnostico-container");
        if (diagContainer.length === 0) {
            const html = `
                <div id="diagnostico-container" class="mt-3">
                    <div class="alert alert-secondary small">
                        <h6 class="fw-bold"><i class="fas fa-bug me-2"></i> Informações de Diagnóstico</h6>
                        <div id="diagnostico-conteudo"></div>
                    </div>
                </div>
            `;
            modal.find(".modal-body").append(html);
            diagContainer = modal.find("#diagnostico-container");
        }
        
        const conteudoDiv = diagContainer.find("#diagnostico-conteudo");
        
        let alertClass = "alert-info";
        if (tipo === "warning") alertClass = "alert-warning";
        if (tipo === "error") alertClass = "alert-danger";
        
        conteudoDiv.append(`
            <div class="alert ${alertClass} mb-2 py-1 px-2">
                ${mensagem}
            </div>
        `);
        
        diagContainer.show();
    }
    
    // Verificar resposta da API
    function verificarRespostaAPI(response, modal) {
        try {
            adicionarDiagnostico(modal, `Recebida resposta da API. Status success: ${response.success}`);
            
            if (!response.success) {
                adicionarDiagnostico(modal, `Erro reportado pela API: ${response.message || "Sem mensagem"}`, "error");
                return false;
            }
            
            if (!response.aprazamentos || !Array.isArray(response.aprazamentos)) {
                adicionarDiagnostico(modal, `Formato de resposta inválido: propriedade 'aprazamentos' não é um array`, "error");
                return false;
            }
            
            if (response.aprazamentos.length === 0) {
                adicionarDiagnostico(modal, `Nenhum aprazamento encontrado para esta prescrição`, "warning");
                return false;
            }
            
            adicionarDiagnostico(modal, `Total de aprazamentos encontrados: ${response.aprazamentos.length}`);
            adicionarDiagnostico(modal, `Exemplo do primeiro aprazamento: ${JSON.stringify(response.aprazamentos[0])}`);
            
            return true;
        } catch (e) {
            adicionarDiagnostico(modal, `Erro ao verificar resposta: ${e.message}`, "error");
            return false;
        }
    }

    // Sobrescrever a função de visualização de aprazamentos
    $(document).on("click", ".btn-ver-aprazamento", function() {
        var prescricaoId = $(this).data("prescricao-id");
        
        console.log("Visualizando aprazamentos da prescrição:", prescricaoId);
        
        // Configurar o modal
        const modal = $("#modalVisualizarAprazamento");
        
        // Reiniciar diagnóstico
        modal.find("#diagnostico-container").remove();
        
        $("#modalVisualizarAprazamentoLabel").text("Aprazamentos da Prescrição " + prescricaoId);
        $("#aprazamento-container-dinamico").html(
            `<div class="text-center text-muted">
                <i class="fas fa-spinner fa-spin"></i> Carregando aprazamentos...
            </div>`
        );
        
        // Mostrar o modal
        $("#modalVisualizarAprazamento").modal("show");
        
        // Fazer a requisição para a API
        $.ajax({
            url: `/api/aprazamentos/prescricao/${prescricaoId}`,
            method: "GET",
            dataType: "json",
            success: function(response) {
                console.log("Resposta da API:", response);
                
                // Verificar resposta e adicionar diagnóstico
                if (!verificarRespostaAPI(response, modal)) {
                    return;
                }
                
                // Processar aprazamentos
                const aprazamentos = response.aprazamentos;
                
                // Agrupar por dia
                const aprazamentosPorDia = {};
                const agora = new Date();
                
                aprazamentos.forEach(apraz => {
                    if (!apraz.data_hora_aprazamento) {
                        adicionarDiagnostico(modal, `Aprazamento sem data: ${JSON.stringify(apraz)}`, "warning");
                        return;
                    }
                    
                    // Converter string para data
                    let dataObj;
                    try {
                        if (apraz.data_hora_aprazamento.includes("/")) {
                            const [dataStr, horaStr] = apraz.data_hora_aprazamento.split(" ");
                            const [dia, mes, ano] = dataStr.split("/").map(num => parseInt(num, 10));
                            const [horas, minutos] = horaStr.split(":").map(num => parseInt(num, 10));
                            dataObj = new Date(ano, mes - 1, dia, horas, minutos);
                        } else {
                            dataObj = new Date(apraz.data_hora_aprazamento);
                        }
                        
                        if (isNaN(dataObj.getTime())) {
                            adicionarDiagnostico(modal, `Data inválida: ${apraz.data_hora_aprazamento}`, "warning");
                            return;
                        }
                    } catch (e) {
                        adicionarDiagnostico(modal, `Erro ao converter data ${apraz.data_hora_aprazamento}: ${e.message}`, "error");
                        return;
                    }
                    
                    // Formatar data para agrupar
                    const dataFormatada = dataObj.toLocaleDateString("pt-BR");
                    
                    if (!aprazamentosPorDia[dataFormatada]) {
                        aprazamentosPorDia[dataFormatada] = [];
                    }
                    
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
                    
                    // Adicionar ao grupo
                    aprazamentosPorDia[dataFormatada].push({
                        ...apraz,
                        horaFormatada: dataObj.toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"}),
                        status,
                        statusClass,
                        statusIcon
                    });
                });
                
                const diasOrdenados = Object.keys(aprazamentosPorDia).sort((a, b) => {
                    const dataA = new Date(a.split("/").reverse().join("-"));
                    const dataB = new Date(b.split("/").reverse().join("-"));
                    return dataA - dataB;
                });
                
                // Adicionar diagnóstico sobre dias encontrados
                adicionarDiagnostico(modal, `Dias com aprazamentos: ${diasOrdenados.length} (${diasOrdenados.join(", ")})`);
                
                // Gerar HTML das tabelas
                let html = "";
                
                diasOrdenados.forEach(data => {
                    const aprazamentosDoDia = aprazamentosPorDia[data];
                    
                    // Ordenar por hora
                    aprazamentosDoDia.sort((a, b) => {
                        const [horaA, minA] = a.horaFormatada.split(":").map(n => parseInt(n, 10));
                        const [horaB, minB] = b.horaFormatada.split(":").map(n => parseInt(n, 10));
                        return (horaA * 60 + minA) - (horaB * 60 + minB);
                    });
                    
                    // Verificar se é hoje
                    const hoje = new Date().toLocaleDateString("pt-BR");
                    const ehHoje = data === hoje;
                    
                    // Classe do cabeçalho
                    let headerClass = "bg-primary";
                    if (ehHoje) {
                        headerClass = "bg-success";
                    } else if (new Date(data.split("/").reverse().join("-")) < new Date(hoje.split("/").reverse().join("-"))) {
                        headerClass = "bg-secondary";
                    }
                    
                    html += `
                        <div class="card mb-3">
                            <div class="card-header ${headerClass} text-white">
                                <div class="d-flex justify-content-between align-items-center">
                                    <strong>${data} ${ehHoje ? "(Hoje)" : ""}</strong>
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
                    
                    // Adicionar linhas
                    aprazamentosDoDia.forEach(apraz => {
                        html += `
                            <tr>
                                <td class="align-middle"><strong>${apraz.horaFormatada}</strong></td>
                                <td class="align-middle">${apraz.nome_medicamento || "Não especificado"}</td>
                                <td class="align-middle ${apraz.statusClass}">
                                    <i class="fas ${apraz.statusIcon} me-1"></i> ${apraz.status}
                                </td>
                                <td class="align-middle">${apraz.data_realizacao || "-"}</td>
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
                
                // Calcular contadores
                const totalAprazamentos = aprazamentos.length;
                const realizados = aprazamentos.filter(a => a.realizado).length;
                const atrasados = aprazamentos.filter(a => {
                    if (a.realizado) return false;
                    
                    let dataObj;
                    try {
                        if (a.data_hora_aprazamento.includes("/")) {
                            const [dataStr, horaStr] = a.data_hora_aprazamento.split(" ");
                            const [dia, mes, ano] = dataStr.split("/").map(num => parseInt(num, 10));
                            const [horas, minutos] = horaStr.split(":").map(num => parseInt(num, 10));
                            dataObj = new Date(ano, mes - 1, dia, horas, minutos);
                        } else {
                            dataObj = new Date(a.data_hora_aprazamento);
                        }
                        
                        return !isNaN(dataObj.getTime()) && dataObj < agora;
                    } catch (e) {
                        return false;
                    }
                }).length;
                const pendentes = totalAprazamentos - realizados - atrasados;
                
                // Adicionar resumo
                html += `
                    <div class="alert alert-info mt-3">
                        <h6 class="fw-bold"><i class="fas fa-info-circle me-2"></i> Resumo dos aprazamentos</h6>
                        <div class="d-flex justify-content-between">
                            <div>Total: <strong>${totalAprazamentos}</strong> doses</div>
                            <div>
                                <span class="badge bg-success me-1">${realizados} realizadas</span>
                                <span class="badge bg-warning me-1">${pendentes} pendentes</span>
                                <span class="badge bg-danger">${atrasados} atrasadas</span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Atualizar o container
                $("#aprazamento-container-dinamico").html(html);
                
                // Adicionar diagnóstico final
                adicionarDiagnostico(modal, "Renderização de aprazamentos concluída com sucesso");
            },
            error: function(xhr, status, error) {
                console.error("Erro na requisição:", error);
                adicionarDiagnostico(modal, `Erro na comunicação com o servidor: ${error}`, "error");
                adicionarDiagnostico(modal, `Status HTTP: ${xhr.status}`, "error");
                adicionarDiagnostico(modal, `Resposta: ${xhr.responseText || "Vazia"}`, "error");
                
                $("#aprazamento-container-dinamico").html(
                    `<div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro na comunicação com o servidor: ${error}
                    </div>`
                );
            }
        });
    });
});

// Arquivo: fix_aprazamento.js
// Responsável por corrigir problemas de visualização de aprazamentos

// Função para corrigir a visualização de aprazamentos
function corrigirVisualizacaoAprazamentos() {
    // Buscar todos os containers de aprazamentos
    const containers = document.querySelectorAll('.container-aprazamentos');
    
    containers.forEach(container => {
        const prescricaoId = container.dataset.prescricaoId;
        if (prescricaoId) {
            carregarAprazamentosNovos(prescricaoId, container);
        }
    });
}

// Função para formatar data/hora de aprazamento
function formatarDataHoraAprazamento(dataHora) {
    if (!dataHora) return '';
    
    try {
        const data = new Date(dataHora);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.error('Erro ao formatar data/hora:', e);
        return dataHora;
    }
}

// Função para atualizar status visual de aprazamento
function atualizarStatusAprazamento(elemento, status) {
    if (!elemento) return;
    
    // Remover classes de status existentes
    elemento.classList.remove('bg-warning', 'bg-success', 'bg-danger');
    
    // Adicionar classe apropriada
    switch (status.toLowerCase()) {
        case 'realizado':
            elemento.classList.add('bg-success');
            break;
        case 'pendente':
            elemento.classList.add('bg-warning');
            break;
        case 'nao_realizado':
            elemento.classList.add('bg-danger');
            break;
    }
}

// Função para atualizar contador de aprazamentos
function atualizarContadorAprazamentos(container) {
    if (!container) return;
    
    const total = container.querySelectorAll('.aprazamento-item').length;
    const realizados = container.querySelectorAll('.aprazamento-item.realizado').length;
    
    const contador = container.querySelector('.contador-aprazamentos');
    if (contador) {
        contador.textContent = `${realizados}/${total}`;
        
        // Atualizar cor do contador
        if (realizados === total) {
            contador.classList.remove('text-warning', 'text-danger');
            contador.classList.add('text-success');
        } else if (realizados === 0) {
            contador.classList.remove('text-success', 'text-warning');
            contador.classList.add('text-danger');
        } else {
            contador.classList.remove('text-success', 'text-danger');
            contador.classList.add('text-warning');
        }
    }
}

// Função para atualizar visualização após mudança de status
function atualizarVisualizacaoAposStatus(elemento, novoStatus) {
    // Atualizar status visual
    atualizarStatusAprazamento(elemento, novoStatus);
    
    // Atualizar contador do container pai
    const container = elemento.closest('.container-aprazamentos');
    if (container) {
        atualizarContadorAprazamentos(container);
    }
    
    // Atualizar tooltips
    if (typeof bootstrap !== 'undefined') {
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.forEach(el => {
            const tooltip = bootstrap.Tooltip.getInstance(el);
            if (tooltip) {
                tooltip.dispose();
            }
            new bootstrap.Tooltip(el);
        });
    }
}

// Inicializar correções quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Corrigir visualização inicial
    corrigirVisualizacaoAprazamentos();
    
    // Observar mudanças no DOM para corrigir novos elementos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                corrigirVisualizacaoAprazamentos();
            }
        });
    });
    
    // Configurar observação
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
