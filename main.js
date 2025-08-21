const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQCuU8m7m8Nr9Jzjva3QaI4r6DgsUWH7Yf5v7zAwCQKbloiYcFIlzn0XSUKJyEywt52A/exec';

const inputForm = document.getElementById('inputForm');
const opnameForm = document.getElementById('opnameForm');
const messageDiv = document.getElementById('message');
const opnameResultDiv = document.getElementById('opnameResult');

const tableConfigs = [
  { id: 'stokTable', sheetName: 'DATA_GUDANG', loadingId: 'loading-stok' },
  { id: 'masukTable', sheetName: 'BARANG_MASUK', loadingId: 'loading-masuk' },
  { id: 'keluarTable', sheetName: 'BARANG_KELUAR', loadingId: 'loading-keluar' },
  { id: 'opnameTable', sheetName: 'STOCK_OPNAME_REPORT', loadingId: 'loading-opname' }
];

async function fetchAndRenderTable(config) {
  const tableBody = document.querySelector(`#${config.id} tbody`);
  const loadingDiv = document.getElementById(config.loadingId);
  loadingDiv.style.display = 'block';
  tableBody.innerHTML = '';
  try {
    const response = await fetch(`${SCRIPT_URL}?sheet=${config.sheetName}`);
    const data = await response.json();
    
    if (data.status === 'error') {
      tableBody.innerHTML = `<tr><td colspan="4">${data.message}</td></tr>`;
      console.error('Apps Script Error:', data.message);
    } else if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const headerNames = headers.map(header => {
        const capitalized = header.charAt(0).toUpperCase() + header.slice(1);
        return capitalized.replace(/([A-Z])/g, ' $1').trim();
      });
      
      document.querySelector(`#${config.id} thead tr`).innerHTML = headerNames.map(h => `<th>${h}</th>`).join('');
      
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = headers.map(header => {
          let value = item[header] || '';
          if (header.includes('tanggal')) {
            try {
              const date = new Date(value);
              value = date.toLocaleDateString('id-ID');
            } catch (e) {}
          }
          return `<td>${value}</td>`;
        }).join('');
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="4">Tidak ada data di sheet ini.</td></tr>`;
    }
  } catch (error) {
    console.error(`Error fetching data for ${config.sheetName}:`, error);
    tableBody.innerHTML = `<tr><td colspan="4">Gagal memuat data.</td></tr>`;
  } finally {
    loadingDiv.style.display = 'none';
  }
}

async function fetchAllTables() {
  const promises = tableConfigs.map(config => fetchAndRenderTable(config));
  await Promise.all(promises);
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
      await fetchAllTables();
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
      await fetchAllTables();
    } else {
      opnameResultDiv.innerHTML = `<p class="error">${result.message}</p>`;
    }
  } catch (error) {
    console.error('Error performing stock opname:', error);
    opnameResultDiv.innerHTML = `<p class="error">Terjadi kesalahan saat melakukan stock opname.</p>`;
  }
});

// Muat semua tabel saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', fetchAllTables);
