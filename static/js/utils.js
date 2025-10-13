// Arquivo: utils.js
// Responsável por funções utilitárias e helpers genéricos

// Formatar uma data no formato DD/MM/YYYY
function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '-';
    
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
}

// Formatar uma data e hora no formato DD/MM/YYYY HH:MM
function formatarDataHora(data) {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '-';
    
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

// Obter apenas a parte de hora de uma data (HH:MM)
function obterHora(data) {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '-';
    
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');
    
    return `${hora}:${minuto}`;
}

// Verificar se duas datas são do mesmo dia
function mesmoDia(data1, data2) {
    if (!data1 || !data2) return false;
    
    const d1 = new Date(data1);
    const d2 = new Date(data2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    
    return (
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()
    );
}

// Verificar se uma data é hoje
function ehHoje(data) {
    if (!data) return false;
    const d = new Date(data);
    if (isNaN(d.getTime())) return false;
    
    const hoje = new Date();
    
    return (
        d.getDate() === hoje.getDate() &&
        d.getMonth() === hoje.getMonth() &&
        d.getFullYear() === hoje.getFullYear()
    );
}

// Sanitizar valores de texto para evitar XSS
function sanitizarHTML(texto) {
    if (!texto) return '';
    
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Mostrar ou esconder um elemento de loading na página
function toggleLoading(id, mostrar = true) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    
    if (mostrar) {
        elemento.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    } else {
        elemento.innerHTML = '';
    }
}

// Mostrar uma mensagem de erro em um elemento da página
function mostrarErro(id, mensagem) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    
    elemento.innerHTML = `<div class="alert alert-danger">${mensagem}</div>`;
}

// Verificar se um objeto está vazio
function objetoVazio(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

// Adicionar um listener de eventos para um botão com indicador de carregamento durante a operação
function adicionarBotaoLoadingListener(seletor, callback) {
    const botao = document.querySelector(seletor);
    if (!botao) return;
    
    botao.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const textoOriginal = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        this.disabled = true;
        
        try {
            await callback(e);
        } catch (error) {
            console.error('Erro na operação:', error);
            alert('Ocorreu um erro durante a operação: ' + error.message);
        } finally {
            this.innerHTML = textoOriginal;
            this.disabled = false;
        }
    });
}

// Validar um e-mail
function validarEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Validar um CPF
function validarCPF(cpf) {
    if (!cpf) return false;
    
    // Remover caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação do dígito verificador
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

// Adicionar uma classe a um elemento e removê-la após um certo tempo
function adicionarClasseTemporaria(elemento, classe, duracao = 3000) {
    if (!elemento) return;
    
    elemento.classList.add(classe);
    
    setTimeout(() => {
        elemento.classList.remove(classe);
    }, duracao);
} 