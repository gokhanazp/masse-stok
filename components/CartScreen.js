import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

/**
 * Sepet ekranı bileşeni
 * Sepete eklenen ürünleri gösterir ve iskonto hesaplar
 */
export default function CartScreen({ cart, onRemoveFromCart, onUpdateQuantity, onGoBack }) {
  // İskonto oranı state'i (%)
  const [discountRate, setDiscountRate] = useState('');

  /**
   * Para birimini belirler (ilk ürünün para birimini kullan)
   */
  const getCurrency = () => {
    return cart.length > 0 ? cart[0].currency : 'TL';
  };

  /**
   * Toplam fiyatı hesaplar (adet * fiyat)
   */
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  /**
   * İskonto tutarını hesaplar
   */
  const calculateDiscount = () => {
    const total = calculateTotal();
    const rate = parseFloat(discountRate) || 0;
    return (total * rate) / 100;
  };

  /**
   * İskontolu toplam fiyatı hesaplar
   */
  const calculateFinalTotal = () => {
    return calculateTotal() - calculateDiscount();
  };

  /**
   * Sepetten ürün silme onayı
   */
  const handleRemove = (productCode) => {
    Alert.alert(
      'Ürünü Sil',
      'Bu ürünü sepetten çıkarmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => onRemoveFromCart(productCode) },
      ]
    );
  };

  /**
   * Print HTML oluşturur
   */
  const generatePrintHTML = () => {
    const currentDate = new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const currency = getCurrency();
    const total = calculateTotal();
    const discount = calculateDiscount();
    const finalTotal = calculateFinalTotal();
    const discountRateValue = parseFloat(discountRate) || 0;

    // Ürün satırlarını oluştur
    const productRows = cart.map((item, index) => {
      const quantity = item.quantity || 1;
      const price = parseFloat(item.price) || 0;
      const itemTotal = price * quantity;

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E0E0E0; text-align: center;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E0E0E0;">
            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${item.productName}</div>
            <div style="font-size: 12px; color: #757575;">Kod: ${item.productCode}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E0E0E0; text-align: center; color: #333;">
            ${quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E0E0E0; text-align: right; color: #757575;">
            ${price.toFixed(2)} ${item.currency}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E0E0E0; text-align: right; font-weight: 600; color: #0066CC;">
            ${itemTotal.toFixed(2)} ${item.currency}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sepet Özeti - Masse Stok Arama</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px;
            background: #FFF;
            color: #333;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #0D5C9E;
          }

          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
          }

          .date {
            font-size: 14px;
            color: #757575;
          }

          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: #FFF;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .products-table thead {
            background: #0D5C9E;
            color: #FFF;
          }

          .products-table th {
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .products-table th:first-child {
            text-align: center;
            width: 60px;
          }

          .products-table th:last-child {
            text-align: right;
          }

          .summary {
            background: #F8F9FA;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 16px;
          }

          .summary-row.discount {
            color: #DC3545;
            font-weight: 600;
          }

          .summary-row.total {
            border-top: 2px solid #0D5C9E;
            margin-top: 12px;
            padding-top: 16px;
            font-size: 20px;
            font-weight: bold;
            color: #0D5C9E;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E0E0E0;
            text-align: center;
            font-size: 12px;
            color: #757575;
          }

          @media print {
            body {
              padding: 20px;
            }

            .container {
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <img src="https://masseyapi.com/Data/EditorFiles/Masse_Logo_Blue_a.svg" alt="Masse Yapi" style="height: 60px; margin-bottom: 16px;" />
            <div class="title">Sepet Özeti</div>
            <div class="date">${currentDate}</div>
          </div>

          <!-- Ürünler Tablosu -->
          <table class="products-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Ürün Bilgileri</th>
                <th style="width: 80px;">Adet</th>
                <th style="width: 120px;">Birim Fiyat</th>
                <th style="width: 120px;">Toplam</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <!-- Özet -->
          <div class="summary">
            <div class="summary-row">
              <span>Ara Toplam:</span>
              <span>${total.toFixed(2)} ${currency}</span>
            </div>

            ${discountRateValue > 0 ? `
              <div class="summary-row discount">
                <span>İskonto (${discountRateValue}%):</span>
                <span>-${discount.toFixed(2)} ${currency}</span>
              </div>
            ` : ''}

            <div class="summary-row total">
              <span>Toplam:</span>
              <span>${finalTotal.toFixed(2)} ${currency}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Masse Stok Arama Uygulaması</p>
            <p>Bu belge ${currentDate} tarihinde oluşturulmuştur.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  /**
   * Print işlemini başlatır
   */
  const handlePrint = async () => {
    try {
      const html = generatePrintHTML();

      if (Platform.OS === 'web') {
        // Web için print dialog aç
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      } else {
        // Mobil için PDF oluştur ve paylaş
        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      Alert.alert('Hata', 'Yazdırma işlemi başarısız oldu.');
      console.error('Print error:', error);
    }
  };

  /**
   * Header render fonksiyonu
   */
  const renderHeader = () => (
    <>
      {/* Logo Header */}
      <View style={styles.logoHeader}>
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

      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sepetim ({cart.length})</Text>
        <TouchableOpacity onPress={handlePrint} style={styles.printButton}>
          <Text style={styles.printButtonText}>🖨️</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  /**
   * Sepet boşsa gösterilecek mesaj
   */
  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Sepetiniz boş</Text>
          <Text style={styles.emptySubText}>Ürün aramaya başlayın ve sepete ekleyin</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Adet artırma
   */
  const handleIncreaseQuantity = (productCode) => {
    onUpdateQuantity(productCode, 1);
  };

  /**
   * Adet azaltma
   */
  const handleDecreaseQuantity = (productCode, currentQuantity) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(productCode, -1);
    } else {
      // Adet 1'den azsa ürünü sil
      handleRemove(productCode);
    }
  };

  /**
   * Sepet ürünü render fonksiyonu
   */
  const renderCartItem = ({ item }) => {
    const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 1);

    return (
      <View style={styles.cartItem}>
        {/* Sol - Ürün Görseli */}
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cartItemImage}
            resizeMode="contain"
          />
        )}

        {/* Orta - Ürün Bilgileri */}
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.cartItemCode}>Kod: {item.productCode}</Text>
          <Text style={styles.cartItemPrice}>
            {item.price} {item.currency}
          </Text>

          {/* Adet Kontrolleri */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleDecreaseQuantity(item.productCode, item.quantity)}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity || 1}</Text>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleIncreaseQuantity(item.productCode)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Toplam Fiyat */}
          {item.quantity > 1 && (
            <Text style={styles.itemTotal}>
              Toplam: {itemTotal.toFixed(2)} {item.currency}
            </Text>
          )}
        </View>

        {/* Sağ - Sil Butonu */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.productCode)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sepet Listesi */}
      <FlatList
        ListHeaderComponent={renderHeader()}
        data={cart}
        keyExtractor={(item) => item.productCode}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.summaryContainer}>
            {/* İskonto Oranı Girişi */}
            <View style={styles.discountSection}>
              <Text style={styles.discountLabel}>İskonto Oranı (%)</Text>
              <TextInput
                style={styles.discountInput}
                placeholder="0"
                keyboardType="numeric"
                value={discountRate}
                onChangeText={setDiscountRate}
                maxLength={5}
              />
            </View>

            {/* Fiyat Özeti */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Ara Toplam:</Text>
              <Text style={styles.priceValue}>{calculateTotal().toFixed(2)} {getCurrency()}</Text>
            </View>

            {discountRate && parseFloat(discountRate) > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.discountLabel}>İskonto ({discountRate}%):</Text>
                <Text style={styles.discountValue}>-{calculateDiscount().toFixed(2)} {getCurrency()}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Toplam:</Text>
              <Text style={styles.totalValue}>{calculateFinalTotal().toFixed(2)} {getCurrency()}</Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  logoHeader: {
    backgroundColor: '#FFF',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  printButton: {
    padding: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
  },
  printButtonText: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cartItemCode: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28A745',
    marginTop: 4,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  removeButtonText: {
    fontSize: 24,
  },
  summaryContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discountSection: {
    marginBottom: 16,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  discountInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#333',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  discountValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC3545',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0066CC',
  },
});

