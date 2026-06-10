const API_URL = "http://localhost:3000";

async function loadDashboard() {

  try {

    // DATASET PELANGGAN
    const pelangganRes =
      await fetch(`${API_URL}/api/dataset`);

    const pelanggan =
      await pelangganRes.json();

    document.getElementById(
      "totalPelanggan"
    ).innerText = pelanggan.length;

    // CLUSTER
    const clusterRes =
      await fetch(`${API_URL}/api/clustering`);

    const cluster =
      await clusterRes.json();

    document.getElementById(
      "totalCluster"
    ).innerText = cluster.length;

    // BARANG
    const barangRes =
      await fetch(`${API_URL}/api/prediksi`);

    const barang =
      await barangRes.json();

    document.getElementById(
      "totalBarang"
    ).innerText = barang.length;

    document.getElementById(
      "totalPrediksi"
    ).innerText = barang.length;

  }

  catch (err) {

    console.error(err);

  }

}

loadDashboard();