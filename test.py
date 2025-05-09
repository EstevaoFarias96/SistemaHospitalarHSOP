from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)

@app.route('/')
def index():
    try:
        db.engine.connect()
        return "Conexão com o banco de dados realizada com sucesso!"
    except Exception as e:
        return f"Erro ao conectar ao banco de dados: {str(e)}"

if __name__ == '__main__':
    app.run(debug=True)