# 🎨 Google Play Store Görselleri ve Yayınlama Rehberi

Bu klasör, Masse Stok Arama uygulamasının Google Play Store'da yayınlanması için gerekli tüm görselleri ve bilgileri içerir.

## 📁 Dosyalar

### 1. `generate-assets.html`
Tarayıcıda açarak Google Play Store için gerekli görselleri oluşturabileceğiniz HTML dosyası.

**Nasıl Kullanılır:**
1. Dosyayı çift tıklayarak tarayıcıda açın
2. Her görsel için "İndir" butonuna tıklayın
3. Görseller otomatik olarak indirilecektir

**Oluşturulan Görseller:**
- ✅ Feature Graphic (1024x500 px)
- ✅ Screenshot 1 - Arama Ekranı (1080x1920 px)
- ✅ Screenshot 2 - Sonuç Ekranı (1080x1920 px)

### 2. `store-listing.md`
Google Play Store'da kullanılacak tüm metin içerikleri:
- Uygulama adı
- Kısa açıklama
- Tam açıklama
- Anahtar kelimeler
- Kategori bilgileri

### 3. `privacy-policy.md`
Gizlilik politikası metni. Bu metni:
1. Kendi web sitenizde yayınlayın
2. URL'i Google Play Console'da belirtin

### 4. `README.md` (Bu dosya)
Tüm dosyaların kullanım rehberi.

---

## 🚀 Adım Adım Yayınlama Rehberi

### Adım 1: Google Play Developer Hesabı Oluşturun

1. https://play.google.com/console adresine gidin
2. Google hesabınızla giriş yapın
3. **25 USD tek seferlik kayıt ücreti** ödeyin
4. Geliştirici bilgilerinizi doldurun

### Adım 2: Görselleri Hazırlayın

1. `generate-assets.html` dosyasını tarayıcıda açın
2. Tüm görselleri indirin:
   - `masse-feature-graphic.png` (1024x500)
   - `masse-screenshot-1.png` (1080x1920)
   - `masse-screenshot-2.png` (1080x1920)
3. Mevcut app icon: `../assets/massefav.png` (512x512)

### Adım 3: Gizlilik Politikasını Yayınlayın

1. `privacy-policy.md` dosyasını açın
2. E-posta adresinizi ekleyin
3. İçeriği kendi web sitenizde yayınlayın
4. URL'i not edin (Google Play Console'da gerekli)

**Alternatif:** GitHub Pages kullanabilirsiniz:
```bash
# GitHub repo'nuzda
mkdir docs
cp privacy-policy.md docs/privacy-policy.md
# GitHub Settings > Pages > Source: docs klasörü
# URL: https://[kullanıcı-adı].github.io/[repo-adı]/privacy-policy
```

### Adım 4: Yeni Uygulama Oluşturun

1. Play Console'da "Create app" butonuna tıklayın
2. Bilgileri doldurun:
   - **App name:** Masse Stok Arama
   - **Default language:** Türkçe (Turkish)
   - **App or game:** App
   - **Free or paid:** Free
3. Declarations'ı kabul edin
4. "Create app" butonuna tıklayın

### Adım 5: Store Listing'i Doldurun

`store-listing.md` dosyasındaki bilgileri kullanarak:

1. **App details:**
   - App name: Masse Stok Arama
   - Short description: (80 karakter)
   - Full description: (4000 karakter)

2. **Graphics:**
   - App icon: `massefav.png` (512x512)
   - Feature graphic: `masse-feature-graphic.png` (1024x500)
   - Phone screenshots: 
     - `masse-screenshot-1.png`
     - `masse-screenshot-2.png`

3. **Categorization:**
   - App category: Business / Productivity
   - Tags: stok, arama, masse, grohe, envanter

4. **Contact details:**
   - Email: [E-posta adresiniz]
   - Website: https://masseyapi.com
   - Privacy policy: [Gizlilik politikası URL'iniz]

### Adım 6: İçerik Derecelendirmesi

1. "Content rating" bölümüne gidin
2. Anketi doldurun:
   - App category: Utility, Productivity, Communication, or Other
   - Şiddet içeriği: Hayır
   - Cinsel içerik: Hayır
   - Küfür: Hayır
   - Uyuşturucu: Hayır
   - Kullanıcı etkileşimi: Hayır
3. Derecelendirmeyi alın (genellikle "Everyone")

### Adım 7: Fiyatlandırma ve Dağıtım

1. "Pricing & distribution" bölümüne gidin
2. **Pricing:** Free
3. **Countries:** Turkey (veya tüm ülkeler)
4. **Content guidelines:** Kabul edin
5. **US export laws:** Kabul edin

### Adım 8: AAB Dosyasını Yükleyin

1. "Production" > "Create new release" tıklayın
2. AAB dosyasını yükleyin:
   - URL: https://expo.dev/artifacts/eas/qsw4XmqtX1ojgaP64q4JHt.aab
   - Veya `npx eas-cli submit --platform android` komutunu çalıştırın
3. Release notes ekleyin:
   ```
   İlk sürüm:
   - 8 mağazada stok sorgulama
   - Ürün detayları ve fiyat bilgisi
   - Otomatik günlük güncelleme
   - Kısmi kod ile arama
   ```
4. "Save" ve "Review release" tıklayın

### Adım 9: İncelemeye Gönderin

1. Tüm bölümlerin tamamlandığından emin olun (yeşil tik işaretleri)
2. "Send for review" butonuna tıklayın
3. Google'ın incelemesini bekleyin (1-7 gün)

---

## ✅ Kontrol Listesi

Yayınlamadan önce kontrol edin:

- [ ] Google Play Developer hesabı oluşturuldu
- [ ] 25 USD ödeme yapıldı
- [ ] Tüm görseller indirildi
- [ ] Gizlilik politikası yayınlandı
- [ ] Store listing bilgileri dolduruldu
- [ ] İçerik derecelendirmesi tamamlandı
- [ ] Fiyatlandırma ve dağıtım ayarlandı
- [ ] AAB dosyası yüklendi
- [ ] Release notes eklendi
- [ ] İncelemeye gönderildi

---

## 📊 Beklenen Sonuçlar

### İnceleme Süreci
- **Süre:** 1-7 gün
- **Durum:** Play Console'dan takip edebilirsiniz
- **Bildirim:** E-posta ile bilgilendirilirsiniz

### Yayınlandıktan Sonra
- **Görünürlük:** 2-3 saat içinde Play Store'da görünür
- **Arama:** "Masse Stok Arama" ile bulunabilir
- **Link:** `https://play.google.com/store/apps/details?id=com.masse.stokarama`

---

## 🔄 Güncelleme Yayınlama

Uygulama güncellemesi için:

1. **Yeni build oluşturun:**
   ```bash
   cd stok-arama-app
   npx eas-cli build --platform android --profile production
   ```

2. **Version code otomatik artacak** (eas.json'da `autoIncrement: true`)

3. **Play Console'da:**
   - Production > Create new release
   - Yeni AAB dosyasını yükleyin
   - Release notes ekleyin
   - Review ve publish

---

## 🆘 Sorun Giderme

### "Privacy policy URL required"
- Gizlilik politikasını web sitenizde yayınlayın
- URL'i Store listing > Contact details'a ekleyin

### "Feature graphic required"
- `generate-assets.html` dosyasını açın
- Feature graphic'i indirin (1024x500)
- Play Console'da yükleyin

### "At least 2 screenshots required"
- Her iki screenshot'u da indirin
- Play Console > Graphics > Phone screenshots'a yükleyin

### "Content rating incomplete"
- Content rating bölümüne gidin
- Anketi doldurun
- Derecelendirmeyi alın

---

## 📞 Destek

Sorularınız için:
- **E-posta:** [E-posta adresinizi ekleyin]
- **Web:** https://masseyapi.com
- **GitHub:** https://github.com/gokhanazp/masse-stok

---

## 🎉 Başarılar!

Uygulamanızı Google Play Store'da yayınlamak üzeresiniz! 🚀


