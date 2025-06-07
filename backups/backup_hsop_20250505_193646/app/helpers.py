from datetime import datetime
from db import db
from .models import HistoricoAtendimento

def registrar_historico(atendimento_id, status):
    novo_registro = HistoricoAtendimento(
         atendimento_id=atendimento_id,
         status=status,
         timestamp=datetime.utcnow()
    )
    db.session.add(novo_registro)
    db.session.commit()
