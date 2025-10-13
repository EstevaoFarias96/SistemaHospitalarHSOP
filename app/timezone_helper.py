"""
Utilitários para conversão de timezone
"""

from datetime import datetime
from zoneinfo import ZoneInfo

def converter_para_brasilia(datetime_utc):
    """
    Converte um datetime UTC para horário de Brasília
    """
    if datetime_utc is None:
        return None
    
    # Se já tem timezone info
    if datetime_utc.tzinfo is not None:
        # Converte para horário de Brasília
        return datetime_utc.astimezone(ZoneInfo("America/Sao_Paulo"))
    else:
        # Assume que é UTC e adiciona timezone
        datetime_utc = datetime_utc.replace(tzinfo=ZoneInfo("UTC"))
        return datetime_utc.astimezone(ZoneInfo("America/Sao_Paulo"))

def formatar_datetime_br(datetime_obj, formato='%Y-%m-%d %H:%M'):
    """
    Formata um datetime em horário brasileiro
    """
    if datetime_obj is None:
        return None
    
    # Converte para horário brasileiro
    datetime_br = converter_para_brasilia(datetime_obj)
    
    # Formata e retorna
    return datetime_br.strftime(formato)

def formatar_datetime_br_completo(datetime_obj):
    """
    Formata um datetime em horário brasileiro com segundos
    """
    return formatar_datetime_br(datetime_obj, '%Y-%m-%d %H:%M:%S')

def formatar_data_br(datetime_obj):
    """
    Formata apenas a data em formato brasileiro (DD/MM/YYYY)
    """
    if datetime_obj is None:
        return None
    
    datetime_br = converter_para_brasilia(datetime_obj)
    return datetime_br.strftime('%d/%m/%Y')

def formatar_hora_br(datetime_obj):
    """
    Formata apenas a hora em formato brasileiro (HH:MM)
    """
    if datetime_obj is None:
        return None
    
    datetime_br = converter_para_brasilia(datetime_obj)
    return datetime_br.strftime('%H:%M') 