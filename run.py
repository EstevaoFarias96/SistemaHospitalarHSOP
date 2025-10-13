import logging
import traceback
from app import create_app

# Configuração básica de log para capturar erros de startup
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("error.log"),
        logging.StreamHandler()
    ]
)

try:
    logging.info("Iniciando aplicação...")
    app = create_app()
    
    @app.route('/ping')
    def ping():
        return "pong"
    
    if __name__ == '__main__':
        logging.info("Executando aplicação Flask em modo debug")
        app.run(debug=True)
except Exception as e:
    logging.critical(f"Erro fatal durante inicialização: {str(e)}")
    logging.critical(traceback.format_exc())
    print(f"ERRO CRÍTICO: {e}")
    print("Verifique o arquivo error.log para detalhes completos")