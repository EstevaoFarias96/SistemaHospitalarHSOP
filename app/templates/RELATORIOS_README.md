# Sistema de Templates de Relatórios - HSOP

## Arquivos Criados

### 1. `relatorio_base_impressao.html` - Template Base
Template principal que contém toda a estrutura fixa:
- Cabeçalho com logo e dados da instituição
- Título do relatório
- Filtros aplicados
- Área de conteúdo flexível
- Rodapé com data de geração
- Estilos para impressão
- Botões de ação (imprimir, exportar, voltar)

### 2. Templates Específicos
- `relatorio_emergencia.html` - Atendimento Emergência
- `relatorio_produtividade.html` - Produtividade Clínica
- `relatorio_observacao.html` - Observação
- `relatorio_perfil_paciente.html` - Perfil de Paciente
- `relatorio_exemplo.html` - Exemplo de uso

## Como Usar

### Passo 1: Criar a Rota no Backend

```python
@bp.route('/administrador/relatorios/gerar')
@login_required
def gerar_relatorio():
    # Obter parâmetros
    modelo = request.args.get('modelo')  # 'analitico' ou 'serie_historica'
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    tipo_relatorio = request.args.get('tipo_relatorio')  # 'emergencia', 'produtividade', etc.
    
    # Processar dados do banco
    dados = processar_dados_relatorio(modelo, data_inicio, data_fim, tipo_relatorio)
    
    # Selecionar template apropriado
    templates = {
        'emergencia': 'relatorio_emergencia.html',
        'produtividade': 'relatorio_produtividade.html',
        'observacao': 'relatorio_observacao.html',
        'perfil': 'relatorio_perfil_paciente.html'
    }
    
    template = templates.get(tipo_relatorio, 'relatorio_exemplo.html')
    
    # Renderizar template
    return render_template(template,
        titulo_relatorio="Relatório de Atendimento Emergência",
        modelo_relatorio="Analítico" if modelo == 'analitico' else "Série Histórica",
        periodo_inicio=data_inicio,
        periodo_fim=data_fim,
        tipo_relatorio_nome="Atendimento Emergência",
        icone_relatorio="fas fa-ambulance",
        **dados  # Passar todos os dados processados
    )
```

### Passo 2: Variáveis Necessárias

#### Variáveis Básicas (obrigatórias):
```python
{
    'titulo_relatorio': 'Nome do Relatório',
    'modelo_relatorio': 'Analítico' ou 'Série Histórica',
    'periodo_inicio': '01/01/2025',
    'periodo_fim': '31/01/2025',
    'tipo_relatorio_nome': 'Atendimento Emergência',
    'icone_relatorio': 'fas fa-ambulance'
}
```

#### Variáveis Opcionais:
```python
{
    'data_geracao': '30/10/2025 às 14:30',
    'filtros_adicionais': [
        {'label': 'Setor', 'valor': 'Emergência'},
        {'label': 'Médico', 'valor': 'Dr. João Silva'}
    ],
    'observacoes': 'Texto de observações gerais',
    'mostrar_assinaturas': True,
    'assinatura_1_nome': 'Dr. João Silva',
    'assinatura_1_cargo': 'Diretor Técnico',
    'mostrar_grafico': True,
    'grafico_titulo': 'Evolução Temporal'
}
```

#### Para Métricas (cards):
```python
{
    'metricas': [
        {
            'label': 'Total de Atendimentos',
            'valor': '1.234',
            'complemento': 'no período',
            'destaque': True  # Opcional, destaca o card
        },
        {
            'label': 'Média Diária',
            'valor': '45',
            'complemento': 'atendimentos/dia'
        }
    ]
}
```

#### Para Tabelas:
```python
{
    'tabela_titulo': 'Dados Detalhados',
    'tabela_colunas': ['Coluna 1', 'Coluna 2', 'Coluna 3'],
    'tabela_dados': [
        {
            'valores': ['Valor 1', 'Valor 2', 'Valor 3'],
            'is_total': False
        },
        {
            'valores': ['TOTAL', '100', '100%'],
            'is_total': True  # Linha de total com destaque
        }
    ]
}
```

## Exemplo Completo de Uso

```python
@bp.route('/administrador/relatorios/emergencia')
@login_required
def relatorio_emergencia_exemplo():
    from datetime import datetime, timedelta
    
    # Definir período
    data_fim = datetime.now()
    data_inicio = data_fim - timedelta(days=7)
    
    # Buscar dados do banco
    total_atendimentos = Atendimento.query.filter(
        Atendimento.data_atendimento.between(data_inicio.date(), data_fim.date())
    ).count()
    
    # Preparar dados
    dados = {
        'titulo_relatorio': 'Relatório de Atendimento Emergência',
        'modelo_relatorio': 'Analítico',
        'periodo_inicio': data_inicio.strftime('%d/%m/%Y'),
        'periodo_fim': data_fim.strftime('%d/%m/%Y'),
        'tipo_relatorio_nome': 'Atendimento Emergência',
        'icone_relatorio': 'fas fa-ambulance',
        
        # Métricas
        'total_atendimentos': total_atendimentos,
        'media_diaria': round(total_atendimentos / 7, 1),
        'tempo_medio': '2h 30min',
        'taxa_internacao': '15%',
        
        # Dados para tabelas específicas
        'dados_risco': [
            {'classificacao': 'VERMELHO', 'badge_class': 'danger', 
             'quantidade': 10, 'percentual': 5, 'tempo_medio': '30min'},
            {'classificacao': 'AMARELO', 'badge_class': 'warning',
             'quantidade': 50, 'percentual': 25, 'tempo_medio': '1h'},
            # ...
        ],
        
        'observacoes': 'Considerações importantes sobre este relatório...',
        'mostrar_assinaturas': True
    }
    
    return render_template('relatorio_emergencia.html', **dados)
```

## Classes CSS Disponíveis

### Containers:
- `.relatorio-secao` - Seção do relatório
- `.secao-titulo` - Título de seção com ícone
- `.metricas-grid` - Grid de cards de métricas
- `.metrica-card` - Card individual de métrica
- `.grafico-area` - Área para gráficos

### Tabelas:
- `.tabela-relatorio` - Tabela principal
- `.total-row` - Linha de total (destaque)

### Utilitários:
- `.text-center`, `.text-right` - Alinhamento
- `.text-primary`, `.text-success`, `.text-warning`, `.text-danger` - Cores
- `.badge-primary`, `.badge-success`, etc. - Badges coloridos
- `.mt-1`, `.mt-2`, `.mt-3` - Margens top
- `.mb-1`, `.mb-2`, `.mb-3` - Margens bottom

### Especiais:
- `.observacoes-box` - Caixa de observações
- `.no-print` - Não aparece na impressão
- `.assinatura-area` - Área de assinaturas

## Funcionalidades

### Impressão:
- Botão "Imprimir" chama `window.print()`
- Estilos otimizados para impressão (@media print)
- Quebras de página inteligentes

### Exportação:
- Botão "Exportar PDF" (placeholder para implementar)
- Sugestão: usar html2pdf.js ou jsPDF

### Responsividade:
- Layout adaptável para diferentes tamanhos de tela
- Optimizado para papel A4 na impressão

## Próximos Passos Backend

1. Atualizar a rota `/administrador/relatorios/visualizar` em `routes.py`
2. Processar os parâmetros do formulário
3. Consultar o banco de dados conforme o tipo de relatório
4. Renderizar o template apropriado com os dados

## Ícones Sugeridos (Font Awesome)

- Emergência: `fas fa-ambulance`
- Produtividade: `fas fa-hospital`
- Observação: `fas fa-eye`
- Perfil de Paciente: `fas fa-user-md`
- Gráficos: `fas fa-chart-line`, `fas fa-chart-pie`, `fas fa-chart-area`
- Tabelas: `fas fa-table`
- Métricas: `fas fa-chart-pie`

