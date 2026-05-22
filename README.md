# Amber arka plan — Instagram paylaşımı

## Tek dosya (video / ekran kaydı için)

`amber-background-standalone.html` dosyasını çift tıklayın veya tarayıcıya sürükleyin.

- Tam ekran amber Matrix arka plan
- Tıklayınca **BlackStoneRockSoft** yazısı aşağı akar
- Flask gerekmez

### Instagram Reels / Story kaydı

1. Dosyayı tam ekran açın (F11)
2. Windows: `Win + G` ile ekran kaydı
3. Birkaç kez tıklayıp efekti gösterin
4. `.hint` satırını videoda istemezseniz HTML içinde `<p class="hint">` satırını silin

## Sadece JavaScript kodu

Projedeki orijinal dosya:

`../static/js/amber-cascades.js`

Kaynak (Next.js): `Yeni klasör (8)/src/components/landing/amber-cascades.tsx`

## Kod carousel (Instagram gönderi)

Paylaşım için 3 slayt önerisi:

1. **Canvas + HTML** — `<canvas id="amber-bg">`
2. **Animasyon** — `render()` döngüsü, sütunlar, su dalgası
3. **Etkileşim** — `spawnBrandCascade`, tıklama
