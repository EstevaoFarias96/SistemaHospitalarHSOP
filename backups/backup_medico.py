<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evolução do Paciente</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- Add Quill Rich Text Editor CSS -->
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    
    <!-- Script para interceptar e substituir scroll.js -->
    <script>
        // Interceptar scripts antes que sejam carregados
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'script') {
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if (name === 'src' && value && value.includes('scroll.js')) {
                        console.log('Interceptado carregamento de scroll.js - Substituindo com implementação moderna');
                        // Não carregamos o script original
                        return element;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
        
        // Sobrescrever EventTarget.prototype.addEventListener para monitorar eventos depreciados
        (function() {
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            const deprecatedEvents = [
                'DOMNodeInserted', 
                'DOMNodeRemoved', 
                'DOMSubtreeModified',
                'DOMAttrModified',
                'DOMCharacterDataModified'
            ];
            
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (deprecatedEvents.includes(type)) {
                    console.warn(`Evento depreciado '${type}' detectado e não será adicionado`);
                    // Não adicionamos o listener para eventos depreciados
                    return;
                }
                
                return originalAddEventListener.call(this, type, listener, options);
            };
        })();
    </script>
    
    <style>
        body {
            background-color: #f8f9fa;
        }
        .nav-pills .nav-link {
            margin-right: 10px;
            border-radius: 50rem;
            padding: 0.5rem 1rem;
        }
        .nav-pills .nav-link.active {
            background-color: #0d6efd;
        }
        .content-section {
            display: none;
        }
        .content-section.active {
            display: block;
        }
        .paciente-info {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .paciente-info .info-item {
            font-size: 0.9rem;
            margin-bottom: 8px;
        }
        .paciente-info .info-item strong {
            color: #495057;
        }
        .table-medicamentos {
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
        }
        .alerta-alergia {
            border: 2px solid #ffc107;
            padding: 5px 10px;
            display: none;
            font-weight: bold;
            color: #856404;
            background-color: #fff3cd;
            border-radius: 4px;
            margin-top: 5px;
        }
        /* Estilos adicionais para a tabela de evoluções */
        .table-medicamentos td {
            vertical-align: middle;
            padding: 10px;
        }
        
        /* Estilos para as tabelas de medicamentos nas prescrições */
        .prescricao-card {
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 8px;
            overflow: hidden;
        }
        
        .prescricao-card .card-header {
            padding: 5px 10px;
            font-size: 0.85rem;
        }
        
        .prescricao-card .card-body {
            padding: 8px;
        }
        
        .tabela-medicamentos-prescricao th,
        .tabela-medicamentos-prescricao td {
            padding: 4px 8px;
            font-size: 0.85rem;
        }
        
        .tabela-medicamentos-prescricao tbody tr:hover {
            background-color: rgba(13, 110, 253, 0.05);
        }
        
        /* Novos estilos para melhorar a distinção entre prescrições */
        .prescricao-container {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
            background-color: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            position: relative;
        }
        
        .prescricao-container:hover {
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .prescricao-header {
            background-color: #f1f8ff;
            padding: 5px 10px;
            margin: -12px -12px 10px -12px;
            border-bottom: 1px solid #dee2e6;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
        }
        
        .prescricao-header .medico-info {
            font-weight: bold;
            color: #0d6efd;
        }
        
        .prescricao-header .timestamp {
            color: #6c757d;
            font-size: 0.85rem;
        }
        
        .prescricao-section {
            margin-bottom: 10px;
            border-left: 3px solid #cfe2ff;
            padding-left: 10px;
        }
        
        .prescricao-section.dieta {
            border-color: #d1e7dd;
        }
        
        .prescricao-section.medicamentos {
            border-color: #cfe2ff;
        }
        
        .prescricao-section.procedimentos {
            border-color: #f8d7da;
        }
        
        .prescricao-section-title {
            font-weight: bold;
            color: #495057;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }
        
        .prescricao-section-content {
            background-color: #f8f9fa;
            padding: 8px;
        }
        
        .prescricao-actions {
            position: absolute;
            top: 10px;
            right: 10px;
        }
        
        .data-header {
            background-color: #6c757d;
            color: white;
            padding: 8px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-weight: bold;
            text-align: center;
        }
        
        /* Formatação especial para a coluna de texto de evolução */
        .texto-evolucao {
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 450px;
            min-height: 150px;
            overflow-y: auto;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 6px;
            border-left: 4px solid #0d6efd;
            font-size: 0.9rem;
            line-height: 1.5;
            transition: max-height 0.3s ease;
        }
        
        .texto-evolucao:hover {
            max-height: 600px;
        }
        
        .texto-evolucao p {
            margin-bottom: 0.6rem;
        }
        
        .texto-evolucao * {
            max-width: 100%;
        }
        
        .texto-evolucao h1, .texto-evolucao h2, .texto-evolucao h3 {
            margin-top: 0.8rem;
            margin-bottom: 0.8rem;
            font-weight: 600;
        }
        
        .texto-evolucao ul, .texto-evolucao ol {
            padding-left: 25px;
            margin-bottom: 0.8rem;
        }
        
        .texto-evolucao li {
            margin-bottom: 0.3rem;
        }
        
        .texto-evolucao strong, .texto-evolucao b {
            font-weight: 700;
        }
        
        .texto-evolucao em, .texto-evolucao i {
            font-style: italic;
        }
        
        .texto-evolucao blockquote {
            margin: 0.8rem 0;
            padding: 0.5rem 1rem;
            border-left: 3px solid #adb5bd;
            background-color: #f0f0f0;
        }
        
        .texto-evolucao::-webkit-scrollbar {
            width: 10px;
        }
        
        .texto-evolucao::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        
        .texto-evolucao::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
        }
        
        .texto-evolucao::-webkit-scrollbar-thumb:hover {
            background: #0d6efd;
        }
        
        #editor-container {
            height: 450px;
            margin-bottom: 15px;
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
        }
        
        .ql-editor {
            font-size: 13px;
            line-height: 1.5;
            min-height: 400px;
        }
        
        .ql-tooltip {
            z-index: 1060 !important;
        }
        
        @media (max-width: 768px) {
            .texto-evolucao {
                max-height: 250px;
                font-size: 0.85rem;
                min-height: 100px;
            }
            #editor-container {
                height: 250px;
            }
            .ql-editor {
                min-height: 200px;
            }
        }
        
        /* Estilos para adaptar a altura da caixa baseado no tamanho do conteúdo */
        .texto-evolucao[data-lines="1"],
        .texto-evolucao[data-lines="2"],
        .texto-evolucao[data-lines="3"] {
            max-height: 150px;
            min-height: 80px;
        }
        
        .texto-evolucao[data-lines="4"],
        .texto-evolucao[data-lines="5"],
        .texto-evolucao[data-lines="6"] {
            max-height: 200px;
            min-height: 100px;
        }
        
        .texto-evolucao[data-lines="7"],
        .texto-evolucao[data-lines="8"],
        .texto-evolucao[data-lines="9"] {
            max-height: 250px;
            min-height: 150px;
        }
        
        .texto-evolucao[data-lines="10"],
        .texto-evolucao[data-lines="11"],
        .texto-evolucao[data-lines="12"] {
            max-height: 300px;
            min-height: 200px;
        }
        
        .texto-evolucao[data-lines="13"],
        .texto-evolucao[data-lines="14"],
        .texto-evolucao[data-lines="15"] {
            max-height: 350px;
            min-height: 250px;
        }
        
        .texto-evolucao[data-lines="16"],
        .texto-evolucao[data-lines="17"],
        .texto-evolucao[data-lines="18"] {
            max-height: 400px;
            min-height: 300px;
        }
        
        .texto-evolucao[data-lines="19"],
        .texto-evolucao[data-lines="20"],
        .texto-evolucao[data-lines="21"] {
            max-height: 450px;
            min-height: 350px;
        }
        
        .texto-evolucao[data-lines="22"] {
            max-height: 500px;
            min-height: 400px;
        }
        
        /* Estilos para o calendário de aprazamento */
        .calendar-day {
            width: 120px;
            min-height: 80px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            background-color: #f8f9fa;
        }
        
        .calendar-day:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            background-color: #fff;
        }
        
        .day-header {
            font-weight: bold;
            border-bottom: 1px dashed #dee2e6;
            padding-bottom: 5px;
        }
        
        .time-pill {
            border: 1px solid #e9ecef;
            transition: all 0.2s;
        }
        
        .time-pill:hover {
            background-color: #e9ecef;
        }
        
        /* Estilos para popovers dos dias */
        .popover {
            max-width: 300px;
        }
        
        .popover-body {
            max-height: 200px;
            overflow-y: auto;
        }
        
        /* Novos estilos para o modal de aprazamento redesenhado */
        #modalAprazamento .modal-content {
            border: none;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        #modalAprazamento .modal-header {
            background: linear-gradient(135deg, #4a6fdc 0%, #2856d4 100%);
            border-bottom: none;
            padding: 20px 24px;
        }
        
        #modalAprazamento .modal-title {
            font-weight: 600;
            font-size: 1.2rem;
        }
        
        #modalAprazamento .modal-body {
            padding: 24px;
        }
        
        #modalAprazamento .form-label {
            font-weight: 500;
            color: #495057;
            margin-bottom: 8px;
        }
        
        #modalAprazamento .input-group-text {
            background-color: #f8f9fa;
            border-color: #ced4da;
            color: #6c757d;
        }
        
        #modalAprazamento .form-control,
        #modalAprazamento .form-select {
            border-color: #ced4da;
            padding: 10px 15px;
            border-radius: 6px;
            transition: all 0.2s;
        }
        
        #modalAprazamento .form-control:focus,
        #modalAprazamento .form-select:focus {
            border-color: #4a6fdc;
            box-shadow: 0 0 0 0.25rem rgba(74, 111, 220, 0.25);
        }
        
        #modalAprazamento .card {
            border: none;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        #modalAprazamento .card:hover {
            box-shadow: 0 6px 16px rgba(0,0,0,0.1);
        }
        
        #modalAprazamento .alert {
            border-radius: 8px;
            border: none;
        }
        
        #modalAprazamento .alert-info {
            background-color: #e6f3fd;
            color: #0c63e4;
        }
        
        #modalAprazamento .btn-primary {
            background: linear-gradient(to right, #4a6fdc, #2856d4);
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            transition: all 0.2s;
            font-weight: 500;
        }
        
        #modalAprazamento .btn-primary:hover {
            background: linear-gradient(to right, #5d7fe3, #3967e5);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(45, 85, 211, 0.3);
        }
        
        #modalAprazamento .btn-outline-secondary {
            border-color: #ced4da;
            color: #495057;
        }
        
        #modalAprazamento .btn-success {
            background: linear-gradient(to right, #28a745, #218838);
            border: none;
            font-weight: 500;
        }
        
        #modalAprazamento .btn-success:hover {
            background: linear-gradient(to right, #2fd050, #27a844);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
        }
        
        #horarios_multiplos_dias .form-check-input {
            width: 18px;
            height: 18px;
            margin-top: 3px;
        }
        
        #horarios_multiplos_dias .form-check-input:checked {
            background-color: #4a6fdc;
            border-color: #4a6fdc;
        }
        
        #horarios_multiplos_dias .card-header {
            background-color: #f8f9fa;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            font-weight: 600;
            padding: 12px 15px;
        }
        
        #horarios_multiplos_dias .btn-group .btn {
            padding: 5px 10px;
            font-size: 0.85rem;
        }

        /* Estilos para o modal de visualização de aprazamentos */
        .modal-visualizar-aprazamento .modal-content {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .modal-visualizar-aprazamento .modal-header {
            background-color: #17a2b8;
            color: white;
            border-radius: 8px 8px 0 0;
        }

        .modal-visualizar-aprazamento .table {
            margin-bottom: 0;
        }

        .modal-visualizar-aprazamento .table th {
            font-weight: 600;
            font-size: 0.9rem;
        }

        .modal-visualizar-aprazamento .table td {
            vertical-align: middle;
            font-size: 0.9rem;
        }

        .modal-visualizar-aprazamento .resumo-aprazamentos {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 1rem;
        }

        .modal-visualizar-aprazamento .resumo-aprazamentos .col {
            text-align: center;
        }

        .modal-visualizar-aprazamento .resumo-aprazamentos small {
            display: block;
            margin-bottom: 0.25rem;
            color: #6c757d;
        }

        .modal-visualizar-aprazamento .resumo-aprazamentos strong {
            font-size: 1.25rem;
            display: block;
        }

        .modal-visualizar-aprazamento .status-icon {
            margin-right: 0.5rem;
        }

        .modal-visualizar-aprazamento .table-responsive {
            max-height: 400px;
            overflow-y: auto;
        }

        /* Estilos para os botões de RN */
        .rn-buttons {
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }

        .rn-buttons .btn {
            margin-right: 10px;
        }

        /* Estilos para o modal de RN */
        .modal-rn .form-group {
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
<div class="container mt-4 mb-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Evolução do Paciente</h2>
        <div>
            <button onclick="abrirImpressao()" class="btn btn-primary me-2">
                <i class="fas fa-print"></i> Imprimir
            </button>
            <button id="btnMostrarInformacoes" class="btn btn-warning me-2">
                <i class="fas fa-info-circle"></i> Informações
            </button>
            <a href="/clinica/pacientes-internados" class="btn btn-outline-primary">
                <i class="fas fa-arrow-left"></i> Voltar
            </a>
        </div>
    </div>

    <!-- Informações do Paciente -->
    <div class="paciente-info row">
        <div class="col-md-3 info-item"><strong>Nome:</strong> {{ paciente.nome }}</div>
        <div class="col-md-3 info-item"><strong>CPF:</strong> {{ paciente.cpf }}</div>
        <div class="col-md-3 info-item"><strong>Cartão SUS:</strong> {{ paciente.cartao_sus }}</div>
        <div class="col-md-3 info-item"><strong>Sexo:</strong> {{ paciente.sexo }}</div>
        <div class="col-md-3 info-item"><strong>Data de Nascimento:</strong> {{ paciente.data_nascimento.strftime('%d/%m/%Y') if paciente.data_nascimento else '-' }}</div>
        <div class="col-md-3 info-item"><strong>Endereço:</strong> {{ paciente.endereco }}</div>
        <div class="col-md-3 info-item"><strong>Município:</strong> {{ paciente.municipio }}</div>
        <div class="col-md-3 info-item"><strong>Telefone:</strong> {{ paciente.telefone }}</div>
        <div class="col-md-3 info-item"><strong>Nome Social:</strong> {{ paciente.nome_social }}</div>
        <div class="col-md-3 info-item"><strong>Filiação:</strong> {{ paciente.filiacao }}</div>
    </div>

    <!-- Botões de RN/Mãe -->
    <div class="rn-buttons">
        <!-- Botões para quando o paciente é a mãe -->
        <div id="botoesResponsavel" style="display: none;">
            <button type="button" class="btn btn-primary" id="btnAssociarRN" onclick="abrirModalRN()">
                <i class="fas fa-baby"></i> Associar RN
            </button>
            <button type="button" class="btn btn-info" id="btnVerRN" style="display: none;" onclick="verFichaRN()">
                <i class="fas fa-file-medical"></i> Ver ficha do RN
            </button>
        </div>
        
        <!-- Botão para quando o paciente é RN -->
        <div id="botoesRN" style="display: none;">
            <button type="button" class="btn btn-info" id="btnVerMae" onclick="verFichaMae()">
                <i class="fas fa-female"></i> Ver ficha da mãe
            </button>
        </div>
    </div>

    <ul class="nav nav-pills mb-4" id="menuTabs">
        <li class="nav-item">
            <a class="nav-link" href="#" data-target="prescricaoSection"><i class="fas fa-pills me-2"></i>Prescrição Médica</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" data-target="evolucaoSection"><i class="fas fa-notes-medical me-2"></i>Evolução</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" data-target="enfermagemSection"><i class="fas fa-user-nurse me-2"></i>Enfermagem</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" data-target="prescricaoEnfermagemSection"><i class="fas fa-clipboard-list me-2"></i>Prescrição Enfermagem</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" data-target="examesSection"><i class="fas fa-vial me-2"></i>Exames Laboratoriais</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" data-target="receituarioSection"><i class="fas fa-prescription me-2"></i>Receituário</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" data-target="atestadoSection"><i class="fas fa-file-medical me-2"></i>Atestados</a>
        </li>
    </ul>

    <!-- Seção de Prescrições Médicas -->
    <div id="prescricaoSection" class="content-section">
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Prescrições Médicas</h5>
                <div class="d-flex gap-2">
                    <button class="btn btn-light btn-sm" id="btn-nova-prescricao">
                        <i class="fas fa-plus"></i> Nova Prescrição
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Prescrições de Hoje -->
                <div class="mb-3" id="hoje-container-prescricao">
                    <h6 class="fw-bold text-success mb-2">
                        <i class="fas fa-calendar-day me-1"></i> 
                        <span id="titulo-prescricoes-hoje">Prescrições de Hoje</span>
                    </h6>
                    <div id="listaPrescricoesDoDia">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
                
                <!-- Prescrições Anteriores -->
                <div class="mb-3" id="antigas-container-prescricao">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="fw-bold text-secondary mb-0">
                            <i class="fas fa-history me-1"></i> Prescrições Anteriores
                        </h6>
                        <span class="badge bg-info" id="contador-prescricoes-antigas">0</span>
                    </div>
                    <div id="listaPrescricoesAntigas">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Seção de Prescrições de Enfermagem -->
    <div id="prescricaoEnfermagemSection" class="content-section">
        <div class="card shadow-sm">
            <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Prescrições de Enfermagem</h5>
            </div>
            <div class="card-body">
                <!-- Prescrições de Enfermagem de Hoje -->
                <div class="mb-3" id="hoje-container-prescricao-enfermagem">
                    <h6 class="fw-bold text-success mb-2">
                        <i class="fas fa-calendar-day me-1"></i> 
                        <span id="titulo-prescricoes-enfermagem-hoje">Prescrições de Enfermagem de Hoje</span>
                    </h6>
                    <div id="listaPrescricoesEnfermagemDoDia">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
                
                <!-- Prescrições de Enfermagem Anteriores -->
                <div class="mb-3" id="antigas-container-prescricao-enfermagem">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="fw-bold text-secondary mb-0">
                            <i class="fas fa-history me-1"></i> Prescrições de Enfermagem Anteriores
                        </h6>
                        <span class="badge bg-info" id="contador-prescricoes-enfermagem-antigas">0</span>
                    </div>
                    <div id="listaPrescricoesEnfermagemAntigas">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="evolucaoSection" class="content-section">
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Evolução e Conduta</h5>
                <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalEvolucao">
                    <i class="fas fa-plus-circle"></i> Nova Evolução
                </button>
            </div>
            <div class="card-body">
                <div class="mt-3 mb-3">
                    <h6 class="fw-bold">Informações de Admissão</h6>
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <label class="form-label fw-bold">HDA (História da Doença Atual)</label>
                                <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#modalEditarHDA">
                                    <i class="fas fa-edit"></i> Editar HDA
                                </button>
                            </div>
                            <textarea class="form-control" id="hdaTexto" rows="2" readonly>{{ internacao.hda or 'Não registrado.' }}</textarea>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive mb-3">
                    <table class="table table-striped table-medicamentos">
                        <thead class="table-primary">
                            <tr>
                                <th scope="col" style="width: 12%">Data/Hora</th>
                                <th scope="col" style="width: 13%">Médico</th>
                                <th scope="col" style="width: 75%">Evolução</th>
                            </tr>
                        </thead>
                        <tbody id="listaEvolucoes">
                            <tr>
                                <td colspan="3" class="text-center">Carregando evoluções...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Evolução -->
    <div class="modal fade" id="modalEvolucao" tabindex="-1" aria-labelledby="modalEvolucaoLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="modalEvolucaoLabel">Registrar Nova Evolução</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formEvolucao">
                        <div class="mb-3">
                            <label class="form-label">Texto da Evolução</label>
                            <!-- Editor container -->
                            <div id="editor-container"></div>
                            <!-- Hidden textarea to store the content -->
                            <textarea id="texto_evolucao" name="texto_evolucao" style="display:none"></textarea>
                            <small class="text-muted">Descreva a evolução do paciente, sinais, sintomas, exames, condutas realizadas, etc.</small>
                        </div>
                        <div class="text-end">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Registrar Evolução</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div id="enfermagemSection" class="content-section">
        <!-- Admissão de Enfermagem -->
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Admissão de Enfermagem</h5>
            </div>
            <div class="card-body">
                <div id="admissao-texto-container">
                    <div class="texto-admissao">
                        {% if internacao.admissao_enfermagem %}
                            {{ internacao.admissao_enfermagem | safe }}
                        {% else %}
                            <div class="text-muted">Nenhuma admissão de enfermagem registrada para este paciente.</div>
                        {% endif %}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Evoluções de Enfermagem -->
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Evoluções de Enfermagem</h5>
            </div>
            <div class="card-body">
                <!-- Seletor de data para filtrar evoluções -->
                <div class="mb-3">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <label for="filtro-data" class="form-label">Filtrar por data:</label>
                            <div class="input-group">
                                <input type="date" id="filtro-data" class="form-control form-control-sm">
                                <button class="btn btn-sm btn-outline-primary" id="btn-filtrar-data">
                                    <i class="fas fa-filter"></i> Filtrar
                                </button>
                                <button class="btn btn-sm btn-outline-secondary" id="btn-limpar-filtro">
                                    <i class="fas fa-times"></i> Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3" id="hoje-container">
                    <h6 class="fw-bold text-success mb-2"><i class="fas fa-calendar-day me-1"></i> <span id="titulo-evolucoes-hoje">Evoluções de Hoje</span></h6>
                    <div class="table-responsive">
                        <table class="table table-striped table-medicamentos">
                            <thead class="table-info">
                                <tr>
                                    <th scope="col" style="width: 12%">Hora</th>
                                    <th scope="col" style="width: 13%">Enfermeiro</th>
                                    <th scope="col" style="width: 75%">Evolução</th>
                                </tr>
                            </thead>
                            <tbody id="listaEvolucoesDoDia">
                                <tr>
                                    <td colspan="3" class="text-center">Carregando evoluções de hoje...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="mb-3" id="antigas-container">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="fw-bold text-secondary mb-0"><i class="fas fa-history me-1"></i> Evoluções Anteriores</h6>
                        <span class="badge bg-info" id="contador-evolucoes-antigas">0</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped table-medicamentos">
                            <thead class="table-secondary">
                                <tr>
                                    <th scope="col" style="width: 12%">Data/Hora</th>
                                    <th scope="col" style="width: 13%">Enfermeiro</th>
                                    <th scope="col" style="width: 75%">Evolução</th>
                                </tr>
                            </thead>
                            <tbody id="listaEvolucoesAntigas">
                                <tr>
                                    <td colspan="3" class="text-center">Carregando evoluções anteriores...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- SAE -->
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Sistematização da Assistência de Enfermagem (SAE)</h5>
                <div>
                    <button class="btn btn-light btn-sm" id="btn-historico-sae">
                        <i class="fas fa-history"></i> Ver Histórico
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div id="listaSAE">
                    <p class="text-center text-muted">Carregando dados da SAE...</p>
                </div>
                <div id="historicoSAE" style="display: none;">
                    <h6 class="mb-3 text-secondary"><i class="fas fa-history me-2"></i> Histórico de SAE</h6>
                    <div id="listaHistoricoSAE">
                        <p class="text-center text-muted">Carregando histórico...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="examesSection" class="content-section">
        <div class="card shadow-sm">
            <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Exames Laboratoriais</h5>
                <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalEditarExames">
                    <i class="fas fa-edit"></i> Editar Exames
                </button>
            </div>
            <div class="card-body">
                <div id="examesLaboratoriaisTexto" class="texto-evolucao">
                    {{ internacao.exames_laboratoriais or 'Não registrado.' }}
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Editar Exames -->
    <div class="modal fade" id="modalEditarExames" tabindex="-1" aria-labelledby="modalEditarExamesLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-secondary text-white">
                    <h5 class="modal-title" id="modalEditarExamesLabel">Editar Exames Laboratoriais</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formExames">
                        <div class="mb-3">
                            <label for="textoExames" class="form-label">Exames Laboratoriais</label>
                            <textarea class="form-control" id="textoExames" name="textoExames" rows="10" 
                                placeholder="Registre os exames laboratoriais do paciente...">{{ internacao.exames_laboratoriais or '' }}</textarea>
                        </div>
                        <div class="text-end">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Exames</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div id="receituarioSection" class="content-section">
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Receituário</h5>
                <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalNovaReceita">
                    <i class="fas fa-plus-circle"></i> Nova Receita
                </button>
            </div>
            <div class="card-body">
                <div class="mb-3" id="hoje-container-receituario">
                    <h6 class="fw-bold text-success mb-2">
                        <i class="fas fa-calendar-day me-1"></i> 
                        <span id="titulo-receitas-hoje">Receitas de Hoje</span>
                    </h6>
                    <div id="listaReceitasDoDia">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
                
                <div class="mb-3" id="antigas-container-receituario">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="fw-bold text-secondary mb-0">
                            <i class="fas fa-history me-1"></i> Receitas Anteriores
                        </h6>
                        <span class="badge bg-info" id="contador-receitas-antigas">0</span>
                    </div>
                    <div id="listaReceitasAntigas">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Nova Receita -->
    <div class="modal fade" id="modalNovaReceita" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">Nova Receita</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <form id="formReceita">
                        <div class="mb-3">
                            <label class="form-label">Tipo de Receita</label>
                            <select class="form-select" id="tipo_receita" required>
                                <option value="">Selecione o tipo de receita</option>
                                <option value="normal">Receita Normal</option>
                                <option value="especial">Receita Especial</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Conteúdo da Receita</label>
                            <div id="editor-receita-container">
                                <!-- Editor Quill será inicializado aqui -->
                            </div>
                            <textarea id="conteudo_receita" name="conteudo_receita" style="display:none"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btn_salvar_receita">Salvar Receita</button>
                </div>
            </div>
        </div>
    </div>

    <div id="atestadoSection" class="content-section">
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Atestados</h5>
                <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalNovoAtestado">
                    <i class="fas fa-plus-circle"></i> Novo Atestado
                </button>
            </div>
            <div class="card-body">
                <div class="mb-3" id="hoje-container-atestado">
                    <h6 class="fw-bold text-success mb-2">
                        <i class="fas fa-calendar-day me-1"></i> 
                        <span id="titulo-atestados-hoje">Atestados de Hoje</span>
                    </h6>
                    <div id="listaAtestadosDoDia">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
                
                <div class="mb-3" id="antigas-container-atestado">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="fw-bold text-secondary mb-0">
                            <i class="fas fa-history me-1"></i> Atestados Anteriores
                        </h6>
                        <span class="badge bg-info" id="contador-atestados-antigos">0</span>
                    </div>
                    <div id="listaAtestadosAntigos">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Novo Atestado -->
    <div class="modal fade" id="modalNovoAtestado" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">Novo Atestado</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <form id="formAtestado">
                        <div class="mb-3">
                            <label class="form-label">Dias de Afastamento</label>
                            <input type="number" class="form-control" id="dias_afastamento" min="1" placeholder="Número de dias">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Conteúdo do Atestado</label>
                            <div id="editor-atestado-container">
                                <!-- Editor Quill será inicializado aqui -->
                            </div>
                            <textarea id="conteudo_atestado" name="conteudo_atestado" style="display:none"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btn_salvar_atestado">Salvar Atestado</button>
                </div>
            </div>
        </div>
    </div>

    <div id="imagensSection" class="content-section">
        <div class="alert alert-info">Visualização de imagens ainda não disponível.</div>
    </div>
</div>

<!-- jQuery (deve ser carregado primeiro) -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Bootstrap Bundle with Popper -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

<!-- Quill Rich Text Editor -->
<script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>

<script src="/static/js/aprazamento.js"></script>
<script src="/static/js/calendario_aprazamento.js"></script>
<script src="/static/js/calculo_horarios.js"></script>

<!-- Definir variáveis globais importantes -->
<script>
    // Definir globalmente o ID do usuário e cargo para os scripts
    const session = {
        cargo: "{{ session.get('cargo', '') }}",
        user_id: "{{ session.get('user_id', '') }}"
    };
</script>

<script>
    // Extrair ID do atendimento da URL
    const urlParams = new URLSearchParams(window.location.search);
    const atendimentoId = "{{ internacao.atendimento_id }}";
    const internacaoIdRaw = "{{ internacao.id }}";
    console.log('Valor raw de internacao.id:', internacaoIdRaw);
    const internacaoId = parseInt(internacaoIdRaw, 10);
    const internacao_Id = "{{ internacao.atendimento_id }}";
    console.log('Valor de internacaoId após parse:', internacaoId, typeof internacaoId);
    
    // Verificar se internacaoId é um número válido
    if (isNaN(internacaoId)) {
        console.error('Erro: internacaoId não é um número válido!');
        alert('Erro ao carregar o ID da internação. Por favor, recarregue a página ou contate o suporte.');
    } else {
        console.log('internacaoId válido:', internacaoId);
    }
    
    // Variáveis globais
    let quill;
    let medicamentosAdicionados = [];

    $(document).ready(function() {
        const internacaoId = parseInt("{{ internacao.id }}", 10);
        const urlAnterior = "{{ url_anterior }}";
        
        // Iniciar carregamento das visualizações de enfermagem
        carregarEvolucoesEnfermagem();
        carregarPrescricoesEnfermagem();
        
        // Configurar filtros
        $('#filtrarEvolucoesPorData').on('change', function() {
            const dataFiltro = $(this).val();
            filtrarEvolucoesEnfermagemPorData(dataFiltro);
        });
        
        $('#filtrarPrescricoesPorData').on('change', function() {
            const dataFiltro = $(this).val();
            filtrarPrescricoesEnfermagemPorData(dataFiltro);
        });
        
        // Debugar cargo do usuário
        console.log("Cargo do usuário na sessão:", "{{ session.get('cargo') }}");
        
        // Verificar permissão do usuário
        if ("{{ session.get('cargo')|lower|trim }}" !== "medico") {
            $('body').prepend('<div class="alert alert-warning text-center">Esta página está otimizada para uso por médicos. Algumas funcionalidades podem estar limitadas.</div>');
        }
        
        // Configurar navegação das abas
        document.querySelectorAll('#menuTabs .nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                const target = this.getAttribute('data-target');
                document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
                if (target) document.getElementById(target).classList.add('active');
            });
        });

        // Ativar a primeira aba por padrão
        document.querySelector('#menuTabs .nav-link').click();
        
        // Inicializar o Editor Quill
        try {
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
                placeholder: 'Descreva a evolução do paciente...',
                theme: 'snow'
            });
            
            // Ao mudar o conteúdo do Quill, atualizar o textarea
            quill.on('text-change', function() {
                const html = quill.root.innerHTML;
                document.getElementById('texto_evolucao').value = html;
            });
        } catch (error) {
            console.error('Erro ao inicializar o editor Quill:', error);
            // Criar um fallback para o editor
            $('#editor-container').html('<textarea id="fallback-editor" class="form-control" rows="10" placeholder="Descreva a evolução do paciente..."></textarea>');
            
            // Atualizar o textarea oculto quando o fallback for alterado
            $('#fallback-editor').on('input', function() {
                $('#texto_evolucao').val($(this).val());
            });
        }

        // Carregar prescrições ao iniciar
        carregarPrescricoes();
        
        // Carregar evoluções ao iniciar
        carregarEvolucoes();
        
        // Adicionar evento para o botão de adicionar medicamento

        
        // Função para atualizar a tabela de medicamentos
        function atualizarTabelaMedicamentos() {
            const tbody = $('#tabela_medicamentos tbody');
            
            if (medicamentosAdicionados.length === 0) {
                tbody.html(`
                    <tr id="sem_medicamentos">
                        <td colspan="3" class="text-center text-muted">Nenhum medicamento adicionado</td>
                    </tr>
                `);
                return;
            }
            
            tbody.empty();
            
            medicamentosAdicionados.forEach((med, index) => {
                tbody.append(`
                    <tr>
                        <td>${med.nome_medicamento}</td>
                        <td>${med.descricao_uso}</td>
                        <td>
                            <button type="button" class="btn btn-danger btn-sm btn-remover-medicamento" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `);
            });
            
            // Adicionar evento para os botões de remover
            $('.btn-remover-medicamento').on('click', function() {
                const index = $(this).data('index');
                
                if (confirm('Tem certeza que deseja remover este medicamento?')) {
                    medicamentosAdicionados.splice(index, 1);
                    atualizarTabelaMedicamentos();
                }
            });
        }
        
        // Função para limpar o formulário de prescrição
        function limparFormularioPrescricao() {
            $('#prescricao_id').val('');
            $('#texto_dieta').val('');
            $('#texto_procedimento_medico').val('');
            $('#texto_procedimento_multi').val('');
            $('#nome_medicamento').val('');
            $('#descricao_uso').val('');
            
            // Limpar medicamentos adicionados
            medicamentosAdicionados = [];
            atualizarTabelaMedicamentos();
            
            // Restaurar título do modal
            $('#modalPrescricaoLabel').text('Nova Prescrição');
        }
        
        // Função para carregar prescrições da internação
        async function carregarPrescricoes() {
            try {
                const response = await fetch(`/api/prescricoes/${internacaoId}`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao carregar prescrições');
                }
                
                if (!data.prescricoes || data.prescricoes.length === 0) {
                    $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada para hoje.</td></tr>');
                    $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição anterior encontrada.</td></tr>');
                    return;
                }
                
                // Ordenar prescrições por data (mais recentes primeiro)
                data.prescricoes.sort((a, b) => {
                    const dataA = new Date(a.data_prescricao);
                    const dataB = new Date(b.data_prescricao);
                    return dataB - dataA;
                });
                
                // Separar prescrições de hoje e antigas
                const hoje = new Date().toLocaleDateString('pt-BR');
                const prescricoesHoje = [];
                const prescricoesAntigas = [];
                
                data.prescricoes.forEach(prescricao => {
                    const dataPrescricao = new Date(prescricao.data_prescricao).toLocaleDateString('pt-BR');
                    if (dataPrescricao === hoje) {
                        prescricoesHoje.push(prescricao);
                    } else {
                        prescricoesAntigas.push(prescricao);
                    }
                });
                
                // Renderizar prescrições de hoje
                if (prescricoesHoje.length > 0) {
                    const htmlHoje = prescricoesHoje.map(prescricao => renderizarPrescricao(prescricao)).join('');
                    $('#listaPrescricoesDoDia').html(htmlHoje);
                } else {
                    $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada para hoje.</td></tr>');
                }
                
                // Renderizar prescrições antigas
                if (prescricoesAntigas.length > 0) {
                    const htmlAntigas = prescricoesAntigas.map(prescricao => renderizarPrescricao(prescricao)).join('');
                    $('#listaPrescricoesAntigas').html(htmlAntigas);
                    $('#contador-prescricoes-antigas').text(prescricoesAntigas.length);
                } else {
                    $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição anterior encontrada.</td></tr>');
                    $('#contador-prescricoes-antigas').text('0');
                }
                
            } catch (error) {
                console.error('Erro ao carregar prescrições:', error);
                $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições. Por favor, tente novamente.</td></tr>');
                $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições. Por favor, tente novamente.</td></tr>');
            }
        }

        // Função para carregar evoluções da internação
        function carregarEvolucoes() {
            console.log('Carregando evoluções para internacaoId:', internacaoId);
            
            if (!internacaoId || isNaN(internacaoId)) {
                console.error('ID de internação inválido ao carregar evoluções:', internacaoId);
                $('#listaEvolucoes').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
                return;
            }
            
            $.ajax({
                url: `/api/evolucoes/${internacaoId}`,
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
        
        // Função para editar prescrição
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
                                    medicamentosAdicionados.push({
                                        nome_medicamento: med.nome_medicamento,
                                        descricao_uso: med.descricao_uso
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
                        alert('Erro ao buscar dados da prescrição: ' + (response.error || 'Erro desconhecido'));
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao buscar dados da prescrição:', xhr.responseText);
                    alert('Erro de comunicação ao buscar dados da prescrição: ' + error);
                }
            });
        }

        // Submissão do formulário de prescrição
        $('#formPrescricao').on('submit', function(e) {
            e.preventDefault();
            
            // Verificar se é uma nova prescrição ou uma edição
            const prescricaoId = $('#prescricao_id').val();
            const isEdicao = prescricaoId !== "";
            
            const texto_dieta = $('#texto_dieta').val().trim();
            const texto_procedimento_medico = $('#texto_procedimento_medico').val().trim();
            const texto_procedimento_multi = $('#texto_procedimento_multi').val().trim();
            
            // Verificar se ao menos algo foi preenchido (dieta, procedimentos ou medicamentos)
            if (!texto_dieta && !texto_procedimento_medico && !texto_procedimento_multi && medicamentosAdicionados.length === 0) {
                alert('Por favor, preencha pelo menos um dos campos da prescrição ou adicione ao menos um medicamento.');
                return;
            }
            
            // Obter horário atual formatado para o Brasil
            const dataAtual = new Date();
            const horarioBrasil = dataAtual.toLocaleString('pt-BR', { 
                timeZone: 'America/Sao_Paulo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            // Log para debug do horário
            console.log('Horário formatado para Brasil:', horarioBrasil);
            
            // Preparar dados para envio
            let dados = {
                atendimentos_clinica_id: isNaN(internacaoId) ? null : internacaoId,
                medico_id: parseInt("{{ session.get('user_id', 0) }}", 10),
                funcionario_id: parseInt("{{ session.get('user_id', 0) }}", 10),
                texto_dieta: texto_dieta || null,
                texto_procedimento_medico: texto_procedimento_medico || null,
                texto_procedimento_multi: texto_procedimento_multi || null,
                horario_prescricao: horarioBrasil,
                medicamentos: medicamentosAdicionados
            };
            
            // Log para debug
            console.log('Dados da prescrição:', dados);
            
            if (!dados.atendimentos_clinica_id) {
                alert('Erro: ID da internação inválido.');
                return;
            }
            
            // URL e método dependem se é edição ou nova prescrição
            const url = isEdicao ? `/api/prescricoes/${prescricaoId}` : '/api/prescricoes';
            const method = isEdicao ? 'PUT' : 'POST';
            
            // Mostrar indicador de carregamento
            const btnSubmit = $(this).find('button[type="submit"]');
            const textoOriginal = btnSubmit.html();
            btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
            btnSubmit.prop('disabled', true);
            
            $.ajax({
                url: url,
                method: method,
                contentType: 'application/json',
                data: JSON.stringify(dados),
                success: function(response) {
                    // Restaurar botão
                    btnSubmit.html(textoOriginal);
                    btnSubmit.prop('disabled', false);
                    
                    if (response.success) {
                        // Fechar modal e limpar campos
                        $('#modalPrescricao').modal('hide');
                        limparFormularioPrescricao();
                        
                        // Recarregar lista de prescrições
                        carregarPrescricoes();
                        
                        // Mostrar mensagem de sucesso
                        alert(isEdicao ? 'Prescrição atualizada com sucesso!' : 'Prescrição registrada com sucesso!');
                    } else {
                        alert('Erro ao registrar prescrição: ' + (response.message || 'Erro desconhecido'));
                    }
                },
                error: function(xhr, status, error) {
                    // Restaurar botão
                    btnSubmit.html(textoOriginal);
                    btnSubmit.prop('disabled', false);
                    
                    console.error('Erro ao registrar prescrição:', xhr.responseText);
                    alert('Erro de comunicação ao tentar registrar prescrição: ' + (xhr.responseJSON?.error || error));
                }
            });
        });
        
        // Submissão do formulário de evolução
        $('#formEvolucao').on('submit', function(e) {
            e.preventDefault();
            
            // Obter o conteúdo do editor
            let evolucaoHTML;
            if (quill) {
                evolucaoHTML = quill.root.innerHTML;
            } else if ($('#fallback-editor').length > 0) {
                evolucaoHTML = $('#fallback-editor').val();
            } else {
                evolucaoHTML = $('#texto_evolucao').val();
            }
            
            if (!evolucaoHTML || evolucaoHTML.trim() === '' || evolucaoHTML === '<p><br></p>') {
                alert('Por favor, preencha o texto da evolução.');
                return;
            }
            
            // Mostrar indicador de carregamento
            const btnSubmit = $(this).find('button[type="submit"]');
            const textoOriginal = btnSubmit.html();
            btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
            btnSubmit.prop('disabled', true);
            
            // Preparar dados para envio
            const dados = {
                atendimentos_clinica_id: internacaoId,
                funcionario_id: parseInt("{{ session.get('user_id', 0) }}", 10),
                evolucao: evolucaoHTML,
                data_evolucao: new Date().toISOString(),
                tipo: 'medica'
            };
            
            // Log para debug
            console.log('Dados da evolução:', dados);
            
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
                        
                        // Limpar o editor Quill
                        if (quill) {
                            quill.setText('');
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
        });

        // Carregar dados ao iniciar
        carregarPrescricoes();
        carregarEvolucoes();
        
        // Carregar evoluções de enfermagem
        carregarEvolucoesEnfermagem();
        
        // Carregar prescrições de enfermagem
        carregarPrescricoesEnfermagem();
        
        // Configurar toggles para mostrar/ocultar evoluções e prescrições antigas
        $('#toggle-evolucoes-antigas').on('click', function() {
            const container = $('#antigas-container');
            const toggleText = $('#toggle-evolucoes-text');
            const toggleIcon = $(this).find('i');
            
            if (container.is(':visible')) {
                container.hide();
                toggleText.text('Mostrar Antigas');
                toggleIcon.removeClass('fa-eye-slash').addClass('fa-eye');
            } else {
                container.show();
                toggleText.text('Ocultar Antigas');
                toggleIcon.removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });
        
        $('#toggle-prescricoes-antigas').on('click', function() {
            const container = $('#antigas-container-prescricao');
            if (container.is(':visible')) {
                container.hide();
                $('#toggle-prescricoes-text').text('Mostrar Antigas');
                $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
            } else {
                container.show();
                $('#toggle-prescricoes-text').text('Ocultar Antigas');
                $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });
        
        // Funções para carregar dados de enfermagem
        function carregarEvolucoesEnfermagem() {
            $.ajax({
                url: `/api/enfermagem/evolucao/${internacaoId}`,
                method: 'GET',
                success: function(response) {
                    // Separar evoluções de hoje e anteriores
                    const hoje = new Date().toISOString().split('T')[0];
                    const evolucoesDoDia = [];
                    const evolucoesAntigas = [];
                    
                    if (Array.isArray(response)) {
                        response.forEach(ev => {
                            const dataEvolucao = new Date(ev.data_evolucao).toISOString().split('T')[0];
                            if (dataEvolucao === hoje) {
                                evolucoesDoDia.push(ev);
                            } else {
                                evolucoesAntigas.push(ev);
                            }
                        });
                        
                        // Atualizar contador
                        $('#contador-evolucoes-antigas').text(evolucoesAntigas.length);
                        
                        // Renderizar evoluções do dia
                        if (evolucoesDoDia.length > 0) {
                            let htmlDoDia = '';
                            evolucoesDoDia.forEach(ev => {
                                const hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
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
                            $('#listaEvolucoesDoDia').html(htmlDoDia);
                        } else {
                            $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada hoje.</td></tr>');
                        }
                        
                        // Renderizar evoluções antigas
                        if (evolucoesAntigas.length > 0) {
                            let htmlAntigas = '';
                            evolucoesAntigas.forEach(ev => {
                                const dataFormatada = new Date(ev.data_evolucao).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                });
                                const hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
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
                            $('#listaEvolucoesAntigas').html(htmlAntigas);
                            
                            // Inicialmente ocultar o container de evoluções antigas
                            $('#antigas-container').hide();
                            $('#toggle-evolucoes-text').text('Mostrar Antigas');
                            $('#toggle-evolucoes-antigas').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
                        } else {
                            $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                        }
                    } else {
                        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada hoje.</td></tr>');
                        $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao carregar evoluções de enfermagem:', xhr.responseText);
                    $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
                    $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
                }
            });
        }
        
        function carregarPrescricoesEnfermagem() {
            $.ajax({
                url: `/api/enfermagem/prescricao/${internacaoId}`,
                method: 'GET',
                success: function(response) {
                    // Separar prescrições de hoje e antigas
                    const hoje = new Date().toLocaleDateString('pt-BR');
                    const prescricoesHoje = [];
                    const prescricoesAntigas = [];
                    
                    if (Array.isArray(response)) {
                        response.forEach(prescricao => {
                            const dataPrescricao = new Date(prescricao.data_prescricao).toLocaleDateString('pt-BR');
                            if (dataPrescricao === hoje) {
                                prescricoesHoje.push(prescricao);
                            } else {
                                prescricoesAntigas.push(prescricao);
                            }
                        });
                    }
                    
                    // Renderizar prescrições de enfermagem de hoje
                    if (prescricoesHoje.length > 0) {
                        let htmlHoje = '';
                        prescricoesHoje.forEach(presc => {
                            const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            htmlHoje += `
                                <div class="prescricao-container">
                                    <div class="prescricao-header">
                                        <div class="enfermeiro-info">Enf. ${presc.enfermeiro_nome || 'Não informado'}</div>
                                        <div class="timestamp">${hora}</div>
                                    </div>
                                    <div class="prescricao-section">
                                        <div class="prescricao-section-content">
                                            ${presc.texto || '---'}
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        $('#listaPrescricoesEnfermagemDoDia').html(htmlHoje);
                    } else {
                        $('#listaPrescricoesEnfermagemDoDia').html('<div class="alert alert-info">Nenhuma prescrição de enfermagem registrada hoje.</div>');
                    }
                    
                    // Renderizar prescrições de enfermagem antigas
                    if (prescricoesAntigas.length > 0) {
                        let htmlAntigas = '';
                        prescricoesAntigas.forEach(presc => {
                            const dataFormatada = new Date(presc.data_prescricao).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            });
                            const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            htmlAntigas += `
                                <div class="prescricao-container">
                                    <div class="prescricao-header">
                                        <div class="enfermeiro-info">Enf. ${presc.enfermeiro_nome || 'Não informado'}</div>
                                        <div class="timestamp">${dataFormatada} ${hora}</div>
                                    </div>
                                    <div class="prescricao-section">
                                        <div class="prescricao-section-content">
                                            ${presc.texto || '---'}
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        $('#listaPrescricoesEnfermagemAntigas').html(htmlAntigas);
                        $('#contador-prescricoes-enfermagem-antigas').text(prescricoesAntigas.length);
                    } else {
                        $('#listaPrescricoesEnfermagemAntigas').html('<div class="alert alert-info">Nenhuma prescrição de enfermagem anterior registrada.</div>');
                        $('#contador-prescricoes-enfermagem-antigas').text('0');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao carregar prescrições de enfermagem:', error);
                    $('#listaPrescricoesEnfermagemDoDia').html('<div class="alert alert-danger">Erro ao carregar prescrições de enfermagem.</div>');
                    $('#listaPrescricoesEnfermagemAntigas').html('<div class="alert alert-danger">Erro ao carregar prescrições de enfermagem.</div>');
                }
            });
        }
        
        // Carregar dados da SAE
        const pacienteId = parseInt("{{ paciente.id }}", 10);
        $.ajax({
            url: `/api/enfermagem/sae/${pacienteId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.sae) {
                    const sae = response.sae;
                    
                    // Montar a visualização da SAE
                    let html = `
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div><strong>Data do Registro:</strong> ${new Date(sae.data_registro).toLocaleDateString('pt-BR')}</div>
                                    <div><span class="badge ${sae.eh_hoje ? 'bg-success' : 'bg-secondary'}">
                                        ${sae.eh_hoje ? 'Hoje' : 'Registro Anterior'}
                                    </span></div>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <h6 class="text-primary mb-2">Sinais Vitais</h6>
                                        <div class="row g-2">
                                            <div class="col-md-2"><strong>PA:</strong> ${sae.pa}</div>
                                            <div class="col-md-2"><strong>FC:</strong> ${sae.fc}</div>
                                            <div class="col-md-2"><strong>SAT:</strong> ${sae.sat}</div>
                                            <div class="col-md-2"><strong>R:</strong> ${sae.r}</div>
                                            <div class="col-md-2"><strong>T:</strong> ${sae.t}</div>
                                            <div class="col-md-2"><strong>Pulso:</strong> ${sae.pulso}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <h6 class="text-primary mb-2">Hipótese Diagnóstica</h6>
                                        <div class="p-2 bg-light rounded">${sae.hipotese_diagnostica}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-primary mb-2">DX</h6>
                                        <div class="p-2 bg-light rounded">${sae.dx}</div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <h6 class="text-primary mb-2">Medicação</h6>
                                        <div class="p-2 bg-light rounded">${sae.medicacao}</div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <h6 class="text-primary mb-2">Alergias</h6>
                                        <div class="p-2 bg-light rounded">${sae.alergias}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-primary mb-2">Antecedentes Pessoais</h6>
                                        <div class="p-2 bg-light rounded">${sae.antecedentes_pessoais}</div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <h6 class="text-primary mb-2">Diagnóstico de Enfermagem</h6>
                                        <div class="p-2 bg-light rounded">${sae.diagnostico_de_enfermagem}</div>
                                    </div>
                                </div>
                                
                                <div class="accordion" id="accordionSAE">
                                    <div class="accordion-item">
                                        <h2 class="accordion-header">
                                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDetalhes">
                                                Ver mais detalhes da SAE
                                            </button>
                                        </h2>
                                        <div id="collapseDetalhes" class="accordion-collapse collapse">
                                            <div class="accordion-body">
                                                <div class="row mb-3">
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Sistema Neurológico</h6>
                                                        <div class="p-2 bg-light rounded">${sae.sistema_neurologico}</div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Estado Geral</h6>
                                                        <div class="p-2 bg-light rounded">${sae.estado_geral}</div>
                                                    </div>
                                                </div>
                                                <div class="row mb-3">
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Ventilação</h6>
                                                        <div class="p-2 bg-light rounded">${sae.ventilacao}</div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6 class="text-primary mb-2">Pele</h6>
                                                        <div class="p-2 bg-light rounded">${sae.pele}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    $('#listaSAE').html(html);
                } else {
                    $('#listaSAE').html('<div class="alert alert-info">Nenhum registro SAE encontrado para este paciente.</div>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao carregar SAE:', xhr.responseText);
                
                // Se o erro for de permissão (403), tentar buscar pelo histórico SAE
                if (xhr.status === 403) {
                    // Mostrar mensagem informativa
                    $('#listaSAE').html('<div class="alert alert-info">Acessando histórico de SAE...</div>');
                    
                    // Chamar diretamente a API de histórico SAE
                    const pacienteId = parseInt("{{ paciente.id }}", 10);
                    $.ajax({
                        url: `/api/enfermagem/sae/historico/${pacienteId}`,
                        method: 'GET',
                        success: function(response) {
                            if (response.success && response.sae && response.sae.length > 0) {
                                // Mostrar o primeiro registro como principal
                                const maisRecente = response.sae.sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))[0];
                                let htmlPrincipal = `
                                    <div class="card mb-3">
                                        <div class="card-header bg-light">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div><strong>Data do Registro:</strong> ${new Date(maisRecente.data_registro).toLocaleDateString('pt-BR')}</div>
                                                <div><span class="badge bg-secondary">Via Histórico SAE</span></div>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row mb-3">
                                                <div class="col-md-12">
                                                    <h6 class="text-primary mb-2">Sinais Vitais</h6>
                                                    <div class="row g-2">
                                                        <div class="col-md-2"><strong>PA:</strong> ${maisRecente.pa}</div>
                                                        <div class="col-md-2"><strong>FC:</strong> ${maisRecente.fc}</div>
                                                        <div class="col-md-2"><strong>SAT:</strong> ${maisRecente.sat}</div>
                                                        <div class="col-md-2"><strong>R:</strong> ${maisRecente.r}</div>
                                                        <div class="col-md-2"><strong>T:</strong> ${maisRecente.t}</div>
                                                        <div class="col-md-2"><strong>Pulso:</strong> ${maisRecente.pulso}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row mb-3">
                                                <div class="col-md-6">
                                                    <h6 class="text-primary mb-2">Hipótese Diagnóstica</h6>
                                                    <div class="p-2 bg-light rounded">${maisRecente.hipotese_diagnostica}</div>
                                                </div>
                                                <div class="col-md-6">
                                                    <h6 class="text-primary mb-2">DX</h6>
                                                    <div class="p-2 bg-light rounded">${maisRecente.dx}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="row mb-3">
                                                <div class="col-md-12">
                                                    <h6 class="text-primary mb-2">Medicação</h6>
                                                    <div class="p-2 bg-light rounded">${maisRecente.medicacao}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="row mb-3">
                                                <div class="col-md-6">
                                                    <h6 class="text-primary mb-2">Alergias</h6>
                                                    <div class="p-2 bg-light rounded">${maisRecente.alergias}</div>
                                                </div>
                                                <div class="col-md-6">
                                                    <h6 class="text-primary mb-2">Antecedentes Pessoais</h6>
                                                    <div class="p-2 bg-light rounded">${maisRecente.antecedentes_pessoais}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="row mb-3">
                                                <div class="col-md-12">
                                                    <h6 class="text-primary mb-2">Diagnóstico de Enfermagem</h6>
                                                    <div class="p-2 bg-light rounded">${maisRecente.diagnostico_de_enfermagem}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="accordion" id="accordionSAE">
                                                <div class="accordion-item">
                                                    <h2 class="accordion-header">
                                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDetalhes">
                                                            Ver mais detalhes da SAE
                                                        </button>
                                                    </h2>
                                                    <div id="collapseDetalhes" class="accordion-collapse collapse">
                                                        <div class="accordion-body">
                                                            <div class="row mb-3">
                                                                <div class="col-md-6">
                                                                    <h6 class="text-primary mb-2">Sistema Neurológico</h6>
                                                                    <div class="p-2 bg-light rounded">${maisRecente.sistema_neurologico}</div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <h6 class="text-primary mb-2">Estado Geral</h6>
                                                                    <div class="p-2 bg-light rounded">${maisRecente.estado_geral}</div>
                                                                </div>
                                                            </div>
                                                            <div class="row mb-3">
                                                                <div class="col-md-6">
                                                                    <h6 class="text-primary mb-2">Ventilação</h6>
                                                                    <div class="p-2 bg-light rounded">${maisRecente.ventilacao}</div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <h6 class="text-primary mb-2">Pele</h6>
                                                                    <div class="p-2 bg-light rounded">${maisRecente.pele}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                
                                // Atualizar view principal
                                $('#listaSAE').html(htmlPrincipal);
                                
                                // Mostrar o histórico automaticamente
                                $('#historicoSAE').show();
                                $('#btn-historico-sae').html('<i class="fas fa-times"></i> Ocultar Histórico');
                                
                                // Carregar resto do histórico normalmente
                                carregarHistoricoSAE();
                            } else {
                                $('#listaSAE').html('<div class="alert alert-info">Nenhum registro SAE encontrado para este paciente.</div>');
                            }
                        },
                        error: function() {
                            $('#listaSAE').html('<div class="alert alert-info">Não foi possível acessar os dados de SAE.</div>');
                        }
                    });
                } else {
                    // Mostrar mensagem genérica para outros erros
                    $('#listaSAE').html('<div class="alert alert-info">Nenhum registro SAE disponível para este paciente.</div>');
                }
            }
        });

        // Adicionar funções para filtrar evoluções e prescrições por data
        
        // Configurar filtros
        $('#btn-filtrar-data').on('click', function() {
            const dataFiltro = $('#filtro-data').val();
            filtrarEvolucoesEnfermagemPorData(dataFiltro);
        });
        
        $('#btn-limpar-filtro').on('click', function() {
            $('#filtro-data').val('');
            carregarEvolucoesEnfermagem();
        });
        
        $('#btn-filtrar-data-prescricao').on('click', function() {
            const dataFiltro = $('#filtro-data-prescricao').val();
            filtrarPrescricoesEnfermagemPorData(dataFiltro);
        });
        
        $('#btn-limpar-filtro-prescricao').on('click', function() {
            $('#filtro-data-prescricao').val('');
            carregarPrescricoesEnfermagem();
        });
        
        // Configurar toggles para mostrar/ocultar evoluções e prescrições antigas
        $('#toggle-evolucoes-antigas').on('click', function() {
            const container = $('#antigas-container');
            const toggleText = $('#toggle-evolucoes-text');
            const toggleIcon = $(this).find('i');
            
            if (container.is(':visible')) {
                container.hide();
                toggleText.text('Mostrar Antigas');
                toggleIcon.removeClass('fa-eye-slash').addClass('fa-eye');
            } else {
                container.show();
                toggleText.text('Ocultar Antigas');
                toggleIcon.removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });
        
        $('#toggle-prescricoes-antigas').on('click', function() {
            const container = $('#antigas-container-prescricao');
            if (container.is(':visible')) {
                container.hide();
                $('#toggle-prescricoes-text').text('Mostrar Antigas');
                $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
            } else {
                container.show();
                $('#toggle-prescricoes-text').text('Ocultar Antigas');
                $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });
        
        // Configurar botão para mostrar histórico SAE
        $('#btn-historico-sae').on('click', function() {
            const historicoContainer = $('#historicoSAE');
            if (historicoContainer.is(':visible')) {
                historicoContainer.hide();
                $(this).html('<i class="fas fa-history"></i> Ver Histórico');
            } else {
                carregarHistoricoSAE();
                historicoContainer.show();
                $(this).html('<i class="fas fa-times"></i> Ocultar Histórico');
            }
        });
    });
    
    // Função para filtrar evoluções de enfermagem por data
    function filtrarEvolucoesEnfermagemPorData(dataFiltro) {
        if (!dataFiltro) {
            carregarEvolucoesEnfermagem();
            return;
        }
        
        $('#titulo-evolucoes-hoje').text(`Evoluções de ${dataFiltro.split('-').reverse().join('/')}`);
        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Carregando evoluções...</td></tr>');
        $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Dados não disponíveis com filtro ativo</td></tr>');
        
        $.ajax({
            url: `/api/enfermagem/evolucao/${internacaoId}`,
            method: 'GET',
            success: function(response) {
                // Filtrar evoluções pela data especificada
                const evolucoesFiltradas = [];
                
                if (Array.isArray(response)) {
                    response.forEach(ev => {
                        const dataEvolucao = new Date(ev.data_evolucao).toISOString().split('T')[0];
                        if (dataEvolucao === dataFiltro) {
                            evolucoesFiltradas.push(ev);
                        }
                    });
                    
                    // Renderizar evoluções filtradas
                    if (evolucoesFiltradas.length > 0) {
                        let htmlFiltradas = '';
                        evolucoesFiltradas.forEach(ev => {
                            const hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            htmlFiltradas += `
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
                        $('#listaEvolucoesDoDia').html(htmlFiltradas);
                    } else {
                        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução encontrada nesta data.</td></tr>');
                    }
                } else {
                    $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução encontrada.</td></tr>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao filtrar evoluções de enfermagem:', xhr.responseText);
                $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
            }
        });
    }
    
    // Função para filtrar prescrições de enfermagem por data
    function filtrarPrescricoesEnfermagemPorData(dataFiltro) {
        if (!dataFiltro) {
            carregarPrescricoesEnfermagem();
            return;
        }
        
        $('#titulo-prescricoes-hoje').text(`Prescrições de ${dataFiltro.split('-').reverse().join('/')}`);
        $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Carregando prescrições...</td></tr>');
        $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Dados não disponíveis com filtro ativo</td></tr>');
        
        $.ajax({
            url: `/api/medico/prescricoes-enfermagem/${internacaoId}`,
            method: 'GET',
            success: function(response) {
                // Filtrar prescrições pela data especificada
                const prescricoesFiltradas = [];
                
                if (response.success && response.prescricoes && response.prescricoes.length > 0) {
                    response.prescricoes.forEach(presc => {
                        const dataPrescricao = new Date(presc.data_prescricao).toISOString().split('T')[0];
                        if (dataPrescricao === dataFiltro) {
                            prescricoesFiltradas.push(presc);
                        }
                    });
                    
                    // Renderizar prescrições filtradas
                    if (prescricoesFiltradas.length > 0) {
                        let htmlFiltradas = '';
                        prescricoesFiltradas.forEach(presc => {
                            const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            htmlFiltradas += `
                                <tr>
                                    <td>${hora}</td>
                                    <td>${presc.enfermeiro_nome || 'Não informado'}</td>
                                    <td>
                                        <div class="texto-evolucao">
                                            ${presc.texto || '---'}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        });
                        $('#listaPrescricoesDoDia').html(htmlFiltradas);
                    } else {
                        $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada nesta data.</td></tr>');
                    }
                } else {
                    $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada.</td></tr>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao filtrar prescrições de enfermagem:', xhr.responseText);
                $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições.</td></tr>');
            }
        });
    }
    
    // Função para carregar dados da SAE
    function carregarHistoricoSAE() {
        const pacienteId = parseInt("{{ paciente.id }}", 10);
        $('#listaHistoricoSAE').html('<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando histórico completo...</p>');
        
        $.ajax({
            url: `/api/enfermagem/sae/historico/${pacienteId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.sae && response.sae.length > 0) {
                    let html = '';
                    
                    // Ordenar por data (mais recente primeiro)
                    const saeOrdenado = response.sae.sort((a, b) => {
                        return new Date(b.data_registro) - new Date(a.data_registro);
                    });
                    
                    // Processar cada registro SAE
                    saeOrdenado.forEach((sae, index) => {
                        // Pular o primeiro registro se o histórico estiver sendo exibido junto com o registro atual
                        if (index === 0 && $('#listaSAE').html().includes(new Date(sae.data_registro).toLocaleDateString('pt-BR'))) {
                            return;
                        }
                        
                        const dataRegistro = new Date(sae.data_registro);
                        
                        html += `
                            <div class="card mb-3 border-secondary">
                                <div class="card-header bg-light">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div><strong>Data do Registro:</strong> ${dataRegistro.toLocaleDateString('pt-BR')}</div>
                                        <div>
                                            <span class="badge bg-secondary">Registro Anterior</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="accordion" id="accordionSAE${index}">
                                        <div class="accordion-item">
                                            <h2 class="accordion-header">
                                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSAE${index}">
                                                    Ver detalhes deste registro SAE
                                                </button>
                                            </h2>
                                            <div id="collapseSAE${index}" class="accordion-collapse collapse">
                                                <div class="accordion-body">
                                                    <div class="row mb-3">
                                                        <div class="col-md-12">
                                                            <h6 class="text-primary mb-2">Sinais Vitais</h6>
                                                            <div class="row g-2">
                                                                <div class="col-md-2"><strong>PA:</strong> ${sae.pa}</div>
                                                                <div class="col-md-2"><strong>FC:</strong> ${sae.fc}</div>
                                                                <div class="col-md-2"><strong>SAT:</strong> ${sae.sat}</div>
                                                                <div class="col-md-2"><strong>R:</strong> ${sae.r}</div>
                                                                <div class="col-md-2"><strong>T:</strong> ${sae.t}</div>
                                                                <div class="col-md-2"><strong>Pulso:</strong> ${sae.pulso}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="row mb-3">
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">Hipótese Diagnóstica</h6>
                                                            <div class="p-2 bg-light rounded">${sae.hipotese_diagnostica}</div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">DX</h6>
                                                            <div class="p-2 bg-light rounded">${sae.dx}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="row mb-3">
                                                        <div class="col-md-12">
                                                            <h6 class="text-primary mb-2">Medicação</h6>
                                                            <div class="p-2 bg-light rounded">${sae.medicacao}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="row mb-3">
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">Alergias</h6>
                                                            <div class="p-2 bg-light rounded">${sae.alergias}</div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">Antecedentes Pessoais</h6>
                                                            <div class="p-2 bg-light rounded">${sae.antecedentes_pessoais}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="row mb-3">
                                                        <div class="col-md-12">
                                                            <h6 class="text-primary mb-2">Diagnóstico de Enfermagem</h6>
                                                            <div class="p-2 bg-light rounded">${sae.diagnostico_de_enfermagem}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="row mb-3">
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">Sistema Neurológico</h6>
                                                            <div class="p-2 bg-light rounded">${sae.sistema_neurologico}</div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">Estado Geral</h6>
                                                            <div class="p-2 bg-light rounded">${sae.estado_geral}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="row mb-3">
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">Ventilação</h6>
                                                            <div class="p-2 bg-light rounded">${sae.ventilacao}</div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <h6 class="text-primary mb-2">Pele</h6>
                                                            <div class="p-2 bg-light rounded">${sae.pele}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    if (html === '') {
                        $('#listaHistoricoSAE').html('<div class="alert alert-info">Não há registros SAE adicionais para este paciente.</div>');
                    } else {
                        $('#listaHistoricoSAE').html(html);
                    }
                } else {
                    $('#listaHistoricoSAE').html('<div class="alert alert-info">Nenhum registro SAE anterior encontrado para este paciente.</div>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao carregar histórico SAE:', xhr.responseText);
                // Mostrar mensagem genérica em vez da mensagem de erro específica
                $('#listaHistoricoSAE').html('<div class="alert alert-info">Nenhum histórico de SAE disponível para este paciente.</div>');
            }
        });
    }
    
    // Adicionar evento para o botão de visualização de aprazamento
    $(document).on('click', '.btn-visualizar-aprazamento', function(e) {
        e.preventDefault();
        
        try {
            // Obter dados do botão
            const aprazamento = $(this).data('aprazamento');
            const medicamento = $(this).data('medicamento');
            
            console.log('Visualizando aprazamento para:', medicamento);
            
            if (!aprazamento) {
                alert('Não há horários de aprazamento definidos para este medicamento.');
                return;
            }
            
            // Verificar se o formato já é válido
            let textoFormatado = corrigirFormatoAprazamento(aprazamento);
            
            // Log para diagnóstico
            console.log('Formato corrigido do aprazamento:', textoFormatado);
            
            // Verificar se o formato está válido
            if (!textoFormatado || !textoFormatado.match(/\d{2}\/\d{2}\/\d{4}: \d{2}:\d{2}/)) {
                alert('Não foi possível identificar datas e horários no formato esperado.\n\nUse o formato: DD/MM/YYYY: HH:MM, HH:MM');
                console.error('Formato inválido após correção:', textoFormatado);
                return;
            }
            
            // Formatar o título do modal
            const titulo = medicamento ? 
                medicamento : 
                'Horários';
                
            // Inicializar o modal com os dados formatados
            inicializarModalCalendarioAprazamento(textoFormatado, titulo);
            
            // Log para depuração
            console.log('Texto formatado para visualização:', textoFormatado);
        } catch (error) {
            console.error('Erro ao inicializar visualização de aprazamento:', error);
            alert('Ocorreu um erro ao tentar visualizar o calendário. Por favor, tente novamente.');
        }
    });
    
    // Função para corrigir o formato do aprazamento
    function corrigirFormatoAprazamento(textoOriginal) {
        console.log('Corrigindo formato do aprazamento:', textoOriginal);
        
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
            
        // Separa as diferentes datas (formato esperado: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM")
        const secoes = texto.split(';').filter(s => s.trim());
        
        if (secoes.length === 0) {
            console.warn('Nenhuma seção válida encontrada no texto:', texto);
            return "";
        }
        
        // Processar cada seção para garantir o formato correto
        const secoesFormatadas = secoes.map(secao => {
            secao = secao.trim();
            
            // Verificar se a seção tem uma data e horários
            const match = secao.match(/(\d{2})\/(\d{2})\/(\d{4})[^0-9]*(.+)/);
            if (!match) {
                console.warn('Seção não corresponde ao padrão esperado:', secao);
                return null;
            }
            
            const [_, dia, mes, ano, resto] = match;
            
            // Extrair os horários - Comportamento especial para formato com espaço entre horas e minutos "HH: MM"
            // Primeiro, substituir "hh: mm" por "hh:mm" para normalizar
            let restoCorrigido = resto.replace(/(\d{2})\s*:\s*(\d{2})/g, '$1:$2');
            
            // Agora extrair horários normalmente
            const matchHorarios = restoCorrigido.match(/(\d{2}:\d{2})/g);
            
            if (matchHorarios && matchHorarios.length > 0) {
                const horarios = matchHorarios;
                
                // Formatar corretamente: DD/MM/YYYY: HH:MM, HH:MM
                return `${dia}/${mes}/${ano}: ${horarios.join(', ')}`;
            } else {
                console.warn('Não foi possível extrair horários da seção:', secao);
                
                // Tentar uma abordagem alternativa para horários no formato "hh: mm"
                // Este é um formato incorreto mas pode estar aparecendo nos dados
                const formatoAlternativo = resto.match(/(\d{2})\s*:\s*(\d{2})/g);
                if (formatoAlternativo && formatoAlternativo.length > 0) {
                    // Normalizar o formato dos horários encontrados
                    const horariosCorrigidos = formatoAlternativo.map(h => {
                        const [hora, minuto] = h.replace(/\s+/g, '').split(':');
                        return `${hora}:${minuto}`;
                    });
                    
                    return `${dia}/${mes}/${ano}: ${horariosCorrigidos.join(', ')}`;
                }
                
                return null;
            }
        }).filter(s => s !== null);
        
        if (secoesFormatadas.length === 0) {
            console.warn('Nenhuma seção pôde ser formatada corretamente');
            return "";
        }
        
        // Juntar as seções no formato final
        return secoesFormatadas.join('; ');
    }
    
    // Função para inicializar o modal de calendário de aprazamento
    function inicializarModalCalendarioAprazamento(textoAprazamento, titulo) {
        // Verificar se o modal já existe, caso contrário criar
        if ($('#modalCalendarioAprazamento').length === 0) {
            // Criar o modal e adicionar ao corpo do documento
            const htmlModal = `
                <div class="modal fade" id="modalCalendarioAprazamento" tabindex="-1" aria-labelledby="modalCalendarioAprazamentoLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title" id="modalCalendarioAprazamentoLabel">Calendário de Aprazamento</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <div id="conteudoCalendarioAprazamento">
                                    <div class="text-center">
                                        <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                                        <p>Carregando horários...</p>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(htmlModal);
        }
        
        // Atualizar o título do modal
        $('#modalCalendarioAprazamentoLabel').text('Calendário de Aprazamento: ' + titulo);
        
        // Processar os dados e gerar o HTML do calendário
        const calendario = gerarHTMLCalendarioAprazamento(textoAprazamento);
        
        // Atualizar o conteúdo do modal
        $('#conteudoCalendarioAprazamento').html(calendario);
        
        // Abrir o modal
        const modalCalendario = new bootstrap.Modal(document.getElementById('modalCalendarioAprazamento'));
        modalCalendario.show();
    }
    
    // Função para gerar o HTML do calendário
    function gerarHTMLCalendarioAprazamento(textoAprazamento) {
        console.log('Gerando HTML do calendário para:', textoAprazamento);
        
        if (!textoAprazamento) {
            return '<div class="alert alert-warning">Nenhum horário de aprazamento encontrado.</div>';
        }
        
        // Separar os horários por data
        const datasAprazamento = {};
        
        // Processar cada linha com o formato "DD/MM/YYYY: HH:MM, HH:MM"
        textoAprazamento.split(';').forEach(linha => {
            linha = linha.trim();
            if (!linha) return;
            
            // Extrair a data e os horários
            const partes = linha.split(':');
            if (partes.length < 2) {
                console.warn('Formato inválido na linha:', linha);
                return;
            }
            
            const data = partes[0].trim();
            const horarios = partes.slice(1).join(':').split(',').map(h => h.trim());
            
            // Adicionar ao objeto agrupado por data
            if (!datasAprazamento[data]) {
                datasAprazamento[data] = [];
            }
            
            // Adicionar cada horário à data correspondente
            horarios.forEach(horario => {
                if (horario && horario.match(/\d{2}:\d{2}/)) {
                    datasAprazamento[data].push(horario);
                }
            });
        });
        
        // Ordenar as datas
        const datasOrdenadas = Object.keys(datasAprazamento).sort((a, b) => {
            // Converter para o formato de data (assumindo DD/MM/YYYY)
            const [diaA, mesA, anoA] = a.split('/').map(n => parseInt(n, 10));
            const [diaB, mesB, anoB] = b.split('/').map(n => parseInt(n, 10));
            
            // Criar objetos Date para comparação
            const dataA = new Date(anoA, mesA - 1, diaA);
            const dataB = new Date(anoB, mesB - 1, diaB);
            
            return dataA - dataB;
        });
        
        // Verificar se há datas para exibir
        if (datasOrdenadas.length === 0) {
            return '<div class="alert alert-warning">Não foi possível interpretar os horários de aprazamento. Formato esperado: DD/MM/YYYY: HH:MM, HH:MM</div>';
        }
        
        // Gerar o HTML do calendário
        let html = '<div class="calendario-aprazamento">';
        
        // Adicionar cada data com seus horários
        datasOrdenadas.forEach(data => {
            // Converter a data para um objeto Date
            const [dia, mes, ano] = data.split('/').map(n => parseInt(n, 10));
            const objData = new Date(ano, mes - 1, dia);
            
            // Formatar a data de forma mais legível
            const dataFormatada = objData.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
            
            // Verificar se a data é hoje
            const hoje = new Date();
            const ehHoje = objData.getDate() === hoje.getDate() && 
                          objData.getMonth() === hoje.getMonth() && 
                          objData.getFullYear() === hoje.getFullYear();
            
            // Estilo especial para a data de hoje
            const classeHoje = ehHoje ? 'bg-info text-white' : 'bg-light';
            const badgeHoje = ehHoje ? '<span class="badge bg-primary ms-2">Hoje</span>' : '';
            
            html += `
                <div class="card mb-3">
                    <div class="card-header ${classeHoje}">
                        <strong>${dataFormatada}</strong>${badgeHoje}
                    </div>
                    <div class="card-body">
                        <div class="d-flex flex-wrap">
            `;
            
            // Ordenar os horários
            const horariosOrdenados = [...datasAprazamento[data]].sort();
            
            // Adicionar cada horário como um "pill"
            horariosOrdenados.forEach(horario => {
                // Verificar se o horário já passou
                const [hora, minuto] = horario.split(':').map(n => parseInt(n, 10));
                const dataHora = new Date(ano, mes - 1, dia, hora, minuto);
                const passou = dataHora < new Date();
                
                // Definir a classe baseada em se o horário já passou
                const classePill = passou ? 'bg-secondary' : 'bg-success';
                
                html += `<span class="badge ${classePill} me-2 mb-2 p-2">${horario}</span>`;
            });
            
            html += `
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        return html;
    }

    // Adicionar manipulador para o formulário de HDA
    $('#formHDA').on('submit', function(e) {
        e.preventDefault();
        
        const hdaTexto = $('#textoHDA').val().trim();
        
        if (!hdaTexto) {
            alert('Por favor, preencha a História da Doença Atual.');
            return;
        }
        
        // Mostrar indicador de carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
        btnSubmit.prop('disabled', true);
        
        // Preparar dados para envio
        const dados = {
            atendimentos_clinica_id: internacaoId,
            hda: hdaTexto
        };
        
        console.log('Enviando dados para atualizar HDA:', dados);
        
        // Enviar requisição para atualizar HDA
        $.ajax({
            url: '/api/internacao/atualizar-hda',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function(response) {
                console.log('Resposta do servidor:', response);
                
                if (response.success) {
                    // Atualizar o texto na tela
                    $('#hdaTexto').val(hdaTexto);
                    
                    // Fechar o modal
                    $('#modalEditarHDA').modal('hide');
                    
                    // Mostrar mensagem de sucesso em um toast ou alert pequeno
                    const alertHtml = `
                        <div class="alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index: 1060">
                            História da Doença Atual atualizada com sucesso!
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                    $('body').append(alertHtml);
                    
                    // Remover o alerta após 3 segundos
                    setTimeout(function() {
                        $('.alert').alert('close');
                    }, 3000);
                } else {
                    alert('Erro ao atualizar HDA: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao atualizar HDA:', xhr.responseText);
                alert('Erro ao atualizar HDA: ' + (xhr.responseJSON?.error || error));
            },
            complete: function() {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
            }
        });
    });

    function renderizarPrescricao(prescricao) {
        let html = `
            <div class="prescricao-container">
                <div class="prescricao-header">
                    <div class="medico-info">Dr(a). ${prescricao.medico_nome}</div>
                    <div class="timestamp">${prescricao.data_prescricao}</div>
                </div>
                
                ${prescricao.texto_dieta ? `
                    <div class="prescricao-section dieta">
                        <div class="prescricao-section-title">Dieta</div>
                        <div class="prescricao-section-content">${prescricao.texto_dieta}</div>
                    </div>
                ` : ''}
                
                ${prescricao.medicamentos && prescricao.medicamentos.length > 0 ? `
                    <div class="prescricao-section medicamentos">
                        <div class="prescricao-section-title">Medicamentos</div>
                        <div class="prescricao-section-content">
                            <table class="table table-sm table-hover tabela-medicamentos-prescricao">
                                <thead>
                                    <tr>
                                        <th>Medicamento</th>
                                        <th>Descrição</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${prescricao.medicamentos.map(med => `
                                        <tr>
                                            <td>${med.nome_medicamento}</td>
                                            <td>${med.descricao_uso}</td>
                                            <td>
                                                <button type="button" class="btn btn-sm btn-info" onclick="visualizarAprazamentos('${med.nome_medicamento}')">
                                                    <i class="fas fa-clock"></i> Ver Horários
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                ${prescricao.texto_procedimento_medico ? `
                    <div class="prescricao-section procedimentos">
                        <div class="prescricao-section-title">Procedimentos Médicos</div>
                        <div class="prescricao-section-content">${prescricao.texto_procedimento_medico}</div>
                    </div>
                ` : ''}
                
                ${prescricao.texto_procedimento_multi ? `
                    <div class="prescricao-section procedimentos">
                        <div class="prescricao-section-title">Procedimentos Multiprofissionais</div>
                        <div class="prescricao-section-content">${prescricao.texto_procedimento_multi}</div>
                    </div>
                ` : ''}
            </div>
        `;
        return html;
    }
</script>

<!-- Modal Editar HDA -->
<div class="modal fade" id="modalEditarHDA" tabindex="-1" aria-labelledby="modalEditarHDALabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="modalEditarHDALabel">Editar História da Doença Atual (HDA)</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="formHDA">
                    <div class="mb-3">
                        <label for="textoHDA" class="form-label">História da Doença Atual</label>
                        <textarea class="form-control" id="textoHDA" name="textoHDA" rows="5" 
                            placeholder="Descreva a história da doença atual do paciente...">{{ internacao.hda or '' }}</textarea>
                    </div>
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar HDA</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Modal para Visualizar Aprazamentos -->
<div class="modal fade modal-visualizar-aprazamento" id="modalVisualizarAprazamento" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Horários de Aprazamento</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
                <div class="resumo-aprazamentos mb-3">
                    <div class="row">
                        <div class="col">
                            <small>Total de Horários</small>
                            <strong id="totalHorarios">0</strong>
                        </div>
                        <div class="col">
                            <small>Realizados</small>
                            <strong id="totalRealizados">0</strong>
                        </div>
                        <div class="col">
                            <small>Pendentes</small>
                            <strong id="totalPendentes">0</strong>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Status</th>
                                <th>Enfermeiro</th>
                                <th>Data Realização</th>
                            </tr>
                        </thead>
                        <tbody id="tabelaAprazamentos">
                            <!-- Preenchido via JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Extrair o ID do atendimento da URL e disponibilizá-lo globalmente
window.ATENDIMENTO_ID = window.location.pathname.split('/').pop();
console.log('[Debug] ID do atendimento extraído:', window.ATENDIMENTO_ID);

// Verificar se o ID foi extraído corretamente
if (!window.ATENDIMENTO_ID) {
    console.error('[Debug] Erro: ID do atendimento não encontrado na URL');
} else {
    console.log('[Debug] ID do atendimento disponível globalmente');
}

// Função para visualizar aprazamentos de um medicamento
async function visualizarAprazamentos(nomeMedicamento) {
    try {
        const response = await fetch(`/api/aprazamentos/atendimento/${window.ATENDIMENTO_ID}/medicamento/${encodeURIComponent(nomeMedicamento)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao buscar aprazamentos');
        }
        
        // Atualizar contadores
        let realizados = 0;
        let pendentes = 0;
        const tbody = document.getElementById('tabelaAprazamentos');
        tbody.innerHTML = '';
        
        data.aprazamentos.forEach(apr => {
            if (apr.realizado) realizados++;
            else pendentes++;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${apr.data_hora_aprazamento}</td>
                <td>
                    <span class="badge ${apr.realizado ? 'bg-success' : apr.atrasado ? 'bg-danger' : 'bg-warning'}">
                        ${apr.realizado ? 'Realizado' : apr.atrasado ? 'Atrasado' : 'Pendente'}
                    </span>
                </td>
                <td>${apr.enfermeiro_responsavel || '-'}</td>
                <td>${apr.data_realizacao || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Atualizar resumo
        document.getElementById('totalHorarios').textContent = data.aprazamentos.length;
        document.getElementById('totalRealizados').textContent = realizados;
        document.getElementById('totalPendentes').textContent = pendentes;
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalVisualizarAprazamento'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao visualizar aprazamentos:', error);
        alert('Erro ao carregar aprazamentos. Por favor, tente novamente.');
    }
}
</script>

<!-- Modal Nova Prescrição -->
<div class="modal fade" id="modalNovaPrescricao" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">Nova Prescrição Médica</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
                <form id="formPrescricao">
                    <div class="mb-3">
                        <label class="form-label">Dieta</label>
                        <textarea class="form-control" id="texto_dieta" rows="2" placeholder="Descreva a dieta do paciente..."></textarea>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Medicamentos</label>
                        <div class="card mb-2">
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-4">
                                        <input type="text" class="form-control" id="nome_medicamento" placeholder="Nome do medicamento">
                                    </div>
                                    <div class="col-md-6">
                                        <input type="text" class="form-control" id="descricao_uso" placeholder="Descrição/Posologia">
                                    </div>
                                    <div class="col-md-2">
                                        <button type="button" class="btn btn-success w-100" id="btn_adicionar_medicamento">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm" id="tabela_medicamentos">
                                <thead>
                                    <tr>
                                        <th>Medicamento</th>
                                        <th>Descrição/Posologia</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr id="sem_medicamentos">
                                        <td colspan="3" class="text-center text-muted">Nenhum medicamento adicionado</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Procedimentos Médicos</label>
                        <textarea class="form-control" id="texto_procedimento_medico" rows="3" placeholder="Descreva os procedimentos médicos..."></textarea>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Procedimentos Multiprofissionais</label>
                        <textarea class="form-control" id="texto_procedimento_multi" rows="3" placeholder="Descreva os procedimentos multiprofissionais..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btn_salvar_prescricao">Salvar Prescrição</button>
            </div>
        </div>
    </div>
</div>

<script>
// Variáveis globais
window.medicamentosAdicionados = window.medicamentosAdicionados || [];

// Evento para abrir o modal de nova prescrição
$('#btn-nova-prescricao').on('click', function() {
    // Limpar o formulário
    $('#formPrescricao')[0].reset();
    window.medicamentosAdicionados = [];
    atualizarTabelaMedicamentos();
    
    // Abrir o modal
    $('#modalNovaPrescricao').modal('show');
});

// Função para atualizar a tabela de medicamentos
function atualizarTabelaMedicamentos() {
    const tbody = $('#tabela_medicamentos tbody');
    tbody.empty();
    
    if (window.medicamentosAdicionados.length === 0) {
        tbody.html(`
            <tr id="sem_medicamentos">
                <td colspan="3" class="text-center text-muted">Nenhum medicamento adicionado</td>
            </tr>
        `);
        return;
    }
    
    window.medicamentosAdicionados.forEach((med, index) => {
        tbody.append(`
            <tr>
                <td>${med.nome_medicamento}</td>
                <td>${med.descricao_uso}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm" onclick="removerMedicamento(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

// Função para remover medicamento
function removerMedicamento(index) {
    window.medicamentosAdicionados.splice(index, 1);
    atualizarTabelaMedicamentos();
}

// Evento para adicionar medicamento
$('#btn_adicionar_medicamento').on('click', function(e) {
    e.preventDefault(); // Previne o comportamento padrão do botão
    e.stopPropagation(); // Impede a propagação do evento
    
    const nome_medicamento = $('#nome_medicamento').val().trim();
    const descricao_uso = $('#descricao_uso').val().trim();
    
    if (!nome_medicamento || !descricao_uso) {
        alert('Por favor, preencha o nome do medicamento e a descrição de uso.');
        return;
    }
    
    window.medicamentosAdicionados.push({
        nome_medicamento: nome_medicamento,
        descricao_uso: descricao_uso
    });
    
    // Limpar campos
    $('#nome_medicamento').val('');
    $('#descricao_uso').val('');
    
    // Atualizar tabela
    atualizarTabelaMedicamentos();
    
    // Focar no campo de nome do medicamento
    $('#nome_medicamento').focus();
});

// Evento para salvar prescrição
$('#btn_salvar_prescricao').on('click', function(e) {
    e.preventDefault(); // Previne o comportamento padrão do botão
    
    const texto_dieta = $('#texto_dieta').val().trim();
    const texto_procedimento_medico = $('#texto_procedimento_medico').val().trim();
    const texto_procedimento_multi = $('#texto_procedimento_multi').val().trim();
    
    // Verificar se ao menos algo foi preenchido
    if (!texto_dieta && !texto_procedimento_medico && !texto_procedimento_multi && window.medicamentosAdicionados.length === 0) {
        alert('Por favor, preencha pelo menos um dos campos da prescrição ou adicione ao menos um medicamento.');
        return;
    }
    
    // Preparar dados para envio
    const dados = {
        atendimentos_clinica_id: internacaoId,
        texto_dieta: texto_dieta || null,
        texto_procedimento_medico: texto_procedimento_medico || null,
        texto_procedimento_multi: texto_procedimento_multi || null,
        medicamentos: window.medicamentosAdicionados
    };
    
    // Mostrar indicador de carregamento
    const btnSalvar = $(this);
    const textoOriginal = btnSalvar.html();
    btnSalvar.html('<i class="fas fa-spinner fa-spin"></i> Salvando...').prop('disabled', true);
    
    // Enviar requisição
    $.ajax({
        url: '/api/prescricoes',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: async function(response) {
            if (response.success) {
                try {
                    // Limpar o formulário
                    $('#formPrescricao')[0].reset();
                    window.medicamentosAdicionados = [];
                    atualizarTabelaMedicamentos();
                    
                    // Fechar modal
                    $('#modalNovaPrescricao').modal('hide');
                    
                    // Forçar atualização das prescrições
                    await carregarPrescricoes();
                    
                    // Mostrar mensagem de sucesso
                    const alertHtml = `
                        <div class="alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index: 1060">
                            Prescrição registrada com sucesso!
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                    $('body').append(alertHtml);
                    
                    // Remover o alerta após 3 segundos
                    setTimeout(function() {
                        $('.alert').alert('close');
                    }, 3000);
                    
                    // Forçar atualização da visualização
                    $('#prescricaoSection').show();
                    $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center"><i class="fas fa-spinner fa-spin"></i> Atualizando prescrições...</td></tr>');
                    
                    // Recarregar prescrições novamente após um pequeno delay
                    setTimeout(async function() {
                        await carregarPrescricoes();
                    }, 500);
                    
                } catch (error) {
                    console.error('Erro ao atualizar prescrições:', error);
                }
            } else {
                alert('Erro ao registrar prescrição: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao registrar prescrição:', xhr.responseText);
            alert('Erro ao registrar prescrição: ' + (xhr.responseJSON?.error || error));
        },
        complete: function() {
            // Restaurar botão
            btnSalvar.html(textoOriginal).prop('disabled', false);
        }
    });
});

// Modificar a função carregarPrescricoes para ser assíncrona
async function carregarPrescricoes() {
    try {
        const response = await fetch(`/api/prescricoes/${internacaoId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao carregar prescrições');
        }
        
        if (!data.prescricoes || data.prescricoes.length === 0) {
            $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada para hoje.</td></tr>');
            $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição anterior encontrada.</td></tr>');
            return;
        }
        
        // Ordenar prescrições por data (mais recentes primeiro)
        data.prescricoes.sort((a, b) => {
            const dataA = new Date(a.data_prescricao);
            const dataB = new Date(b.data_prescricao);
            return dataB - dataA;
        });
        
        // Separar prescrições de hoje e antigas
        const hoje = new Date().toLocaleDateString('pt-BR');
        const prescricoesHoje = [];
        const prescricoesAntigas = [];
        
        data.prescricoes.forEach(prescricao => {
            const dataPrescricao = new Date(prescricao.data_prescricao).toLocaleDateString('pt-BR');
            if (dataPrescricao === hoje) {
                prescricoesHoje.push(prescricao);
            } else {
                prescricoesAntigas.push(prescricao);
            }
        });
        
        // Renderizar prescrições de hoje
        if (prescricoesHoje.length > 0) {
            const htmlHoje = prescricoesHoje.map(prescricao => renderizarPrescricao(prescricao)).join('');
            $('#listaPrescricoesDoDia').html(htmlHoje);
        } else {
            $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada para hoje.</td></tr>');
        }
        
        // Renderizar prescrições antigas
        if (prescricoesAntigas.length > 0) {
            const htmlAntigas = prescricoesAntigas.map(prescricao => renderizarPrescricao(prescricao)).join('');
            $('#listaPrescricoesAntigas').html(htmlAntigas);
            $('#contador-prescricoes-antigas').text(prescricoesAntigas.length);
        } else {
            $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição anterior encontrada.</td></tr>');
            $('#contador-prescricoes-antigas').text('0');
        }
        
    } catch (error) {
        console.error('Erro ao carregar prescrições:', error);
        $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições. Por favor, tente novamente.</td></tr>');
        $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições. Por favor, tente novamente.</td></tr>');
    }
}

// Adicionar evento de tecla para os campos de medicamento
$('#nome_medicamento, #descricao_uso').on('keypress', function(e) {
    // Se pressionar Enter
    if (e.which === 13) {
        e.preventDefault(); // Previne o comportamento padrão
        // Se estiver no campo nome, vai para descrição
        if ($(this).attr('id') === 'nome_medicamento') {
            $('#descricao_uso').focus();
        } else {
            // Se estiver na descrição, aciona o botão adicionar
            $('#btn_adicionar_medicamento').click();
        }
    }
});

// Prevenir submissão do formulário ao pressionar Enter
$('#formPrescricao').on('submit', function(e) {
    e.preventDefault();
    return false;
});
</script>

<!-- Modal Editar Exames -->
<div class="modal fade" id="modalEditarExames" tabindex="-1" aria-labelledby="modalEditarExamesLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-secondary text-white">
                <h5 class="modal-title" id="modalEditarExamesLabel">Editar Exames Laboratoriais</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="formExames">
                    <div class="mb-3">
                        <label for="textoExames" class="form-label">Exames Laboratoriais</label>
                        <textarea class="form-control" id="textoExames" name="textoExames" rows="10" 
                            placeholder="Registre os exames laboratoriais do paciente...">{{ internacao.exames_laboratoriais or '' }}</textarea>
                    </div>
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Exames</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
// Manipulador para o formulário de exames
$('#formExames').on('submit', function(e) {
    e.preventDefault();
    
    const textoExames = $('#textoExames').val().trim();
    
    // Mostrar indicador de carregamento
    const btnSubmit = $(this).find('button[type="submit"]');
    const textoOriginal = btnSubmit.html();
    btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...').prop('disabled', true);
    
    // Enviar requisição para atualizar exames
    $.ajax({
        url: `/api/internacao/{{ internacao.id }}/atualizar`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            exames_laboratoriais: textoExames
        }),
        success: function(response) {
            if (response.success) {
                // Atualizar o texto na tela
                $('#examesLaboratoriaisTexto').html(textoExames || 'Não registrado.');
                
                // Fechar o modal
                $('#modalEditarExames').modal('hide');
                
                // Mostrar mensagem de sucesso
                const alertHtml = `
                    <div class="alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index: 1060">
                        Exames laboratoriais atualizados com sucesso!
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
                $('body').append(alertHtml);
                
                // Remover o alerta após 3 segundos
                setTimeout(function() {
                    $('.alert').alert('close');
                }, 3000);
            } else {
                alert('Erro ao atualizar exames: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao atualizar exames:', xhr.responseText);
            alert('Erro ao atualizar exames: ' + (xhr.responseJSON?.error || error));
        },
        complete: function() {
            // Restaurar botão
            btnSubmit.html(textoOriginal).prop('disabled', false);
        }
    });
});
</script>

<script>
    // Função para abrir a janela de impressão como popup
    function abrirImpressao() {
        const width = 1024;
        const height = 768;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        window.open(
            '/clinica/impressoes/{{ internacao.id }}',
            'ImpressaoProntuario',
            `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
        );
    }
</script>

<!-- Adicionar antes do fechamento da div container -->
<div id="receituarioSection" class="content-section">
    <div class="card shadow-sm">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Receituário</h5>
            <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalNovaReceita">
                <i class="fas fa-plus-circle"></i> Nova Receita
            </button>
        </div>
        <div class="card-body">
            <div class="mb-3" id="hoje-container-receituario">
                <h6 class="fw-bold text-success mb-2">
                    <i class="fas fa-calendar-day me-1"></i> 
                    <span id="titulo-receitas-hoje">Receitas de Hoje</span>
                </h6>
                <div id="listaReceitasDoDia">
                    <!-- Preenchido via JavaScript -->
                </div>
            </div>
            
            <div class="mb-3" id="antigas-container-receituario">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-secondary mb-0">
                        <i class="fas fa-history me-1"></i> Receitas Anteriores
                    </h6>
                    <span class="badge bg-info" id="contador-receitas-antigas">0</span>
                </div>
                <div id="listaReceitasAntigas">
                    <!-- Preenchido via JavaScript -->
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Nova Receita -->
<div class="modal fade" id="modalNovaReceita" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">Nova Receita</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
                <form id="formReceita">
                    <div class="mb-3">
                        <label class="form-label">Tipo de Receita</label>
                        <select class="form-select" id="tipo_receita" required>
                            <option value="">Selecione o tipo de receita</option>
                            <option value="normal">Receita Normal</option>
                            <option value="especial">Receita Especial</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Conteúdo da Receita</label>
                        <div id="editor-receita-container">
                            <!-- Editor Quill será inicializado aqui -->
                        </div>
                        <textarea id="conteudo_receita" name="conteudo_receita" style="display:none"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btn_salvar_receita">Salvar Receita</button>
            </div>
        </div>
    </div>
</div>

<script>
// Inicializar editor Quill para receitas
let quillReceita;
$(document).ready(function() {
    // Inicializar o Editor Quill para receitas
    quillReceita = new Quill('#editor-receita-container', {
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['clean']
            ]
        },
        placeholder: 'Digite o conteúdo da receita...',
        theme: 'snow'
    });
    
    // Ao mudar o conteúdo do Quill, atualizar o textarea
    quillReceita.on('text-change', function() {
        const html = quillReceita.root.innerHTML;
        document.getElementById('conteudo_receita').value = html;
    });

    // Carregar receitas ao iniciar
    carregarReceitas();
});

// Função para carregar receitas
function carregarReceitas() {
    $.ajax({
        url: `/api/receituarios/${atendimentoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const hoje = new Date().toLocaleDateString('pt-BR');
                const receitasHoje = [];
                const receitasAntigas = [];

                response.receituarios.forEach(receita => {
                    const dataReceita = new Date(receita.data_receita).toLocaleDateString('pt-BR');
                    if (dataReceita === hoje) {
                        receitasHoje.push(receita);
                    } else {
                        receitasAntigas.push(receita);
                    }
                });

                // Renderizar receitas de hoje
                renderizarReceitas(receitasHoje, '#listaReceitasDoDia', true);
                
                // Renderizar receitas antigas
                renderizarReceitas(receitasAntigas, '#listaReceitasAntigas', false);
                
                // Atualizar contador
                $('#contador-receitas-antigas').text(receitasAntigas.length);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar receitas:', error);
            mostrarMensagemErro('Erro ao carregar receitas. Por favor, tente novamente.');
        }
    });
}

// Função para renderizar receitas
function renderizarReceitas(receitas, containerId, ehHoje) {
    const container = $(containerId);
    
    if (receitas.length === 0) {
        container.html(`
            <div class="alert alert-info">
                ${ehHoje ? 'Nenhuma receita registrada hoje.' : 'Nenhuma receita anterior encontrada.'}
            </div>
        `);
        return;
    }

    let html = '';
    receitas.forEach(receita => {
        const dataFormatada = new Date(receita.data_receita).toLocaleString('pt-BR');
        const tipoReceita = receita.tipo_receita === 'especial' ? 'Especial' : 'Normal';
        const badgeClass = receita.tipo_receita === 'especial' ? 'bg-danger' : 'bg-success';

        html += `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge ${badgeClass} me-2">Receita ${tipoReceita}</span>
                            <small class="text-muted">${dataFormatada}</small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="visualizarReceita(${receita.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="gerarPDFReceita(${receita.id})">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="receita-preview">
                        ${receita.conteudo_receita}
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);
}

// Evento para salvar nova receita
$('#btn_salvar_receita').on('click', function() {
    const tipo_receita = $('#tipo_receita').val();
    const conteudo_receita = quillReceita.root.innerHTML;

    if (!tipo_receita) {
        alert('Por favor, selecione o tipo de receita.');
        return;
    }

    if (!conteudo_receita || conteudo_receita === '<p><br></p>') {
        alert('Por favor, preencha o conteúdo da receita.');
        return;
    }

    // Mostrar indicador de carregamento
    const btnSalvar = $(this);
    const textoOriginal = btnSalvar.html();
    btnSalvar.html('<i class="fas fa-spinner fa-spin"></i> Salvando...').prop('disabled', true);

    // Preparar dados para envio
    const dados = {
        atendimento_id: atendimentoId,
        medico_id: parseInt("{{ session.get('user_id', 0) }}", 10),
        tipo_receita: tipo_receita,
        conteudo_receita: conteudo_receita
    };

    // Enviar requisição
    $.ajax({
        url: '/api/receituarios',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            if (response.success) {
                // Limpar formulário
                $('#tipo_receita').val('');
                quillReceita.setText('');
                
                // Fechar modal
                $('#modalNovaReceita').modal('hide');
                
                // Recarregar receitas
                carregarReceitas();
                
                // Mostrar mensagem de sucesso
                mostrarMensagemSucesso('Receita registrada com sucesso!');
            } else {
                alert('Erro ao registrar receita: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao registrar receita:', error);
            alert('Erro ao registrar receita: ' + (xhr.responseJSON?.error || error));
        },
        complete: function() {
            // Restaurar botão
            btnSalvar.html(textoOriginal).prop('disabled', false);
        }
    });
});

// Função para visualizar receita (placeholder por enquanto)
function visualizarReceita(id) {
    // Implementar visualização detalhada da receita
    alert('Funcionalidade de visualização em desenvolvimento');
}

// Função para gerar PDF
function gerarPDFReceita(id) {
    // Buscar informações da receita primeiro
    $.ajax({
        url: `/api/receituarios/${atendimentoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const receita = response.receituarios.find(r => r.id === id);
                if (receita) {
                    if (receita.tipo_receita === 'normal') {
                        // Para receitas normais, usar o endpoint de geração de PDF
                        window.open(`/clinica/receituario/${id}/gerar_pdf`, '_blank');
                    } else {
                        // Para receitas especiais, mostrar mensagem de desenvolvimento
                        alert('Geração de PDF para receitas especiais em desenvolvimento');
                    }
                } else {
                    mostrarMensagemErro('Receita não encontrada.');
                }
            } else {
                mostrarMensagemErro('Erro ao buscar informações da receita.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar receita:', error);
            mostrarMensagemErro('Erro ao gerar PDF da receita. Por favor, tente novamente.');
        }
    });
}

// Função para mostrar mensagem de sucesso
function mostrarMensagemSucesso(mensagem) {
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index: 1060">
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    $('body').append(alertHtml);
    
    setTimeout(function() {
        $('.alert').alert('close');
    }, 3000);
}

// Função para mostrar mensagem de erro
function mostrarMensagemErro(mensagem) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index: 1060">
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    $('body').append(alertHtml);
    
    setTimeout(function() {
        $('.alert').alert('close');
    }, 3000);
}
</script>

<script>
// Inicializar editor Quill para atestados
let quillAtestado;
$(document).ready(function() {
    // Inicializar o Editor Quill para atestados
    quillAtestado = new Quill('#editor-atestado-container', {
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['clean']
            ]
        },
        placeholder: 'Digite o conteúdo do atestado...',
        theme: 'snow'
    });
    
    // Ao mudar o conteúdo do Quill, atualizar o textarea
    quillAtestado.on('text-change', function() {
        const html = quillAtestado.root.innerHTML;
        document.getElementById('conteudo_atestado').value = html;
    });

    // Carregar atestados ao iniciar
    carregarAtestados();
});

// Função para carregar atestados
function carregarAtestados() {
    $.ajax({
        url: `/api/atestados/${atendimentoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const hoje = new Date().toLocaleDateString('pt-BR');
                const atestadosHoje = [];
                const atestadosAntigos = [];

                response.atestados.forEach(atestado => {
                    const dataAtestado = new Date(atestado.data_atestado).toLocaleDateString('pt-BR');
                    if (dataAtestado === hoje) {
                        atestadosHoje.push(atestado);
                    } else {
                        atestadosAntigos.push(atestado);
                    }
                });

                // Renderizar atestados de hoje
                renderizarAtestados(atestadosHoje, '#listaAtestadosDoDia', true);
                
                // Renderizar atestados antigos
                renderizarAtestados(atestadosAntigos, '#listaAtestadosAntigos', false);
                
                // Atualizar contador
                $('#contador-atestados-antigos').text(atestadosAntigos.length);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar atestados:', error);
            mostrarMensagemErro('Erro ao carregar atestados. Por favor, tente novamente.');
        }
    });
}

// Função para renderizar atestados
function renderizarAtestados(atestados, containerId, ehHoje) {
    const container = $(containerId);
    
    if (atestados.length === 0) {
        container.html(`
            <div class="alert alert-info">
                ${ehHoje ? 'Nenhum atestado registrado hoje.' : 'Nenhum atestado anterior encontrado.'}
            </div>
        `);
        return;
    }

    let html = '';
    atestados.forEach(atestado => {
        const dataFormatada = new Date(atestado.data_atestado).toLocaleString('pt-BR');
        const diasAfastamento = atestado.dias_afastamento || 'Não especificado';

        html += `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-primary me-2">${diasAfastamento} dia(s) de afastamento</span>
                            <small class="text-muted">${dataFormatada}</small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="visualizarAtestado(${atestado.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="gerarPDFAtestado(${atestado.id})">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="atestado-preview">
                        ${atestado.conteudo_atestado}
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);
}

// Evento para salvar novo atestado
$('#btn_salvar_atestado').on('click', function() {
    const dias_afastamento = $('#dias_afastamento').val();
    const conteudo_atestado = quillAtestado.root.innerHTML;

    if (!conteudo_atestado || conteudo_atestado === '<p><br></p>') {
        alert('Por favor, preencha o conteúdo do atestado.');
        return;
    }

    // Mostrar indicador de carregamento
    const btnSalvar = $(this);
    const textoOriginal = btnSalvar.html();
    btnSalvar.html('<i class="fas fa-spinner fa-spin"></i> Salvando...').prop('disabled', true);

    // Preparar dados para envio - Garantindo que os tipos de dados estejam corretos
    const dados = {
        atendimento_id: window.ATENDIMENTO_ID || atendimentoId, // Usar o ID global se disponível
        medico_id: parseInt("{{ session.get('user_id', 0) }}", 10),
        conteudo_atestado: conteudo_atestado.trim(),
        dias_afastamento: dias_afastamento ? parseInt(dias_afastamento, 10) : null
    };

    console.log('Dados sendo enviados:', dados); // Log para debug

    // Enviar requisição
    $.ajax({
        url: '/api/atestados',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            if (response.success) {
                // Limpar formulário
                $('#dias_afastamento').val('');
                quillAtestado.setText('');
                
                // Fechar modal
                $('#modalNovoAtestado').modal('hide');
                
                // Recarregar atestados
                carregarAtestados();
                
                // Mostrar mensagem de sucesso
                mostrarMensagemSucesso('Atestado registrado com sucesso!');
            } else {
                console.error('Erro na resposta:', response);
                alert('Erro ao registrar atestado: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao registrar atestado:', {
                status: xhr.status,
                responseText: xhr.responseText,
                error: error
            });
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                alert('Erro ao registrar atestado: ' + (errorResponse.message || error));
            } catch (e) {
                alert('Erro ao registrar atestado: ' + error);
            }
        },
        complete: function() {
            // Restaurar botão
            btnSalvar.html(textoOriginal).prop('disabled', false);
        }
    });
});

// Função para visualizar atestado (placeholder por enquanto)
function visualizarAtestado(id) {
    // Implementar visualização detalhada do atestado
    alert('Funcionalidade de visualização em desenvolvimento');
}

// Função para gerar PDF do atestado (placeholder por enquanto)
function gerarPDFAtestado(id) {
    // Implementar geração de PDF
    alert('Funcionalidade de geração de PDF em desenvolvimento');
}
</script>

<script>
// ... código existente ...
// Botão para mostrar informações
const abaInformacoes = document.querySelector('a[data-target="informacoesSection"]');
if (btnMostrarInformacoes && abaInformacoes) {
    btnMostrarInformacoes.addEventListener('click', function() {
        window.location.href = `/clinica/internacao/${internacaoId}/informacoes`;
    });
}
// ... código existente ...
</script>

<!-- Modal de Informações de Internamento -->
<div class="modal fade" id="modalInformacoesInternamento" tabindex="-1" aria-labelledby="modalInformacoesInternamentoLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header bg-warning text-dark">
        <h5 class="modal-title" id="modalInformacoesInternamentoLabel">Informações de Internamento</h5>
        <button type="button" class="btn btn-outline-primary btn-sm ms-2" id="btnEditarInternamentoInfo">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body">
        <div id="internamento-info-loading" class="text-center my-3">
          <div class="spinner-border text-warning" role="status"><span class="visually-hidden">Carregando...</span></div>
        </div>
        <div id="internamento-info-content" style="display:none"></div>
      </div>
      <div class="modal-footer" id="internamento-info-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
      </div>
    </div>
  </div>
</div>

<script>
// Função para montar HTML das informações de internamento (visualização ou edição)
function renderizarInternamentoInfo(data, modoEdicao = false) {
    if (!modoEdicao) {
        return `
        <table class="table table-bordered table-striped" id="tabela-internamento-info">
          <tbody>
            <tr><th>Leito</th><td data-campo="leito">${data.leito || '-'}</td></tr>
            <tr><th>Data Internação</th><td data-campo="data_internacao">${data.data_internacao ? new Date(data.data_internacao).toLocaleString('pt-BR') : '-'}</td></tr>
            <tr><th>Diagnóstico Inicial</th><td data-campo="diagnostico_inicial">${data.diagnostico_inicial || '-'}</td></tr>
            <tr><th>Diagnóstico</th><td data-campo="diagnostico">${data.diagnostico || '-'}</td></tr>
            <tr><th>CID Principal</th><td data-campo="cid_principal">${data.cid_principal || '-'}</td></tr>
            <tr><th>Justificativa Sinais/Sintomas</th><td data-campo="justificativa_internacao_sinais_e_sintomas">${data.justificativa_internacao_sinais_e_sintomas || '-'}</td></tr>
            <tr><th>Justificativa Condições</th><td data-campo="justificativa_internacao_condicoes">${data.justificativa_internacao_condicoes || '-'}</td></tr>
            <tr><th>Justificativa Resultados Diagnóstico</th><td data-campo="justificativa_internacao_principais_resultados_diagnostico">${data.justificativa_internacao_principais_resultados_diagnostico || '-'}</td></tr>
            <tr><th>CID 10 Secundário</th><td data-campo="cid_10_secundario">${data.cid_10_secundario || '-'}</td></tr>
            <tr><th>CID 10 Causas Associadas</th><td data-campo="cid_10_causas_associadas">${data.cid_10_causas_associadas || '-'}</td></tr>
            <tr><th>Descrição Procedimento Solicitado</th><td data-campo="descr_procedimento_solicitado">${data.descr_procedimento_solicitado || '-'}</td></tr>
            <tr><th>Código Procedimento</th><td data-campo="codigo_procedimento">${data.codigo_procedimento || '-'}</td></tr>
            <tr><th>Acidente de Trabalho</th><td data-campo="acidente_de_trabalho">${data.acidente_de_trabalho ? 'Sim' : 'Não'}</td></tr>
          </tbody>
        </table>
        `;
    } else {
        // Renderizar campos editáveis
        return `
        <form id="formEditarInternamentoInfo">
        <table class="table table-bordered table-striped">
          <tbody>
            <tr><th>Leito</th><td><input type="text" class="form-control" name="leito" value="${data.leito || ''}"></td></tr>
            <tr><th>Data Internação</th><td><input type="datetime-local" class="form-control" name="data_internacao" value="${data.data_internacao ? new Date(data.data_internacao).toISOString().slice(0,16) : ''}"></td></tr>
            <tr><th>Diagnóstico Inicial</th><td><input type="text" class="form-control" name="diagnostico_inicial" value="${data.diagnostico_inicial || ''}"></td></tr>
            <tr><th>Diagnóstico</th><td><input type="text" class="form-control" name="diagnostico" value="${data.diagnostico || ''}"></td></tr>
            <tr><th>CID Principal</th><td><input type="text" class="form-control" name="cid_principal" value="${data.cid_principal || ''}"></td></tr>
            <tr><th>Justificativa Sinais/Sintomas</th><td><textarea class="form-control" name="justificativa_internacao_sinais_e_sintomas" rows="2">${data.justificativa_internacao_sinais_e_sintomas || ''}</textarea></td></tr>
            <tr><th>Justificativa Condições</th><td><textarea class="form-control" name="justificativa_internacao_condicoes" rows="2">${data.justificativa_internacao_condicoes || ''}</textarea></td></tr>
            <tr><th>Justificativa Resultados Diagnóstico</th><td><textarea class="form-control" name="justificativa_internacao_principais_resultados_diagnostico" rows="2">${data.justificativa_internacao_principais_resultados_diagnostico || ''}</textarea></td></tr>
            <tr><th>CID 10 Secundário</th><td><input type="text" class="form-control" name="cid_10_secundario" value="${data.cid_10_secundario || ''}"></td></tr>
            <tr><th>CID 10 Causas Associadas</th><td><input type="text" class="form-control" name="cid_10_causas_associadas" value="${data.cid_10_causas_associadas || ''}"></td></tr>
            <tr><th>Descrição Procedimento Solicitado</th><td><textarea class="form-control" name="descr_procedimento_solicitado" rows="2">${data.descr_procedimento_solicitado || ''}</textarea></td></tr>
            <tr><th>Código Procedimento</th><td><input type="text" class="form-control" name="codigo_procedimento" value="${data.codigo_procedimento || ''}"></td></tr>
            <tr><th>Acidente de Trabalho</th><td>
                <select class="form-select" name="acidente_de_trabalho">
                    <option value="false" ${!data.acidente_de_trabalho ? 'selected' : ''}>Não</option>
                    <option value="true" ${data.acidente_de_trabalho ? 'selected' : ''}>Sim</option>
                </select>
            </td></tr>
          </tbody>
        </table>
        </form>
        `;
    }
}

// Evento do botão para abrir o modal e carregar as informações
const btnMostrarInformacoes = document.getElementById('btnMostrarInformacoes');
let dadosInternamentoCache = null;
let modoEdicaoInternamento = false;

if (btnMostrarInformacoes) {
    btnMostrarInformacoes.addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('modalInformacoesInternamento'));
        document.getElementById('internamento-info-loading').style.display = '';
        document.getElementById('internamento-info-content').style.display = 'none';
        document.getElementById('btnEditarInternamentoInfo').style.display = '';
        modoEdicaoInternamento = false;
        // Buscar dados via AJAX
        fetch(`/api/internacao/${internacao_Id}`)
            .then(resp => resp.json())
            .then(json => {
                if (json.success && json.internacao) {
                    dadosInternamentoCache = json.internacao;
                    document.getElementById('internamento-info-content').innerHTML = renderizarInternamentoInfo(json.internacao, false);
                } else {
                    document.getElementById('internamento-info-content').innerHTML = '<div class="alert alert-danger">Erro ao carregar informações.</div>';
                }
            })
            .catch(() => {
                document.getElementById('internamento-info-content').innerHTML = '<div class="alert alert-danger">Erro ao carregar informações.</div>';
            })
            .finally(() => {
                document.getElementById('internamento-info-loading').style.display = 'none';
                document.getElementById('internamento-info-content').style.display = '';
            });
        modal.show();
    });
}

// Evento do botão Editar
const btnEditarInternamentoInfo = document.getElementById('btnEditarInternamentoInfo');
if (btnEditarInternamentoInfo) {
    btnEditarInternamentoInfo.addEventListener('click', function() {
        if (!dadosInternamentoCache) return;
        modoEdicaoInternamento = true;
        document.getElementById('internamento-info-content').innerHTML = renderizarInternamentoInfo(dadosInternamentoCache, true);
        // Mostrar botões Salvar/Cancelar
        document.getElementById('internamento-info-footer').innerHTML = `
            <button type="button" class="btn btn-secondary" id="btnCancelarEdicaoInternamento">Cancelar</button>
            <button type="button" class="btn btn-success" id="btnSalvarEdicaoInternamento">Salvar</button>
        `;
        // Evento cancelar
        document.getElementById('btnCancelarEdicaoInternamento').onclick = function() {
            modoEdicaoInternamento = false;
            document.getElementById('internamento-info-content').innerHTML = renderizarInternamentoInfo(dadosInternamentoCache, false);
            document.getElementById('internamento-info-footer').innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>';
        };
        // Evento salvar
        document.getElementById('btnSalvarEdicaoInternamento').onclick = function() {
            const form = document.getElementById('formEditarInternamentoInfo');
            const formData = new FormData(form);
            const obj = {};
            for (const [key, value] of formData.entries()) {
                if (key === 'acidente_de_trabalho') {
                    obj[key] = value === 'true';
                } else if (key === 'data_internacao') {
                    obj[key] = value ? new Date(value).toISOString() : null;
                } else {
                    obj[key] = value;
                }
            }
            obj['id'] = dadosInternamentoCache.id;
            // Enviar via AJAX
            fetch(`/api/internacao/${dadosInternamentoCache.id}/atualizar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(obj)
            })
            .then(resp => resp.json())
            .then(json => {
                if (json.success) {
                    dadosInternamentoCache = { ...dadosInternamentoCache, ...obj };
                    modoEdicaoInternamento = false;
                    document.getElementById('internamento-info-content').innerHTML = renderizarInternamentoInfo(dadosInternamentoCache, false);
                    document.getElementById('internamento-info-footer').innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>';
                    // Mensagem de sucesso
                    const alertHtml = `
                        <div class="alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index: 1060">
                            Informações de internamento atualizadas com sucesso!
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', alertHtml);
                    setTimeout(function() { document.querySelectorAll('.alert').forEach(a => a.remove()); }, 3000);
                } else {
                    alert('Erro ao salvar: ' + (json.message || 'Erro desconhecido'));
                }
            })
            .catch(() => {
                alert('Erro ao salvar informações.');
            });
        };
    });
}
// ... código existente ...

</script>

</body>
</html>

