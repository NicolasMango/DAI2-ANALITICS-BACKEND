import joblib
import pandas as pd
from flask import Flask, request, jsonify
import os 

print("Directorio actual de trabajo:", os.getcwd())

app = Flask(__name__)

model_path = os.path.join(os.path.dirname(__file__), 'modelo.pkl')
model = joblib.load(model_path)
# Cargar el modelo entrenado y el preprocesador
#model = joblib.load("modelo.pkl")  # Asegúrate de que este archivo existe

prepoc_path = os.path.join(os.path.dirname(__file__), 'preprocesador.pkl')
preprocessor = joblib.load(prepoc_path)  # Si tienes un preprocesador, también lo cargas

@app.route('/')
def home():
    return "API de predicción de ventas de entradas"

@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        # Obtener datos JSON enviados en la solicitud
        data = request.json
        
        # Convertir a DataFrame de pandas para procesar
        df = pd.DataFrame([data])

        # Preprocesar los datos
        datos_preprocesados = preprocessor.transform(df)

        # Hacer la predicción
        prediccion = model.predict(datos_preprocesados)

        # Devolver la predicción como JSON
        return jsonify({
            'prediccion': round(prediccion[0], 0)
        })

    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Ejecuta siempre en el puerto 5000