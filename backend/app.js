import express from 'express';
import axios from 'axios';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import cors from 'cors';

import { supabase } from './supabase.js';

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: 'uploads/'
});

// ================== ROOT ==================
app.get('/', (req, res) => {
  res.send('Backend jalan 🚀');
});

// ================== UPLOAD CSV DATASET ==================
app.post('/api/upload-dataset', upload.single('file'), async (req, res) => {
  try {

    const results = [];
    let csvError = null;

    fs.createReadStream(req.file.path)
      .pipe(csv())

      .on('data', (data) => {

        // Validasi kolom CSV
        if (
          data.nama_pelanggan === undefined ||
          data.total_belanja === undefined ||
          data.frekuensi === undefined
        ) {
          csvError =
            'Format CSV tidak sesuai. Gunakan kolom total_belanja dan frekuensi';
          return;
        }

        const total_belanja = Number(data.total_belanja);
        const frekuensi = Number(data.frekuensi);

        // Validasi angka
        
        if (
  isNaN(total_belanja) ||
  isNaN(frekuensi)
) {

  csvError =
    `Data tidak valid pada pelanggan ${data.nama_pelanggan}`;

  return;
}

        results.push({
          nama_pelanggan: data.nama_pelanggan,
          total_belanja,
          frekuensi
        });

      })

      .on('end', async () => {

        // Jika ada error validasi CSV
        if (csvError) {

          fs.unlinkSync(req.file.path);

          return res.status(400).json({
            error: csvError
          });

        }

        // CSV kosong
        if (results.length === 0) {

          fs.unlinkSync(req.file.path);

          return res.status(400).json({
            error: 'File CSV kosong'
          });

        }

        // ==========================
        // HAPUS HASIL CLUSTER LAMA
        // ==========================
        await supabase
          .from('clustering')
          .delete()
          .neq('id', 0);

        // ==========================
        // HAPUS DATASET LAMA
        // ==========================
        await supabase
          .from('dataset')
          .delete()
          .neq('id', 0);

        // ==========================
        // INSERT DATASET BARU
        // ==========================
        const { error } = await supabase
          .from('dataset')
          .insert(results);

        fs.unlinkSync(req.file.path);

        if (error) {

          return res.status(500).json({
            error: error.message
          });

        }

        res.json({
          message: 'Dataset lama diganti dengan dataset baru',
          total_data: results.length
        });

      })

      .on('error', (err) => {

        fs.unlinkSync(req.file.path);

        return res.status(500).json({
          error: err.message
        });

      });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});
// ================== POST DATASET ==================
app.post('/api/dataset', async (req, res) => {
  try {

    const {
      nama_pelanggan,
      total_belanja,
      frekuensi
    } = req.body;

    const { data, error } = await supabase
      .from('dataset')
      .insert([{
        nama_pelanggan,
        total_belanja,
        frekuensi
      }])
      .select();

    if (error) throw error;

    res.json({
      message: 'Data berhasil disimpan',
      data
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});

// ================== GET DATASET ==================
app.get('/api/dataset', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dataset')
      .select('*');

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== CLUSTERING ==================
app.post('/api/cluster', async (req, res) => {
  try {

    const { data, error } = await supabase
      .from('dataset')
      .select('id, nama_pelanggan, total_belanja, frekuensi');

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(400).json({
        error: 'Dataset kosong'
      });
    }

    const dataKirim = data.map(d => ({
      total_belanja: d.total_belanja,
      frekuensi: d.frekuensi
    }));

    const response = await axios.post(
      'hhttps://binaphoto-ml.onrender.com/kmeans',
      dataKirim
    );

    const hasilCluster = response.data;

    const dataInsert = hasilCluster.map((item, index) => ({
      dataset_id: data[index].id,
      cluster: item.cluster
    }));

    await supabase
      .from('clustering')
      .delete()
      .neq('id', 0);

    const { error: insertError } = await supabase
      .from('clustering')
      .insert(dataInsert);

    if (insertError) throw insertError;

    res.json({
      message: 'Clustering berhasil & disimpan',
      data: dataInsert
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ================== GET CLUSTERING ==================
app.get('/api/clustering', async (req, res) => {
  try {

    const { data, error } = await supabase
      .from('clustering')
      .select(`
        id,
        cluster,
        dataset:dataset_id (
          nama_pelanggan,
          total_belanja,
          frekuensi
        )
      `);

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ================== UPLOAD CSV PREDIKSI ==================
app.post('/api/upload-prediksi', upload.single('file'), async (req, res) => {
  try {

    const results = [];
    let csvError = null;

    fs.createReadStream(req.file.path)
      .pipe(csv())

      .on('data', (data) => {

        if (
          data.nama_barang === undefined ||
          data.stok === undefined ||
          data.penjualan === undefined ||
          data.target_stok === undefined
        ) {
          csvError =
            'Format CSV harus: nama_barang, stok, penjualan, target_stok';
          return;
        }

        const stok = Number(data.stok);
        const penjualan = Number(data.penjualan);
        const target_stok = Number(data.target_stok);

        if (
          isNaN(stok) ||
          isNaN(penjualan) ||
          isNaN(target_stok)
        ) {
          csvError =
            'stok, penjualan, dan target_stok harus berupa angka';
          return;
        }

        results.push({
          nama_barang: data.nama_barang,
          stok,
          penjualan,
          target_stok
        });

      })

      .on('end', async () => {

        if (csvError) {

          fs.unlinkSync(req.file.path);

          return res.status(400).json({
            error: csvError
          });

        }

        if (results.length === 0) {

          fs.unlinkSync(req.file.path);

          return res.status(400).json({
            error: 'File CSV kosong'
          });

        }

        // Hapus data lama
        await supabase
          .from('prediksi')
          .delete()
          .neq('id', 0);

        // Simpan data baru
        const { error } = await supabase
          .from('prediksi')
          .insert(results);

        fs.unlinkSync(req.file.path);

        if (error) {

          return res.status(500).json({
            error: error.message
          });

        }

        res.json({
          message: 'Data barang berhasil diupload',
          total_data: results.length
        });

      })

      .on('error', (err) => {

        fs.unlinkSync(req.file.path);

        return res.status(500).json({
          error: err.message
        });

      });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});

// ================== GET DATA PREDIKSI ==================
app.get('/api/prediksi', async (req, res) => {
  try {

    const { data, error } = await supabase
      .from('prediksi')
      .select('*');

    if (error) throw error;

    res.json(data);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});

// ================== RANDOM FOREST ==================
app.post('/api/predict', async (req, res) => {

  try {

    const { data, error } = await supabase
      .from('prediksi')
      .select('*');

    if (error) throw error;

    const response = await axios.post(
      'https://binaphoto-ml.onrender.com/random-forest',
      data
    );

    const hasilPrediksi = response.data;

    for (const item of hasilPrediksi) {

      await supabase
        .from('prediksi')
        .update({
          prediksi: item.prediksi
        })
        .eq('id', item.id);

    }

    res.json({
      message: 'Prediksi berhasil',
      data: hasilPrediksi
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ================== RUN SERVER ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});