#!/usr/bin/env python3
"""
Análise de Atendimentos por Turno - Setembro 2025
Este script analisa a distribuição percentual de atendimentos por turno (N/MT) 
especificamente para o mês de setembro de 2025.

Turnos:
- N (Noturno): 19:00 - 06:59
- MT (Matutino/Vespertino): 07:00 - 18:59
"""

import os
import sys
from datetime import datetime, time, date
from collections import Counter
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from sqlalchemy import extract

# Adiciona o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Atendimento
# from app.timezone_helper import now_brasilia

def determinar_turno(hora_atendimento):
    """
    Determina o turno baseado na hora do atendimento.
    
    Args:
        hora_atendimento: objeto time com a hora do atendimento
        
    Returns:
        str: 'N' para noturno (19:00-06:59) ou 'MT' para matutino/vespertino (07:00-18:59)
    """
    if hora_atendimento is None:
        return None
        
    hora = hora_atendimento.hour
    
    # Noturno: 19:00 até 06:59 do dia seguinte
    if hora >= 19 or hora < 7:
        return 'N'
    # Matutino/Vespertino: 07:00 até 18:59
    else:
        return 'MT'

def analisar_atendimentos_por_turno():
    """
    Analisa atendimentos de setembro de 2024 e calcula a distribuição por turno.
    """
    print("=" * 70)
    print("ANÁLISE DE ATENDIMENTOS POR TURNO - SETEMBRO 2025")
    print("=" * 70)
    print()
    
    # Consulta atendimentos apenas de setembro de 2025
    atendimentos = Atendimento.query.filter(
        extract('month', Atendimento.data_atendimento) == 9,
        extract('year', Atendimento.data_atendimento) == 2025
    ).all()
    
    if not atendimentos:
        print("❌ Nenhum atendimento encontrado para setembro de 2025.")
        return
    
    print(f"📊 Total de atendimentos em setembro/2025: {len(atendimentos)}")
    print()
    
    # Contadores
    turnos = []
    atendimentos_sem_hora = 0
    
    # Processa cada atendimento
    for atendimento in atendimentos:
        turno = determinar_turno(atendimento.hora_atendimento)
        
        if turno is None:
            atendimentos_sem_hora += 1
        else:
            turnos.append(turno)
    
    # Conta os turnos
    contador_turnos = Counter(turnos)
    total_com_horario = len(turnos)
    
    # Exibe resultados
    print("🕐 DISTRIBUIÇÃO POR TURNO:")
    print("-" * 30)
    
    if total_com_horario > 0:
        # Calcula percentuais
        percentual_n = (contador_turnos['N'] / total_com_horario) * 100
        percentual_mt = (contador_turnos['MT'] / total_com_horario) * 100
        
        print(f"🌙 Turno Noturno (N):      {contador_turnos['N']:5d} atendimentos ({percentual_n:.1f}%)")
        print(f"🌞 Turno Mat/Vesp (MT):   {contador_turnos['MT']:5d} atendimentos ({percentual_mt:.1f}%)")
        print(f"📈 Total com horário:     {total_com_horario:5d} atendimentos (100.0%)")
    else:
        print("❌ Nenhum atendimento com horário válido encontrado.")
    
    if atendimentos_sem_hora > 0:
        print(f"⚠️  Sem horário definido:  {atendimentos_sem_hora:5d} atendimentos")
    
    print()
    print("📋 RESUMO:")
    print("-" * 30)
    print(f"Total geral de atendimentos: {len(atendimentos)}")
    print(f"Atendimentos analisados:     {total_com_horario}")
    print(f"Atendimentos sem horário:    {atendimentos_sem_hora}")
    
    # Detalhamento por horário (opcional, para debug)
    print()
    print("🔍 DEFINIÇÃO DOS TURNOS:")
    print("-" * 30)
    print("🌙 Turno Noturno (N):      19:00 - 06:59")
    print("🌞 Turno Mat/Vesp (MT):    07:00 - 18:59")
    
    # Preparar dados para gráficos
    if total_com_horario > 0:
        dados_graficos = {
            'labels': ['Turno Noturno (N)', 'Turno Mat/Vesp (MT)'],
            'valores': [contador_turnos['N'], contador_turnos['MT']],
            'percentuais': [percentual_n, percentual_mt],
            'cores': ['#2E4057', '#F39C12']
        }
        gerar_graficos(dados_graficos, atendimentos)
    
    return {
        'total_atendimentos': len(atendimentos),
        'total_com_horario': total_com_horario,
        'atendimentos_sem_hora': atendimentos_sem_hora,
        'turno_n': contador_turnos['N'],
        'turno_mt': contador_turnos['MT'],
        'percentual_n': percentual_n if total_com_horario > 0 else 0,
        'percentual_mt': percentual_mt if total_com_horario > 0 else 0
    }

def gerar_graficos(dados, atendimentos):
    """
    Gera gráficos da distribuição de atendimentos por turno.
    """
    print("📊 Gerando gráficos...")
    
    # Configurar matplotlib para usar backend não-interativo
    plt.switch_backend('Agg')
    plt.style.use('default')
    
    # Criar figura com subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Análise de Atendimentos por Turno - Setembro 2025', fontsize=16, fontweight='bold')
    
    # 1. Gráfico de Pizza - Distribuição por Turno
    wedges, texts, autotexts = ax1.pie(
        dados['valores'], 
        labels=dados['labels'], 
        colors=dados['cores'],
        autopct='%1.1f%%',
        startangle=90,
        explode=(0.05, 0)
    )
    ax1.set_title('Distribuição Percentual por Turno', fontweight='bold')
    
    # 2. Gráfico de Barras - Quantidade por Turno
    bars = ax2.bar(dados['labels'], dados['valores'], color=dados['cores'], alpha=0.8)
    ax2.set_title('Quantidade de Atendimentos por Turno', fontweight='bold')
    ax2.set_ylabel('Número de Atendimentos')
    
    # Adicionar valores nas barras
    for bar in bars:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}',
                ha='center', va='bottom', fontweight='bold')
    
    # 3. Gráfico de Linha - Atendimentos por Dia do Mês
    atendimentos_por_dia = {}
    for atendimento in atendimentos:
        dia = atendimento.data_atendimento.day
        turno = determinar_turno(atendimento.hora_atendimento)
        
        if dia not in atendimentos_por_dia:
            atendimentos_por_dia[dia] = {'N': 0, 'MT': 0}
        
        if turno:
            atendimentos_por_dia[dia][turno] += 1
    
    dias = sorted(atendimentos_por_dia.keys())
    valores_n = [atendimentos_por_dia[dia]['N'] for dia in dias]
    valores_mt = [atendimentos_por_dia[dia]['MT'] for dia in dias]
    
    ax3.plot(dias, valores_n, marker='o', label='Noturno (N)', color='#2E4057', linewidth=2)
    ax3.plot(dias, valores_mt, marker='s', label='Mat/Vesp (MT)', color='#F39C12', linewidth=2)
    ax3.set_title('Atendimentos por Dia do Mês', fontweight='bold')
    ax3.set_xlabel('Dia de Setembro')
    ax3.set_ylabel('Número de Atendimentos')
    ax3.legend()
    ax3.grid(True, alpha=0.3)
    
    # 4. Gráfico de Barras Empilhadas - Distribuição por Semana
    import calendar
    
    # Calcular atendimentos por semana
    semanas = {}
    for atendimento in atendimentos:
        data = atendimento.data_atendimento
        # Primeira semana de setembro
        if data.day <= 7:
            semana = "1ª Semana"
        elif data.day <= 14:
            semana = "2ª Semana"
        elif data.day <= 21:
            semana = "3ª Semana"
        else:
            semana = "4ª Semana"
        
        turno = determinar_turno(atendimento.hora_atendimento)
        
        if semana not in semanas:
            semanas[semana] = {'N': 0, 'MT': 0}
        
        if turno:
            semanas[semana][turno] += 1
    
    semanas_ordenadas = ["1ª Semana", "2ª Semana", "3ª Semana", "4ª Semana"]
    valores_n_sem = [semanas.get(sem, {'N': 0, 'MT': 0})['N'] for sem in semanas_ordenadas]
    valores_mt_sem = [semanas.get(sem, {'N': 0, 'MT': 0})['MT'] for sem in semanas_ordenadas]
    
    width = 0.35
    ax4.bar(semanas_ordenadas, valores_n_sem, width, label='Noturno (N)', color='#2E4057', alpha=0.8)
    ax4.bar(semanas_ordenadas, valores_mt_sem, width, bottom=valores_n_sem, 
            label='Mat/Vesp (MT)', color='#F39C12', alpha=0.8)
    
    ax4.set_title('Distribuição por Semana do Mês', fontweight='bold')
    ax4.set_ylabel('Número de Atendimentos')
    ax4.legend()
    
    # Adicionar valores nas barras empilhadas
    for i, (n, mt) in enumerate(zip(valores_n_sem, valores_mt_sem)):
        total = n + mt
        if total > 0:
            ax4.text(i, total + 0.5, str(total), ha='center', va='bottom', fontweight='bold')
    
    # Ajustar layout
    plt.tight_layout()
    
    # Salvar gráfico
    arquivo_grafico = 'atendimentos_turnos_setembro_2025.png'
    plt.savefig(arquivo_grafico, dpi=300, bbox_inches='tight')
    print(f"📈 Gráficos salvos em: {arquivo_grafico}")
    
    # Fechar figura para liberar memória
    plt.close(fig)

def main():
    """Função principal"""
    app = create_app()
    
    with app.app_context():
        try:
            resultados = analisar_atendimentos_por_turno()
            print()
            print("✅ Análise concluída com sucesso!")
            
        except Exception as e:
            print(f"❌ Erro durante a análise: {str(e)}")
            return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())