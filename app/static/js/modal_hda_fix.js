// Fix para o modal HDA - Criar dinamicamente
$(document).ready(function() {
    console.log('Iniciando fix para modal HDA...');
    
    // Verificar se o modal HDA já existe
    if ($('#modalEditarHDA').length === 0) {
        console.log('Modal HDA não encontrado, criando dinamicamente...');
        
        const modalHtml = `
            <div class="modal fade" id="modalEditarHDA" tabindex="-1" aria-labelledby="modalEditarHDALabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title" id="modalEditarHDALabel">
                                <i class="fas fa-history me-2"></i>Editar História da Doença Atual (HDA)
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarHDA">
                                <div class="mb-3">
                                    <label for="textoHDA" class="form-label">
                                        <i class="fas fa-file-medical-alt me-1"></i>História da Doença Atual
                                    </label>
                                    <textarea class="form-control" id="textoHDA" name="textoHDA" rows="12" 
                                            placeholder="Descreva a história da doença atual do paciente..."></textarea>
                                    <small class="text-muted">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Registre as informações relevantes sobre o início e evolução dos sintomas que levaram à internação.
                                    </small>
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                        <i class="fas fa-times me-1"></i>Cancelar
                                    </button>
                                    <button type="submit" class="btn btn-info">
                                        <i class="fas fa-save me-1"></i>Salvar HDA
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar o modal ao final do body
        $('body').append(modalHtml);
        console.log('Modal HDA criado com sucesso!');
    } else {
        console.log('Modal HDA já existe');
    }
    
    // Remover handlers conflitantes
    $(document).off('click', '[data-bs-target="#modalEditarHDA"]');
    
    // Handler simplificado para abrir o modal HDA
    $(document).on('click', '[data-bs-target="#modalEditarHDA"]', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Clique no botão editar HDA detectado');
        
        try {
            // Pegar valor atual do HDA
            const hdaAtual = $('#hdaTexto').val() || '';
            $('#textoHDA').val(hdaAtual);
            
            // Verificar se o modal existe agora
            const modalElement = document.getElementById('modalEditarHDA');
            if (!modalElement) {
                console.error('Modal HDA ainda não encontrado após criação');
                alert('Erro: Modal HDA não foi criado corretamente. Recarregue a página.');
                return false;
            }
            
            // Abrir modal usando Bootstrap
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: true,
                focus: true
            });
            modal.show();
            console.log('Modal HDA aberto com sucesso');
            
        } catch (error) {
            console.error('Erro ao abrir modal HDA:', error);
            alert('Erro ao abrir modal de edição da HDA: ' + error.message);
        }
        
        return false;
    });
    
    // Handler para salvar HDA
    $(document).off('submit', '#formEditarHDA');
    $(document).on('submit', '#formEditarHDA', function(e) {
        e.preventDefault();
        
        const hdaTexto = $('#textoHDA').val();
        const atendimentoId = $('#atendimento_id').val();
        
        if (!hdaTexto.trim()) {
            alert('Por favor, digite o texto da HDA.');
            return;
        }
        
        console.log('Salvando HDA:', hdaTexto.substring(0, 50) + '...');
        
        // Salvar HDA via AJAX
        $.ajax({
            url: `/api/internacao/atualizar-hda`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                atendimentos_clinica_id: atendimentoId,
                hda: hdaTexto
            }),
            success: function(response) {
                console.log('Resposta do servidor:', response);
                
                if (response.success) {
                    // Atualizar o display da HDA
                    $('#hdaContainer').html(hdaTexto.replace(/\n/g, '<br>'));
                    $('#hdaTexto').val(hdaTexto);
                    
                    // Fechar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarHDA'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Mostrar mensagem de sucesso
                    const alertSuccess = `
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            <i class="fas fa-check-circle me-2"></i>
                            <strong>Sucesso!</strong> HDA atualizada com sucesso.
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `;
                    $('#evolucoes-pane').prepend(alertSuccess);
                    
                    console.log('HDA salva com sucesso');
                } else {
                    console.error('Erro ao salvar HDA:', response.message);
                    alert('Erro ao salvar HDA: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro na requisição AJAX para salvar HDA:', error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                alert('Erro ao salvar HDA. Tente novamente.');
            }
        });
    });
}); 