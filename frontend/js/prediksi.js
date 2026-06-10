const API_URL = "https://binaphoto-backend.onrender.com";

// =====================
// LOAD DATA PREDIKSI
// =====================
async function loadPrediksi() {

  try {

    const res = await fetch(
      `${API_URL}/api/prediksi`
    );

    const data = await res.json();

    const table =
      document.getElementById(
        "prediksiTable"
      );

    table.innerHTML = "";

    data.forEach(item => {

      const prediksi =
        item.prediksi
          ? Number(item.prediksi).toFixed(2)
          : "-";

      let status = "-";

if (item.prediksi !== null) {

  const prediksi =
    Number(item.prediksi);

  const stok =
    Number(item.stok);

  if (prediksi > stok) {

    status =
      '<span class="badge-restok">Perlu Restok</span>';

  }

  else if (prediksi === stok) {

    status =
      '<span class="badge-sesuai">Sesuai</span>';

  }

  else {

    status =
      '<span class="badge-aman">Stok Aman</span>';

  }

}

      table.innerHTML += `
        <tr>
          <td>${item.nama_barang}</td>
          <td>${item.stok}</td>
          <td>${item.penjualan}</td>
          <td>${item.target_stok}</td>
          <td>${prediksi}</td>
          <td>${status}</td>
        </tr>
      `;

    });

  }

  catch (err) {

    console.error(err);

  }

}

// =====================
// UPLOAD CSV BARANG
// =====================
async function uploadBarang() {

  try {

    const file =
      document.getElementById(
        "fileBarang"
      ).files[0];

    if (!file) {

      alert("Pilih file CSV terlebih dahulu");
      return;

    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    const response = await fetch(
      `${API_URL}/api/upload-prediksi`,
      {
        method: "POST",
        body: formData
      }
    );

    const result =
      await response.json();

    if (!response.ok) {

      alert(result.error);
      return;

    }

    alert(result.message);

    loadPrediksi();

  }

  catch (err) {

    console.error(err);

  }

}

// =====================
// JALANKAN PREDIKSI
// =====================
async function jalankanPrediksi() {

  try {

    const response =
      await fetch(
        `${API_URL}/api/predict`,
        {
          method: "POST"
        }
      );

    const result =
      await response.json();

    alert(result.message);

    loadPrediksi();

  }

  catch (err) {

    console.error(err);

  }

}

loadPrediksi();