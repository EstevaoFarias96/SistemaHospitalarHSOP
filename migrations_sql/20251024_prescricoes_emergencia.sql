-- Criação da tabela de prescrições de emergência (porta) e índices
-- Executar em PostgreSQL

CREATE TABLE IF NOT EXISTS prescricoes_emergencia (
  id BIGSERIAL PRIMARY KEY,
  atendimento_id VARCHAR(8) NOT NULL REFERENCES atendimentos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  medico_id INTEGER NOT NULL REFERENCES funcionarios(id) ON UPDATE CASCADE,
  enfermeiro_id INTEGER NULL REFERENCES funcionarios(id) ON UPDATE CASCADE,
  texto_dieta TEXT NULL,
  texto_procedimento_medico TEXT NULL,
  texto_procedimento_multi TEXT NULL,
  horario_prescricao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  medicamentos JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_presc_emerg_atendimento ON prescricoes_emergencia (atendimento_id);
CREATE INDEX IF NOT EXISTS idx_presc_emerg_medico ON prescricoes_emergencia (medico_id);
CREATE INDEX IF NOT EXISTS idx_presc_emerg_data ON prescricoes_emergencia (horario_prescricao DESC);
CREATE INDEX IF NOT EXISTS idx_presc_emerg_meds_gin ON prescricoes_emergencia USING GIN (medicamentos);


