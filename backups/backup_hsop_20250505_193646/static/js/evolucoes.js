// Arquivo: evolucoes.js
// Responsável pelas funcionalidades relacionadas a evoluções médicas

// Função para carregar evoluções da internação
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

// Função para enviar uma evolução médica
function enviarEvolucao(dados) {
    // Mostrar carregamento
    const btnSubmit = $('#formEvolucao').find('button[type="submit"]');
    const textoOriginal = btnSubmit.html();
    btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Enviando...');
    btnSubmit.prop('disabled', true);
    
    // Enviar os dados para o servidor
    $.ajax({
        url: '/api/evolucoes/registrar',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            if (response.success) {
                // Fechar modal e limpar campos
                $('#modalEvolucao').modal('hide');
                
                // Limpar o editor
                if (window.quill) {
                    window.quill.setText('');
                } else if ($('#fallback-editor').length > 0) {
                    $('#fallback-editor').val('');
                }
                
                // Recarregar lista de evoluções
                carregarEvolucoes();
                
                // Mostrar mensagem de sucesso
                alert('Evolução registrada com sucesso!');
            } else {
                alert('Erro ao registrar evolução: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            console.error('Erro ao registrar evolução:', xhr.responseText);
            alert('Erro de comunicação ao tentar registrar evolução: ' + (xhr.responseJSON?.error || error));
        }
    });
}

// Implementação moderna de scroll para substituir funcionalidades problemáticas
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

// Inicializar eventos quando o documento estiver pronto
$(document).ready(function() {
    // Configurar submissão do formulário de evolução
    $('#formEvolucao').on('submit', function(e) {
        e.preventDefault();
        
        let conteudo = '';
        
        // Capturar conteúdo do editor Quill se estiver disponível
        if (window.quill && window.quill.root) {
            conteudo = window.quill.root.innerHTML;
            // Salvar no textarea oculto também
            $('#texto_evolucao').val(conteudo);
        } else if ($('#fallback-editor').length > 0) {
            conteudo = $('#fallback-editor').val().trim();
        } else {
            conteudo = $('#texto_evolucao').val().trim();
        }
        
        if (!conteudo) {
            alert('Por favor, preencha o texto da evolução.');
            return;
        }
        
        // Preparar dados para envio
        const dados = {
            internacao_id: window.internacaoId,
            funcionario_id: parseInt(window.session.user_id),
            evolucao: conteudo
        };
        
        // Enviar evolução
        enviarEvolucao(dados);
    });
}); 