import os
import zipfile
import datetime
import shutil

def create_backup():
    # Obter data e hora atual para o nome do arquivo
    data_hora = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    nome_backup = f"backup_hsop_{data_hora}.zip"
    
    # Diretórios e arquivos a serem excluídos do backup
    excluir = [
        '__pycache__', 
        '.git',
        '.vscode',
        '*.pyc',
        '*.zip',
        '*.log'
    ]
    
    # Criar o arquivo ZIP
    with zipfile.ZipFile(nome_backup, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for pasta_atual, subpastas, arquivos in os.walk('.'):
            # Verificar se a pasta atual deve ser ignorada
            if any(ex in pasta_atual for ex in excluir if not ex.startswith('*')):
                continue
                
            for arquivo in arquivos:
                caminho_arquivo = os.path.join(pasta_atual, arquivo)
                
                # Verificar se o arquivo deve ser ignorado por extensão
                if any(arquivo.endswith(ex.replace('*', '')) for ex in excluir if ex.startswith('*')):
                    continue
                    
                # Adicionar o arquivo ao ZIP
                print(f"Adicionando: {caminho_arquivo}")
                zipf.write(caminho_arquivo)
    
    print(f"\nBackup criado com sucesso: {nome_backup}")
    print(f"Tamanho do backup: {os.path.getsize(nome_backup) / (1024*1024):.2f} MB")
    
    # Mover o backup para a pasta backups
    os.makedirs('backups', exist_ok=True)
    shutil.move(nome_backup, os.path.join('backups', nome_backup))
    print(f"Backup movido para: backups/{nome_backup}")

if __name__ == "__main__":
    create_backup() 