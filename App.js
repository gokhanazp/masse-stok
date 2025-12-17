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
import CartScreen from './components/CartScreen';

/**
 * Ana uygulama bileşeni
 * Stok arama ve ürün bilgisi görüntüleme
 */
function AppContent() {
  // State tanımlamaları
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Giriş durumu
  const [password, setPassword] = useState(''); // Şifre input
  const [loginError, setLoginError] = useState(''); // Giriş hatası
  const [stockData, setStockData] = useState([]); // Stok verileri
  const [productData, setProductData] = useState([]); // Ürün verileri
  const [searchCode, setSearchCode] = useState(''); // Arama input
  const [searchResult, setSearchResult] = useState(null); // Arama sonucu (stok)
  const [productInfo, setProductInfo] = useState(null); // Ürün bilgisi
  const [loading, setLoading] = useState(true); // Yükleme durumu
  const [searching, setSearching] = useState(false); // Arama durumu
  const [refreshing, setRefreshing] = useState(false); // Manuel yenileme durumu
  const [lastUpdateTime, setLastUpdateTime] = useState(null); // Son güncelleme zamanı
  const [cart, setCart] = useState([]); // Sepet
  const [showCart, setShowCart] = useState(false); // Sepet ekranı göster/gizle
  const [errorMessage, setErrorMessage] = useState(null); // Hata mesajı
  const [addQuantity, setAddQuantity] = useState(1); // Eklenecek ürün adedi

  /**
   * Giriş kontrolü
   */
  const handleLogin = () => {
    const correctPassword = 'Masse-2026!';
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setLoginError('');
      setPassword('');
    } else {
      setLoginError('Hatalı şifre! Lütfen tekrar deneyin.');
      setPassword('');
    }
  };

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
      setErrorMessage('Lütfen bir ürün kodu girin.');
      return;
    }

    setSearching(true);
    setErrorMessage(null); // Önceki hata mesajını temizle

    // Stok bilgisini ara (AnaÖzet sheet'inden)
    const stock = searchStockByCode(stockData, searchCode);

    // Ürün bilgisini ara
    const product = searchProductByCode(productData, searchCode);

    if (stock) {
      // Stok bilgisi bulundu
      const formattedStock = formatStockInfo(stock);
      setSearchResult(formattedStock);
      setProductInfo(product);
      setErrorMessage(null);
      console.log('✅ Ürün bulundu:', searchCode);
    } else {
      // Stok bilgisi bulunamadı - AnaÖzet'te yok
      setSearchResult(null);
      setProductInfo(null);
      setErrorMessage(`"${searchCode}" ürün kodu AnaÖzet listesinde bulunamadı. Lütfen ürün kodunu kontrol edin.`);
      console.log('❌ Ürün bulunamadı:', searchCode);
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
    setErrorMessage(null);
  };

  /**
   * Sepete ürün ekler veya adedini artırır
   */
  const handleAddToCart = () => {
    if (!productInfo || !searchResult) {
      setErrorMessage('Sepete eklenecek ürün bulunamadı.');
      return;
    }

    const quantityToAdd = Math.max(1, addQuantity); // En az 1 adet

    // Ürün zaten sepette mi kontrol et
    const existingItemIndex = cart.findIndex(item => item.productCode === searchResult.productCode);

    if (existingItemIndex !== -1) {
      // Ürün zaten sepette - adedini artır
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantityToAdd;
      setCart(updatedCart);
      console.log(`✅ Ürün adedi artırıldı: ${searchResult.productCode} (+${quantityToAdd} = ${updatedCart[existingItemIndex].quantity})`);
    } else {
      // Yeni ürün - sepete ekle
      const cartItem = {
        productCode: searchResult.productCode,
        productName: productInfo['UrunAdi'] || 'Ürün Adı Yok',
        price: productInfo['price3'] || '0',
        currency: productInfo['ParaBirimi'] || 'TL',
        imageUrl: productInfo['ImageURL1'] || null,
        quantity: quantityToAdd,
      };

      setCart([...cart, cartItem]);
      console.log(`✅ Yeni ürün sepete eklendi: ${searchResult.productCode} (${quantityToAdd} adet)`);
    }

    // Adet inputunu sıfırla
    setAddQuantity(1);
  };

  /**
   * Sepetten ürün çıkarır
   */
  const handleRemoveFromCart = (productCode) => {
    setCart(cart.filter(item => item.productCode !== productCode));
  };

  /**
   * Sepetteki ürün adedini günceller
   */
  const handleUpdateQuantity = (productCode, change) => {
    const updatedCart = cart.map(item => {
      if (item.productCode === productCode) {
        return {
          ...item,
          quantity: Math.max(1, (item.quantity || 1) + change)
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  /**
   * Sepet ekranını gösterir
   */
  const handleShowCart = () => {
    setShowCart(true);
  };

  /**
   * Sepet ekranından geri döner
   */
  const handleGoBack = () => {
    setShowCart(false);
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

  // Giriş ekranı - Kullanıcı giriş yapmadıysa
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          {/* Logo */}
          <View style={styles.loginLogoContainer}>
            {Platform.OS === 'web' ? (
              <img
                src="https://masseyapi.com/Data/EditorFiles/Masse_Logo_Blue_a.svg"
                alt="Masse Logo"
                style={{ width: 220, height: 60, marginBottom: 40 }}
              />
            ) : (
              <SvgUri
                width="220"
                height="60"
                uri="https://masseyapi.com/Data/EditorFiles/Masse_Logo_Blue_a.svg"
              />
            )}
          </View>

          {/* Giriş Formu */}
          <View style={styles.loginForm}>
            <Text style={styles.loginTitle}>Stok Arama Sistemi</Text>
            <Text style={styles.loginSubtitle}>Devam etmek için şifrenizi girin</Text>

            {/* Şifre Input */}
            <TextInput
              style={styles.loginInput}
              placeholder="Şifre"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLoginError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
            />

            {/* Hata Mesajı */}
            {loginError && (
              <View style={styles.loginErrorContainer}>
                <Text style={styles.loginErrorText}>⚠️ {loginError}</Text>
              </View>
            )}

            {/* Giriş Butonu */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.loginFooter}>© 2025 Masse Yapı</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render fonksiyonu - Header ve arama bölümü
  const renderHeader = () => (
    <>
      {/* Header - Logo ve Sepet */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
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

          {/* Sepet Butonu */}
          <TouchableOpacity style={styles.cartButton} onPress={handleShowCart}>
            <Text style={styles.cartIcon}>🛒</Text>
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
          onChangeText={(text) => {
            setSearchCode(text);
            setErrorMessage(null); // Kullanıcı yazmaya başladığında hatayı temizle
          }}
          autoCapitalize="characters"
          onSubmitEditing={handleSearch}
        />

        {/* Hata Mesajı */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

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

            {/* Adet ve Sepete Ekle - Tek Satır */}
            <View style={styles.addToCartContainer}>
              {/* Adet Kontrolleri */}
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityControlButton}
                  onPress={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                >
                  <Text style={styles.quantityControlButtonText}>−</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={String(addQuantity)}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setAddQuantity(Math.max(1, num));
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                />

                <TouchableOpacity
                  style={styles.quantityControlButton}
                  onPress={() => setAddQuantity(addQuantity + 1)}
                >
                  <Text style={styles.quantityControlButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Sepete Ekle Butonu */}
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
              >
                <Text style={styles.addToCartButtonText}>🛒 Sepete Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );

  // Sepet ekranı gösteriliyorsa
  if (showCart) {
    return (
      <CartScreen
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onGoBack={handleGoBack}
      />
    );
  }

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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
  },
  cartIcon: {
    fontSize: 28,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
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
  addToCartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  quantityControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControlButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityInput: {
    width: 50,
    height: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 8,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  // Giriş Ekranı Stilleri
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  loginLogoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  loginForm: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  loginErrorContainer: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  loginErrorText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginFooter: {
    marginTop: 32,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
