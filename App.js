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

  // Uygulama başladığında verileri yükle
  useEffect(() => {
    loadData();
  }, []);

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
        <Text style={styles.title}>Stok Arama</Text>

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
          {/* Ürün Bilgisi - 2 Kolonlu Tasarım */}
          <View style={styles.productCard}>
            {/* Sol Kolon - Fotoğraf */}
            {productInfo && productInfo['ImageURL1'] && (
              <Image
                source={{ uri: productInfo['ImageURL1'] }}
                style={styles.productImage}
                resizeMode="contain"
              />
            )}

            {/* Sağ Kolon - Bilgiler */}
            <View style={styles.productInfo}>
              {/* Üst Satır - Ürün Adı ve Fiyat */}
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

              {/* Alt Satır - Ürün Kodu ve Toplam Stok */}
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
          ListHeaderComponent={renderHeader}
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
    padding: 16,
  },
  searchSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 16,
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
    margin: 16,
    marginTop: 0,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row', // Yatay düzen - 2 kolon
    alignItems: 'flex-start',
  },
  productImage: {
    width: 160, // Daha da büyük fotoğraf
    height: 160,
    marginRight: 16, // Sağ tarafta boşluk
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1, // Kalan alanı kapla
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 12,
  },
  productMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  productMetaItem: {
    flex: 1,
  },
  productMetaLabel: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
    fontWeight: '500',
  },
  productMetaValue: {
    fontSize: 18, // Daha büyük - özellikle toplam stok için önemli
    fontWeight: 'bold',
    color: '#333',
  },
  totalStockHighlight: {
    fontSize: 22, // Toplam stok daha da büyük
    color: '#28A745', // Yeşil - stok var
  },
  totalStockZero: {
    color: '#BDBDBD', // Gri - stok yok
  },

  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
