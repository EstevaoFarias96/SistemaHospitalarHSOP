import fitz  # PyMuPDF

# Arquivo de entrada e saída
arquivo_pdf = r"C:\Users\Estevao\Desktop\AIHpdf.pdf"
arquivo_html = "saida_editada.html"

# Substituição desejada
texto_antigo = "Hospital X"
texto_novo = "Hospital Senador Ozires Pontes"

# Abrir o PDF
doc = fitz.open(arquivo_pdf)

# Início do HTML
html = "<html><body style='font-family: Arial; white-space: pre-wrap;'>"

# Para cada página, extrair o texto plano
for pagina in doc:
    texto = pagina.get_text("text")  # extrai como texto contínuo
    texto_substituido = texto.replace(texto_antigo, texto_novo)
    html += f"<pre>{texto_substituido}</pre><hr>"

html += "</body></html>"

# Salvar HTML final
with open(arquivo_html, "w", encoding="utf-8") as f:
    f.write(html)

print(f"HTML salvo em: {arquivo_html}")
