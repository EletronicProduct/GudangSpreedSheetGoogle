const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydyeO6V2XSdD1WmR4x63wyVI8b1wb-WxIeosz5hJ0iY6_UfGSZkWsvw5ZQQ-MPj8at-w/exec';

const inputForm = document.getElementById('inputForm');
const opnameForm = document.getElementById('opnameForm');
const messageDiv = document.getElementById('message');
const opnameResultDiv = document.getElementById('opnameResult');
const tableBody = document.querySelector('#stokTable tbody');
const loadingDiv = document.getElementById('loading');

// Fungsi untuk mengambil dan menampilkan data gudang
async function fetchStokData() {
  loadingDiv.style.display = 'block';
  tableBody.innerHTML = '';
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    
    if (data.length > 0) {
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
                            <td>${item.kodebarang}</td>
                            <td>${item.namabarang}</td>
                            <td>${item.stokakhir}</td>
                        `;
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = '<tr><td colspan="3">Tidak ada data stok.</td></tr>';
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    tableBody.innerHTML = '<tr><td colspan="3">Gagal memuat data. Periksa Apps Script.</td></tr>';
  } finally {
    loadingDiv.style.display = 'none';
  }
}

// Fungsi untuk mengirim data form barang masuk/keluar
inputForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageDiv.textContent = 'Menyimpan data...';
  const formData = new FormData(inputForm);
  const data = {
    sheet: formData.get('dataType'),
    tanggal: formData.get('tanggal'),
    kode: formData.get('kode').toUpperCase(),
    jumlah: parseInt(formData.get('jumlah')),
    supplierPembeli: formData.get('supplierPembeli')
  };
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'text/plain' }
    });
    const result = await response.json();
    
    if (result.status === 'success') {
      messageDiv.className = 'success';
      messageDiv.textContent = result.message;
      inputForm.reset();
      await fetchStokData();
    } else {
      messageDiv.className = 'error';
      messageDiv.textContent = result.message;
    }
  } catch (error) {
    console.error('Error submitting data:', error);
    messageDiv.className = 'error';
    messageDiv.textContent = 'Terjadi kesalahan saat menyimpan data.';
  }
});

// Fungsi untuk mengirim data form stock opname
opnameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  opnameResultDiv.innerHTML = '<p>Mengecek data...</p>';
  const formData = new FormData(opnameForm);
  const dataToSend = {
    action: 'stockOpname',
    kode: formData.get('kodeOpname').toUpperCase(),
    jumlahFisik: parseInt(formData.get('jumlahFisik'))
  };
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(dataToSend),
      headers: { 'Content-Type': 'text/plain' }
    });
    const result = await response.json();
    
    if (result.status === 'success') {
      const selisih = result.selisih;
      const message = selisih === 0 ? `Tidak ada selisih. Stok sama.` : `Ada selisih sebesar ${selisih} unit.`;
      
      opnameResultDiv.innerHTML = `
                        <h4>Hasil Stock Opname untuk Kode Barang: ${result.kode}</h4>
                        <p>Stok Sistem: ${result.stokSistem}</p>
                        <p>Stok Fisik: ${result.stokFisik}</p>
                        <p>Selisih: ${selisih}</p>
                        <p class="success">${message}</p>
                    `;
      opnameForm.reset();
    } else {
      opnameResultDiv.innerHTML = `<p class="error">${result.message}</p>`;
    }
  } catch (error) {
    console.error('Error performing stock opname:', error);
    opnameResultDiv.innerHTML = `<p class="error">Terjadi kesalahan saat melakukan stock opname.</p>`;
  }
});

// Muat data saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', fetchStokData);