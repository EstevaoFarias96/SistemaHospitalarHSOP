/**
 * Script para gerenciar as prescrições de enfermagem
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o editor de texto rico para prescrições de enfermagem
    initPrescricaoEnfermagemEditor();
    
    // Carrega as prescrições de enfermagem
    carregarPrescricoesEnfermagem();
    
    // Configurar os eventos para o formulário de prescrição de enfermagem
    setupEventos();
});

/**
 * Inicializar o editor de texto rico para prescrições
 */
function initPrescricaoEnfermagemEditor() {
    if (document.getElementById('prescricao_enfermagem_editor')) {
        const quillOptions = {
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['clean']
                ]
            },
            placeholder: 'Digite aqui a prescrição de enfermagem...',
            theme: 'snow'
        };
        
        // Inicializar o editor Quill
        window.quillPrescricaoEnfermagem = new Quill('#prescricao_enfermagem_editor', quillOptions);
        
        // Vincular o conteúdo do editor ao textarea oculto quando o formulário for enviado
        window.quillPrescricaoEnfermagem.on('text-change', function() {
            document.getElementById('prescricao_enfermagem_texto').value = 
                window.quillPrescricaoEnfermagem.root.innerHTML;
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
 * Carregar as prescrições de enfermagem da internação atual
 */
function carregarPrescricoesEnfermagem() {
    const internacaoId = document.getElementById('prescricao_enfermagem_internacao_id').value;
    
    fetch(`/api/enfermagem/prescricao/${internacaoId}`)
        .then(response => response.json())
        .then(prescricoes => {
            // Dividir as prescrições entre hoje e anteriores
            const hoje = new Date().toISOString().split('T')[0];
            const prescricoesHoje = [];
            const prescricoesAntigas = [];
            
            prescricoes.forEach(prescricao => {
                const dataPrescricao = prescricao.data_prescricao.split('T')[0];
                
                if (dataPrescricao === hoje) {
                    prescricoesHoje.push(prescricao);
                } else {
                    prescricoesAntigas.push(prescricao);
                }
            });
            
            // Renderizar as prescrições de hoje
            renderizarPrescricoes(prescricoesHoje, 'listaPrescricoesDoDia', true);
            
            // Renderizar as prescrições antigas
            renderizarPrescricoes(prescricoesAntigas, 'listaPrescricoesAntigas', false);
            
            // Atualizar contador de prescrições antigas
            document.getElementById('contador-prescricoes-antigas').textContent = prescricoesAntigas.length;
        })
        .catch(error => {
            console.error('Erro ao carregar prescrições:', error);
            document.getElementById('listaPrescricoesDoDia').innerHTML = 
                '<tr><td colspan="3" class="text-danger">Erro ao carregar prescrições.</td></tr>';
            document.getElementById('listaPrescricoesAntigas').innerHTML = 
                '<tr><td colspan="3" class="text-danger">Erro ao carregar prescrições.</td></tr>';
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