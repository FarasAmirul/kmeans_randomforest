from flask import Flask, request, jsonify
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
import pandas as pd

app = Flask(__name__)

# ================== KMEANS ==================
@app.route('/kmeans', methods=['POST'])
def kmeans():

    data = request.json

    df = pd.DataFrame(data)

    # Normalisasi Data
    scaler = MinMaxScaler()
    data_normalized = scaler.fit_transform(df)

    # K-Means Clustering
    model = KMeans(
        n_clusters=min(3, len(df)),
        random_state=42
    )

    df['cluster'] = model.fit_predict(data_normalized)

    return jsonify(df.to_dict(orient='records'))


# ================== RANDOM FOREST ==================
@app.route('/random-forest', methods=['POST'])
def random_forest():

    data = request.json

    print("DATA MASUK:")
    print(data)

    df = pd.DataFrame(data)

    print("DATAFRAME:")
    print(df)

    print("COLUMNS:")
    print(df.columns)

    # fitur yang digunakan untuk prediksi
    X = df[['stok', 'penjualan']]

    # target yang dipelajari model
    y = df['target_stok']

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    df['prediksi'] = model.predict(X)

    return jsonify(df.to_dict(orient='records'))

# ================== RUN ==================
import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)