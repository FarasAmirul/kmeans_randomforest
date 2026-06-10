const API_URL = "http://127.0.0.1:3000";

// ======================
// LOAD DATASET
// ======================

async function loadDataset() {

  const res = await fetch(
    `${API_URL}/api/dataset`
  );

  const data = await res.json();

  const table =
    document.getElementById(
      "datasetTable"
    );

  table.innerHTML = "";

  data.forEach(item => {

    table.innerHTML += `
      <tr>
        <td>${item.nama_pelanggan}</td>
        <td>${item.total_belanja}</td>
        <td>${item.frekuensi}</td>
      </tr>
    `;

  });

}

// ======================
// UPLOAD CSV
// ======================

async function uploadCSV() {

  const file =
    document.getElementById(
      "fileCSV"
    ).files[0];

  if (!file) {

    alert("Pilih file CSV terlebih dahulu");

    return;
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  const response =
    await fetch(
      `${API_URL}/api/upload-dataset`,
      {
        method: "POST",
        body: formData
      }
    );

  const result =
    await response.json();

  alert(result.message);

  loadDataset();

}

// ======================
// JALANKAN CLUSTERING
// ======================

async function jalankanClustering() {

  const response =
    await fetch(
      `${API_URL}/api/cluster`,
      {
        method: "POST"
      }
    );

  const result =
    await response.json();

  alert(result.message);

  loadClustering();

}

// ======================
// LOAD HASIL CLUSTER
// ======================

async function loadClustering() {

  const res =
    await fetch(
      `${API_URL}/api/clustering`
    );

  const data =
    await res.json();

  const table =
    document.getElementById(
      "clusterTable"
    );

  table.innerHTML = "";

  data.forEach(item => {

    let kategori =
      "Pelanggan Biasa";

    if (item.cluster == 0) {
      kategori =
        "Pelanggan Loyal";
    }

    if (item.cluster == 1) {
      kategori =
        "Pelanggan Potensial";
    }

    table.innerHTML += `
      <tr>
        <td>${item.dataset.nama_pelanggan}</td>
        <td>${item.dataset.total_belanja}</td>
        <td>${item.dataset.frekuensi}</td>
        <td>${item.cluster}</td>
        <td>${kategori}</td>
      </tr>
    `;

  });

}

loadDataset();
loadClustering();