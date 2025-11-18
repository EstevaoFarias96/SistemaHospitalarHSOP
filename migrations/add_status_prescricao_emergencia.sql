-- Adicionar coluna status na tabela prescricoes_emergencia
ALTER TABLE prescricoes_emergencia
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pendente' NOT NULL;

-- Adicionar coluna farmaceutico_id para rastrear quem dispensou
ALTER TABLE prescricoes_emergencia
ADD COLUMN IF NOT EXISTS farmaceutico_id INTEGER REFERENCES funcionarios(id) ON UPDATE CASCADE;

-- Adicionar coluna data_dispensacao para rastrear quando foi dispensado
ALTER TABLE prescricoes_emergencia
ADD COLUMN IF NOT EXISTS data_dispensacao TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna observacoes para comentários da farmácia
ALTER TABLE prescricoes_emergencia
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Atualizar todas as prescrições existentes para status 'Pendente'
UPDATE prescricoes_emergencia
SET status = 'Pendente'
WHERE status IS NULL;

-- Criar índice para melhorar performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_prescricoes_emergencia_status ON prescricoes_emergencia(status);

COMMIT;
