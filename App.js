import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import {
  fetchStockData,
  fetchProductData,
  searchStockByCode,
  searchProductByCode,
  formatStockInfo,
} from './services/dataService';

/**
 * Ana uygulama bileşeni
 * Stok arama ve ürün bilgisi görüntüleme
 */
function AppContent() {
  // State tanımlamaları
  const [stockData, setStockData] = useState([]); // Stok verileri
  const [productData, setProductData] = useState([]); // Ürün verileri
  const [searchCode, setSearchCode] = useState(''); // Arama input
  const [searchResult, setSearchResult] = useState(null); // Arama sonucu (stok)
  const [productInfo, setProductInfo] = useState(null); // Ürün bilgisi
  const [loading, setLoading] = useState(true); // Yükleme durumu
  const [searching, setSearching] = useState(false); // Arama durumu
  const [refreshing, setRefreshing] = useState(false); // Manuel yenileme durumu
  const [lastUpdateTime, setLastUpdateTime] = useState(null); // Son güncelleme zamanı

  // Uygulama başladığında verileri yükle
  useEffect(() => {
    loadData();
  }, []);

  // Her gün sabah 10'da otomatik güncelleme
  useEffect(() => {
    const checkAndUpdate = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Sabah 10:00 - 10:05 arasında güncelle (5 dakikalık pencere)
      if (hours === 10 && minutes < 5) {
        const lastUpdate = lastUpdateTime ? new Date(lastUpdateTime) : null;
        const today = new Date().toDateString();

        // Bugün henüz güncelleme yapılmadıysa
        if (!lastUpdate || lastUpdate.toDateString() !== today) {
          console.log('🕙 Sabah 10:00 otomatik güncelleme başlatılıyor...');
          loadData();
        }
      }
    };

    // Her dakika kontrol et
    const interval = setInterval(checkAndUpdate, 60000); // 60 saniye

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  /**
   * Stok ve ürün verilerini yükler
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // Stok verilerini yükle (zorunlu)
      const stocks = await fetchStockData();
      setStockData(stocks);

      // Ürün bilgilerini yükle (opsiyonel)
      const products = await fetchProductData();
      setProductData(products);

      // Son güncelleme zamanını kaydet
      const now = new Date();
      setLastUpdateTime(now);
      console.log('✅ Veriler güncellendi:', now.toLocaleString('tr-TR'));

    } catch (error) {
      Alert.alert(
        'Hata',
        'Veriler yüklenemedi. Lütfen internet bağlantınızı kontrol edin.',
        [{ text: 'Tekrar Dene', onPress: loadData }]
      );
      console.error('❌ Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manuel yenileme fonksiyonu
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Manuel yenileme başlatıldı...');
      await loadData();
      Alert.alert('Başarılı', 'Veriler güncellendi!');
    } catch (error) {
      console.error('❌ Yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Ürün kodu ile arama yapar
   */
  const handleSearch = () => {
    if (!searchCode.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir ürün kodu girin.');
      return;
    }

    setSearching(true);

    // Stok bilgisini ara
    const stock = searchStockByCode(stockData, searchCode);

    // Ürün bilgisini ara
    const product = searchProductByCode(productData, searchCode);

    if (stock) {
      const formattedStock = formatStockInfo(stock);
      setSearchResult(formattedStock);
      setProductInfo(product);
    } else {
      setSearchResult(null);
      setProductInfo(null);
      Alert.alert('Sonuç Bulunamadı', 'Bu ürün kodu için bilgi bulunamadı.');
    }

    setSearching(false);
  };

  /**
   * Arama sonuçlarını temizler
   */
  const handleClear = () => {
    setSearchCode('');
    setSearchResult(null);
    setProductInfo(null);
  };

  // Yükleme ekranı
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render fonksiyonu - Header ve arama bölümü
  const renderHeader = () => (
    <>
      {/* Header - Logo */}
      <View style={styles.header}>
        {Platform.OS === 'web' ? (
          <img
            src="https://masseyapi.com/Data/EditorFiles/Masse_Logo_Blue_a.svg"
            alt="Masse Logo"
            style={{ width: 180, height: 50 }}
          />
        ) : (
          <SvgUri
            width="180"
            height="50"
            uri="https://masseyapi.com/Data/EditorFiles/Masse_Logo_Blue_a.svg"
          />
        )}
      </View>

      {/* Arama Bölümü */}
      <View style={styles.searchSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Stok Arama</Text>

          {/* Yenileme Butonu */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0066CC" />
            ) : (
              <Text style={styles.refreshButtonText}>🔄 Yenile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Son Güncelleme Zamanı */}
        {lastUpdateTime && (
          <Text style={styles.lastUpdateText}>
            Son güncelleme: {new Date(lastUpdateTime).toLocaleString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Ürün Kodu Girin"
          value={searchCode}
          onChangeText={setSearchCode}
          autoCapitalize="characters"
          onSubmitEditing={handleSearch}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.searchButton]}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Ara</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <Text style={styles.buttonText}>Temizle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sonuç Başlığı */}
      {searchResult && (
        <View style={styles.resultHeader}>
          {/* Ürün Bilgisi - Yeni Tasarım */}
          <View style={styles.productCard}>
            {/* Üst Kısım - Fotoğraf ve Bilgiler Yan Yana */}
            <View style={styles.productTopRow}>
              {/* Sol - Fotoğraf */}
              {productInfo && productInfo['ImageURL1'] && (
                <Image
                  source={{ uri: productInfo['ImageURL1'] }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              )}

              {/* Sağ - Ürün Adı ve Fiyat */}
              <View style={styles.productInfo}>
                {productInfo && (
                  <>
                    <Text style={styles.productName} numberOfLines={2}>
                      {productInfo['UrunAdi'] || 'Ürün Adı Yok'}
                    </Text>
                    <Text style={styles.productPrice}>
                      {productInfo['price3'] || '0'} {productInfo['ParaBirimi'] || 'TL'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Alt Kısım - Ürün Kodu ve Toplam Stok (Fotoğrafın Altından Başlıyor) */}
            <View style={styles.productMetaContainer}>
              <View style={styles.productMetaItem}>
                <Text style={styles.productMetaLabel}>Ürün Kodu</Text>
                <Text style={styles.productMetaValue}>{searchResult.productCode}</Text>
              </View>
              <View style={styles.productMetaItem}>
                <Text style={styles.productMetaLabel}>Toplam Stok</Text>
                <Text style={[
                  styles.productMetaValue,
                  styles.totalStockHighlight,
                  searchResult.totalStock === 0 && styles.totalStockZero
                ]}>
                  {searchResult.totalStock}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {searchResult ? (
        // Sonuç varsa FlatList kullan
        <FlatList
          ListHeaderComponent={
            <>
              {renderHeader()}
              {/* Mağaza Stokları Başlık */}
              <View style={styles.storeListHeader}>
                <Text style={styles.storeListTitle}>Mağaza Stokları</Text>
              </View>
            </>
          }
          data={searchResult.storeStocks}
          keyExtractor={(item) => item.storeName}
          renderItem={({ item }) => (
            <View style={styles.storeRow}>
              <Text style={[
                styles.storeName,
                item.stock === 0 && styles.storeNameOutOfStock
              ]}>
                {item.storeName}
              </Text>
              <Text style={[
                styles.storeStock,
                item.stock > 0 ? styles.inStock : styles.outOfStock
              ]}>
                {item.stock}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      ) : (
        // Sonuç yoksa sadece header göster
        <ScrollView>
          {renderHeader()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    height: 80,
  },
  listContent: {
    paddingHorizontal: 8, // Sol ve sağ boşlukları azalttık
    paddingBottom: 16,
  },
  searchSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8, // Sol ve sağ boşlukları azalttık (16'dan 8'e)
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#0066CC',
  },
  clearButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultHeader: {
    marginHorizontal: 8, // Sol ve sağ boşlukları azalttık (16'dan 8'e)
    marginTop: 0,
    marginBottom: 8,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'column', // Dikey düzen - üstte fotoğraf+bilgi, altta kod+stok
  },
  productTopRow: {
    flexDirection: 'row', // Fotoğraf ve bilgiler yan yana
    alignItems: 'flex-start',
    marginBottom: 16, // Alt kısımla arasında boşluk
  },
  productImage: {
    width: 120,
    height: 120,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1, // Kalan alanı kapla
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  productMetaContainer: {
    flexDirection: 'row', // Yan yana
    justifyContent: 'space-between',
    gap: 8, // İki kutu arasında boşluk
  },
  productMetaItem: {
    flex: 1, // Eşit genişlik
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA', // Hafif arka plan
    borderRadius: 8,
    alignItems: 'center', // Ortala
  },
  productMetaLabel: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase', // Büyük harf
    letterSpacing: 0.5,
  },
  productMetaValue: {
    fontSize: 15, // Daha okunabilir
    fontWeight: 'bold',
    color: '#333',
  },
  totalStockHighlight: {
    fontSize: 24, // Toplam stok çok büyük ve belirgin
    color: '#28A745', // Yeşil - stok var
  },
  totalStockZero: {
    color: '#BDBDBD', // Gri - stok yok
  },

  storeListHeader: {
    marginHorizontal: 8, // Sol ve sağ boşlukları azalttık
    marginTop: 8,
    marginBottom: 8,
  },
  storeListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 12,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8, // Sol ve sağ boşlukları azalttık
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 12, // Yuvarlak köşeler
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listFooter: {
    height: 16, // Alt boşluk
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333', // Varsayılan koyu renk
  },
  storeNameOutOfStock: {
    color: '#BDBDBD', // Açık gri - Stok yok (pasif renk)
  },
  storeStock: {
    fontSize: 16,
    fontWeight: '600',
  },
  inStock: {
    color: '#28A745', // Yeşil - Stokta var
  },
  outOfStock: {
    color: '#BDBDBD', // Açık gri - Stok yok (pasif renk)
  },
});
