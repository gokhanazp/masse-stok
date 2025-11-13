import axios from 'axios';

/**
 * Google Sheets veri servisi
 * Stok ve ürün bilgilerini Google Sheets'ten çeker
 */

// Google Sheets bilgileri
const SHEET_ID = '1VW74IXsznyCe8WhlJVeZ5rX_GfC9addbstpBwWjvX38';
const STOCK_GID = '414382839'; // Stok sayfası GID
const PRODUCT_GID = '1860445418'; // Ürünler sayfası GID

// CSV export URL'leri
const STOCK_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${STOCK_GID}`;
const PRODUCT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${PRODUCT_GID}`;

/**
 * CSV metnini parse eder ve obje dizisine çevirir
 * Tırnak içindeki virgülleri doğru işler
 * @param {string} csvText - CSV metni
 * @returns {Array} - Parse edilmiş veri dizisi
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // CSV satırını parse et (tırnak içindeki virgülleri göz ardı et)
  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // İlk satır başlıklar
  const headers = parseLine(lines[0]);

  // Veri satırları
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Sadece ürün kodu olan satırları ekle
    if (row['Ürün Kodu'] && row['Ürün Kodu'].trim()) {
      data.push(row);
    }
  }

  return data;
}

/**
 * Stok verilerini Google Sheets'ten çeker
 * @returns {Promise<Array>} - Stok verileri
 */
export async function fetchStockData() {
  try {
    console.log('📦 Stok verileri çekiliyor...');
    
    const response = await axios.get(STOCK_URL, {
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
    });

    const stockData = parseCSV(response.data);
    console.log(`✅ ${stockData.length} stok verisi yüklendi`);
    
    return stockData;
  } catch (error) {
    console.error('❌ Stok verileri yüklenirken hata:', error.message);
    throw new Error('Stok verileri yüklenemedi');
  }
}

/**
 * Ürün bilgilerini Google Sheets'ten çeker
 * Sütunlar: Urun-Kodu, UrunAdi, Marka, ParaBirimi, price3, ImageURL1
 * @returns {Promise<Array>} - Ürün bilgileri
 */
export async function fetchProductData() {
  try {
    console.log('🛍️ Ürün bilgileri çekiliyor...');

    const response = await axios.get(PRODUCT_URL, {
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
    });

    const csvText = response.data;

    // CSV'yi daha güvenli parse et - satır içi \n karakterlerini handle et
    function parseCSV(text) {
      const rows = [];
      let currentRow = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Çift tırnak ("") = tek tırnak karakteri
            currentField += '"';
            i++; // Bir sonraki tırnağı atla
          } else {
            // Tırnak aç/kapa
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Alan sonu
          currentRow.push(currentField.trim());
          currentField = '';
        } else if (char === '\n' && !inQuotes) {
          // Satır sonu (tırnak içinde değilse)
          currentRow.push(currentField.trim());
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        } else if (char === '\r') {
          // \r karakterini atla
          continue;
        } else {
          currentField += char;
        }
      }

      // Son satırı ekle
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
      }

      return rows;
    }

    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      console.log('⚠️ Ürün verisi boş');
      return [];
    }

    // İlk satır başlıklar
    const headers = rows[0];
    console.log('📋 Ürün sütunları:', headers);

    // Veri satırları
    const productData = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Sadece ürün kodu olan satırları ekle
      if (row['Urun-Kodu'] && row['Urun-Kodu'].trim()) {
        productData.push(row);
      }
    }

    console.log(`✅ ${productData.length} ürün bilgisi yüklendi`);
    return productData;
  } catch (error) {
    console.error('❌ Ürün bilgileri yüklenirken hata:', error.message);
    return [];
  }
}

/**
 * Ürün koduna göre stok bilgisi arar
 * @param {Array} stockData - Stok verileri
 * @param {string} productCode - Ürün kodu
 * @returns {Object|null} - Bulunan stok bilgisi veya null
 */
export function searchStockByCode(stockData, productCode) {
  if (!productCode || !stockData) {
    console.log('❌ Arama için gerekli veri yok');
    return null;
  }

  const searchCode = productCode.trim().toUpperCase();
  console.log(`🔍 Aranan kod: "${searchCode}"`);
  console.log(`📊 Toplam ${stockData.length} ürün içinde aranıyor...`);

  const result = stockData.find(item =>
    item['Ürün Kodu'] && item['Ürün Kodu'].toUpperCase() === searchCode
  );

  if (result) {
    console.log('✅ Ürün bulundu:', result['Ürün Kodu']);
  } else {
    console.log('❌ Ürün bulunamadı');
    // İlk 5 ürün kodunu göster
    console.log('📋 İlk 5 ürün kodu:', stockData.slice(0, 5).map(item => item['Ürün Kodu']));
  }

  return result;
}

/**
 * Ürün koduna göre ürün bilgisi arar
 * @param {Array} productData - Ürün verileri
 * @param {string} productCode - Ürün kodu
 * @returns {Object|null} - Bulunan ürün bilgisi veya null
 */
export function searchProductByCode(productData, productCode) {
  if (!productCode || !productData || productData.length === 0) return null;

  const searchCode = productCode.trim().toUpperCase();
  const result = productData.find(item =>
    item['Urun-Kodu'] && item['Urun-Kodu'].toUpperCase() === searchCode
  );

  if (result) {
    console.log('🛍️ Ürün bilgisi bulundu:', result['UrunAdi']);
  } else {
    console.log('⚠️ Ürün bilgisi bulunamadı');
  }

  return result;
}

/**
 * Stok bilgisini formatlar
 * @param {Object} stockItem - Stok verisi
 * @returns {Object} - Formatlanmış stok bilgisi
 */
export function formatStockInfo(stockItem) {
  if (!stockItem) return null;

  // Mağaza stok bilgilerini al (B-I sütunları)
  const stores = ['Masse', 'Grohe', 'Yutas', 'Yilmazlar', 'Eroglu', 'Evdema', 'Algi', 'Ark'];
  const storeStocks = stores.map(storeName => ({
    storeName,
    stock: parseInt(stockItem[storeName] || '0', 10)
  }));

  // Toplam stoku kendimiz hesaplayalım (Google Sheets'teki sütun güvenilir değil)
  const calculatedTotalStock = storeStocks.reduce((sum, store) => sum + store.stock, 0);

  console.log(`📊 ${stockItem['Ürün Kodu']} - Hesaplanan toplam stok: ${calculatedTotalStock}`);

  return {
    productCode: stockItem['Ürün Kodu'],
    storeStocks,
    totalStock: calculatedTotalStock // Hesaplanan toplam stok
  };
}

