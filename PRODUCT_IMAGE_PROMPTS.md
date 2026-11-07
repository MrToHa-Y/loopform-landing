# LOOPFORM — промпты для фотореалистичных изображений товаров

Цель — снимки, которые выглядят как настоящая каталожная съёмка уже существующей мебели. Промпты написаны на английском: генераторы изображений понимают его лучше всего. Пояснения — на русском.

Каждое изображение будет на сайте и в карточках маркетплейсов. Поэтому в футере сайта и в описаниях карточек оставляйте пометку «Изображения созданы с помощью ИИ». Этого требует и ТЗ практики, и честность демо-проекта.

---

## 1. Как работать, чтобы товар выглядел одинаково на всех кадрах

Главная проблема ИИ-фото — один и тот же стул получается разным на каждом кадре. Чтобы этого не было, работайте по шагам.

1. **Сначала мастер-кадр.** Для каждой модели сгенерируйте кадр «A — студия 3/4» (раздел 4). Сделайте 8–16 вариантов и выберите один, где форма самая чистая и точно совпадает с описанием DESIGN. Это эталон.
2. **Все остальные кадры — от эталона.** Загружайте эталон как референс изображения и повторяйте блок DESIGN дословно.
   - **Midjourney:** эталон как object/omni reference и style reference (`--sref`). Флаги: `--style raw`, `--stylize 50–100`, `--ar 4:5` для карточек. Используйте последнюю версию модели.
   - **ChatGPT (генерация изображений) или Gemini:** загрузите эталон и пишите: «Keep the exact same chair — identical shape, color, layer lines and speckles. Change only: …». Для смены ракурса или фона это самый надёжный способ.
   - **Flux / Stable Diffusion:** фиксируйте seed. Используйте IP-Adapter или reference-image с силой 0.6–0.8 и негативный промпт из раздела 2.3.
3. **Блок DESIGN не перефразируйте.** Он одинаковый во всех кадрах одной модели. Меняются только блоки SHOT и SCENE.
4. **Текст и логотипы добавляйте вручную.** Генераторы искажают буквы. QR-бирку, логотип «OO» и надписи накладывайте в Figma или Photoshop после генерации.
5. **Подгоняйте цвет.** После генерации выровняйте цвет изделия под палитру бренда (раздел 2.2) корректирующим слоем Hue/Saturation или Selective Color. Тогда коллекция выглядит единой.

---

## 2. Общие блоки (вставляются в каждый промпт)

### 2.1 MATERIAL — как выглядит настоящий печатный переработанный пластик

Вставляйте этот блок в каждый промпт товара без изменений.

```text
MATERIAL: large-format pellet 3D printed recycled plastic, clearly visible horizontal extrusion beads about 1.6 mm high and 5 mm wide, stacked like neat rounded ridges that follow every curve of the form, soft satin sheen on the top of each bead and slightly darker grooves between them, subtle natural irregularities: a few beads slightly thicker, tiny wobble at the layer seam, faint vertical seam line on the back, terrazzo speckles from mixed recycled flakes visible inside the plastic (small dots of other colors, 0.5 to 3 mm), very slight color variation from layer to layer, matte-satin finish, not glossy, not injection molded, not toy-like, real manufactured object with honest imperfections
```

### 2.2 Цвета бренда (слова для промпта и HEX для коррекции)

| Название | Как писать в промпте | HEX для коррекции |
|---|---|---|
| Cap Red | warm tomato red recycled polypropylene with tiny white, blue and yellow flecks | #D6452B |
| Bottle Green | deep bottle green recycled HDPE with tiny white and light blue flecks | #2F6F4E |
| Sand | warm sand beige recycled PETG with tiny terracotta and grey flecks | #D9B98C |
| Cap Blue | saturated cobalt blue recycled plastic with tiny white and red flecks | #2D5BDB |
| Terrazzo | off-white bone base densely speckled with red, cobalt blue, green and yellow flakes | основа #EFEBE4 |
| Graphite | near-black graphite recycled HDPE with tiny grey and white flecks | #141414 |
| Фон студии | seamless warm off-white bone paper backdrop | #EFEBE4 |

### 2.3 CAMERA и NEGATIVE

```text
CAMERA: professional furniture catalogue photography, medium format camera, 80 mm lens, f/8, sharp focus across the whole object, true-to-life colors, soft natural shadow, high dynamic range, subtle film grain, photorealistic, 8k detail
```

```text
NEGATIVE (для Flux/SD, или допишите «Avoid: …» в конце промпта): text, letters, logo, watermark, brand name, signature, CGI render look, 3D render, plastic toy, glossy injection molded plastic, wood grain on plastic, smooth plastic without layers, vertical layer lines, warped geometry, asymmetrical legs, extra legs, floating object, melted shapes, cartoon, illustration, oversaturated, blurry, deformed hands, distorted faces
```

---

## 3. Описания моделей — блок DESIGN

Блок DESIGN одной модели копируйте во все её промпты без изменений. Формы совпадают с каталогом и с процедурными 3D-моделями сайта.

### TOLQYN — стул (Cap Red)
```text
DESIGN: TOLQYN dining chair, a cantilever chair formed from one continuous ribbon of 3D printed recycled polypropylene, ribbon 35 mm thick and 46 cm wide, the ribbon rises as a gently curved backrest, flows into the seat, drops down in a smooth S-curve to the floor and runs back along the floor as a runner, no separate legs, no screws, no joints, rounded edges, seat height 45 cm, total height 80 cm, footprint 45 by 52 cm, horizontal printing layers wrap around every curve, color: warm tomato red recycled polypropylene with tiny white, blue and yellow flecks
```

### TAS — табурет-пуф (Bottle Green)
```text
DESIGN: TAS stool, a chunky round stool-pouf 38 cm in diameter and 45 cm high, solid heavy silhouette like a smooth river stone, slightly wider at the base, a soft waist at one third of the height, a gently domed top, printed as one seamless vase-like shell with continuous spiral layers, thick rounded extrusion beads, color: deep bottle green recycled HDPE with tiny white and light blue flecks
```

### BIIK — барный табурет (Graphite)
```text
DESIGN: BIIK bar stool, 75 cm high, 40 by 40 cm footprint, four slightly splayed legs that flow organically into a round dished seat as one single printed piece, an integrated footrest ring at 25 cm height printed as part of the legs, no metal parts, color: near-black graphite recycled HDPE with tiny grey and white flecks
```

### QUM — лаунж-кресло (Sand)
```text
DESIGN: QUM lounge armchair, low and wide, 70 cm wide, 75 cm deep, 72 cm high, one wide C-shaped printed shell like a sand dune wave, thick rounded walls 60 mm, the backrest curves forward into armrests in one continuous form, with a removable thick wool felt seat cushion 8 cm thick in light oatmeal color, color of the shell: warm sand beige recycled PETG with tiny terracotta and grey flecks
```

### KOL — журнальный стол (Sand + дуб)
```text
DESIGN: KOL coffee table, round, 80 cm diameter, 40 cm high, a sculptural printed base whose horizontal layers ripple and flare outward toward the top like rings on water, base in warm sand beige recycled PETG with tiny terracotta and grey flecks, topped with a solid oiled natural oak round top 30 mm thick with visible real wood grain
```

### SAULE — настольный светильник (Cap Blue)
```text
DESIGN: SAULE table lamp, 25 cm diameter, 40 cm high, a vase-like lampshade with a slim waist and a soft rounded top, printed in semi-translucent recycled PETG in saturated cobalt blue, a warm 2700K bulb glowing inside so every printed layer glows as a thin horizontal line of light, small matte cobalt base, thin fabric cable
```

### JAPYRAQ — кашпо, 3 размера (Terrazzo)
```text
DESIGN: JAPYRAQ planters, a set of three round planters 20, 30 and 45 cm in diameter, walls with soft vertical folds like the ribs of a leaf, slightly tapered to the bottom, printed in recycled HDPE, color: off-white bone base densely speckled with red, cobalt blue, green and yellow flakes
```

### SAIABAQ — уличная скамья (Graphite)
```text
DESIGN: SAIABAQ outdoor bench, 180 cm long, 50 cm deep, 45 cm seat height, one long wave-shaped printed piece where the seat rises gently at both ends into low armrests, the side profile is a continuous loop, heavy and solid, printed in near-black graphite recycled HDPE with tiny grey and white flecks
```

### ORNEK — ширма (Sand)
```text
DESIGN: ORNEK folding screen, three panels each 50 cm wide and 180 cm high, connected by fabric hinges, each panel is a parametric lattice inspired by the traditional Kazakh ram-horn ornament (qoshqar muiz), the openings let light through and cast patterned shadows, printed in warm sand beige recycled PETG with tiny terracotta and grey flecks
```

### UYA — модульные полки-соты (разные цвета)
```text
DESIGN: UYA wall shelf modules, hexagonal honeycomb boxes 30 cm wide, 26 cm high, 20 cm deep, open at the front, wall thickness 6 mm, mounted on a wall as a cluster of seven modules in different colors: tomato red, bottle green, sand beige, cobalt blue and terrazzo
```

### DESK KIT — мелкие предметы для стола (Terrazzo)
```text
DESIGN: DESK KIT, a set of small 3D printed desk objects: a phone stand, a pen and tool organizer with three round compartments and a small planter, all with fine visible layers 0.4 mm high and 1 mm wide (finer than the furniture), color: off-white bone base densely speckled with red, cobalt blue, green and yellow flakes
```

---

## 4. Кадры для каждой модели

Каждый промпт собирается так:

`SHOT + DESIGN модели + MATERIAL + SCENE + CAMERA`

Ниже готовые блоки SHOT и SCENE. Для пяти главных моделей (TOLQYN, TAS, QUM, SAULE, KOL) сделайте все кадры A–F. Для остальных хватит A, C и D.

### A — студия 3/4, главное фото карточки (4:5 и 1:1)
```text
SHOT: three-quarter front view from slightly above eye level, the whole object centered with generous empty space around it
SCENE: seamless warm off-white bone paper studio backdrop, large softbox key light from the upper left, white bounce fill from the right, soft long natural shadow falling to the lower right, clean catalogue look
```

### B — строгий профиль (для силуэта и для image-to-3D)
```text
SHOT: exact side profile view, camera at the height of the seat, orthographic feeling, no perspective distortion, whole object visible
SCENE: seamless warm off-white bone paper studio backdrop, even soft lighting, minimal shadow directly under the object
```

### C — макро слоёв (доказательство, что изделие напечатано)
```text
SHOT: extreme close-up macro of the surface at a curve of the object, the stacked extrusion beads fill the frame diagonally, shallow depth of field, f/4, raking light from the side to reveal the texture of each bead and the terrazzo flecks inside the plastic
SCENE: studio, soft background blur
```

### D — интерьер (лайфстайл)

Подставьте один из вариантов сцены.

```text
SHOT: wide interior shot at eye level, the product is the clear hero in the foreground left third, sharp, the rest of the room slightly softer
SCENE (кофейня): a minimalist specialty coffee shop in Astana, Kazakhstan, in winter, large window with soft snowy daylight and blurred modern city buildings outside, light oak counter, concrete floor, a ceramic cup of cappuccino nearby, two customers blurred in the background with no faces visible
SCENE (квартира): a bright minimalist apartment in a new residential building in Astana, white walls, light oak floor, linen curtains, late afternoon warm sun casting long window shadows, a few books and a ceramic vase, lived-in but tidy
SCENE (двор ЖК, только для SAIABAQ и JAPYRAQ): a modern residential courtyard in Astana in early autumn, paved paths, young birch trees, playground blurred in the background, soft overcast daylight, residents blurred far away with no faces visible
```

### E — масштаб с человеком
```text
SHOT: medium shot, a person interacts naturally with the product (sits on it, places a cup on it, adjusts it), the person is cropped at the shoulders or turned away so the face is not visible, casual neutral clothing in beige and grey
SCENE: the same interior as in shot D, natural daylight
```

### F — деталь бренда (под последующее наложение бирки)
```text
SHOT: close-up of the back lower part of the product where a small blank matte rectangular tag 4 by 2 cm is attached with a tiny loop of cord, the tag is completely blank, plain off-white with nothing printed on it
SCENE: studio, soft side light, shallow depth of field
```

После генерации положите на бирку в Figma QR-код и знак «OO» с перспективной деформацией (Transform → Distort).

---

## 5. Готовые полные промпты для эталонов (кадр A)

Скопируйте целиком и подставьте флаги своего генератора.

**TOLQYN**
```text
Three-quarter front view from slightly above eye level, the whole object centered with generous empty space around it. TOLQYN dining chair, a cantilever chair formed from one continuous ribbon of 3D printed recycled polypropylene, ribbon 35 mm thick and 46 cm wide, the ribbon rises as a gently curved backrest, flows into the seat, drops down in a smooth S-curve to the floor and runs back along the floor as a runner, no separate legs, no screws, no joints, rounded edges, seat height 45 cm, total height 80 cm, horizontal printing layers wrap around every curve, color: warm tomato red recycled polypropylene with tiny white, blue and yellow flecks. Large-format pellet 3D printed recycled plastic, clearly visible horizontal extrusion beads about 1.6 mm high and 5 mm wide, stacked like neat rounded ridges, soft satin sheen on each bead and darker grooves between them, subtle natural irregularities, faint vertical seam line on the back, terrazzo speckles from mixed recycled flakes inside the plastic, matte-satin finish, not glossy, not injection molded. Seamless warm off-white bone paper studio backdrop, large softbox key light from the upper left, white bounce fill from the right, soft long natural shadow to the lower right. Professional furniture catalogue photography, medium format camera, 80 mm lens, f/8, sharp focus, true-to-life colors, subtle film grain, photorealistic. Avoid: text, logo, CGI look, toy look, glossy plastic, extra legs, warped shapes. --ar 4:5 --style raw
```

**TAS**
```text
Three-quarter front view from slightly above, the whole object centered with generous empty space. TAS stool, a chunky round stool-pouf 38 cm in diameter and 45 cm high, solid heavy silhouette like a smooth river stone, slightly wider at the base, a soft waist at one third of the height, a gently domed top, printed as one seamless vase-like shell with continuous spiral layers, thick rounded extrusion beads, color: deep bottle green recycled HDPE with tiny white and light blue flecks. Large-format pellet 3D printed recycled plastic, clearly visible horizontal extrusion beads about 1.6 mm high and 5 mm wide, soft satin sheen on each bead, darker grooves between them, subtle natural irregularities, terrazzo speckles inside the plastic, matte-satin finish, not injection molded. Seamless warm off-white bone paper studio backdrop, softbox key light from the upper left, soft long shadow to the lower right. Professional furniture catalogue photography, 80 mm lens, f/8, photorealistic, subtle film grain. Avoid: text, logo, CGI look, toy look, glossy plastic. --ar 4:5 --style raw
```

**QUM**
```text
Three-quarter front view from slightly above, centered with generous empty space. QUM lounge armchair, low and wide, 70 cm wide, 75 cm deep, 72 cm high, one wide C-shaped printed shell like a sand dune wave, thick rounded walls 60 mm, the backrest curves forward into armrests in one continuous form, a removable thick wool felt seat cushion 8 cm thick in light oatmeal color, shell color: warm sand beige recycled PETG with tiny terracotta and grey flecks. Large-format pellet 3D printed recycled plastic, clearly visible horizontal extrusion beads about 1.6 mm high and 5 mm wide following every curve, soft satin sheen, darker grooves, subtle natural irregularities, terrazzo speckles, matte-satin finish. Seamless warm off-white bone paper studio backdrop, softbox key light from the upper left, soft long shadow. Professional furniture catalogue photography, 80 mm lens, f/8, photorealistic, subtle film grain. Avoid: text, logo, CGI look, glossy plastic, warped shapes. --ar 4:5 --style raw
```

**SAULE** (фон темнее, чтобы светился свет)
```text
Three-quarter front view at eye level, centered. SAULE table lamp, 25 cm diameter, 40 cm high, a vase-like lampshade with a slim waist and a soft rounded top, printed in semi-translucent recycled PETG in saturated cobalt blue, a warm 2700K bulb glowing inside so every printed layer glows as a thin horizontal line of light, small matte cobalt base, thin fabric cable. Visible horizontal extrusion beads about 1.6 mm high, satin sheen, subtle irregularities, tiny white and red flecks inside the translucent plastic. Standing on a light oak sideboard against a warm greige plaster wall in a dim evening room, the lamp is the main light source, soft warm glow on the wall. Professional interior product photography, 80 mm lens, f/5.6, photorealistic, subtle film grain. Avoid: text, logo, CGI look, toy look, opaque plastic. --ar 4:5 --style raw
```

**KOL**
```text
Three-quarter view from slightly above, centered. KOL coffee table, round, 80 cm diameter, 40 cm high, a sculptural printed base whose horizontal layers ripple and flare outward toward the top like rings on water, base in warm sand beige recycled PETG with tiny terracotta and grey flecks, topped with a solid oiled natural oak round top 30 mm thick with visible real wood grain. Large-format pellet 3D printed recycled plastic base with clearly visible horizontal extrusion beads about 1.6 mm high and 5 mm wide, satin sheen, subtle natural irregularities. Seamless warm off-white bone paper studio backdrop, softbox from the upper left, soft long shadow. Professional furniture catalogue photography, 80 mm lens, f/8, photorealistic. Avoid: text, logo, CGI look, plastic table top. --ar 4:5 --style raw
```

Для BIIK, JAPYRAQ, SAIABAQ, ORNEK, UYA и DESK KIT соберите промпт так же: блок SHOT A + DESIGN модели + MATERIAL + SCENE A + CAMERA + Avoid.

---

## 6. Кадры для сайта и презентации (не карточки)

### Групповой кадр коллекции (герой каталога, 16:9)
```text
Wide studio shot of a furniture collection arranged on a seamless warm off-white bone paper backdrop: a tomato red cantilever chair made of one continuous printed ribbon, a deep bottle green round chunky stool like a river stone, a warm sand beige wide C-shaped lounge armchair with an oatmeal felt cushion, and a translucent cobalt blue vase-like table lamp glowing softly, all large-format 3D printed from recycled plastic with clearly visible horizontal extrusion layers and terrazzo flecks, composed with rhythm and generous spacing, soft daylight from the left, long soft shadows, professional design catalogue photography, 50 mm lens, f/8, photorealistic. Avoid: text, logo, CGI look. --ar 16:9 --style raw
```

### Манифест (`manifesto.webp`, широкий)
```text
Wide documentary photograph inside a warm minimalist specialty coffee shop in Astana in winter, morning light through large windows with snow outside, several people sit on deep bottle green round 3D printed stools with visible horizontal layer lines and terrazzo flecks, people are seen from behind or in soft motion blur with no faces visible, steam from cups, light oak counter, concrete floor, candid editorial mood, 35 mm lens, f/2.8, natural colors, subtle film grain, photorealistic. Avoid: text, logo, signage, distorted faces. --ar 16:10 --style raw
```

### Процесс — печать (шаг 4 «Как это сделано»)
```text
Close-up photograph inside a small industrial workshop: the heated nozzle of a large-format pellet 3D printer deposits a glowing bead of molten tomato red recycled plastic onto a half-printed chair, the chair is printed up to the middle of the seat and the top edge shows the fresh glossy bead, the lower layers are matte with terrazzo flecks, a thin wisp of heat haze, aluminium gantry and cables in the blurred background, warm practical light plus cool daylight, documentary industrial photography, 85 mm lens, f/2.8, photorealistic. Avoid: text, logo, brand names on the machine. --ar 4:5 --style raw
```

### Процесс — крышки, сортировка, хлопья (шаги 1–3)
```text
Top-down photograph of four neat heaps of used plastic bottle caps sorted by color (red, green, blue, white) on a light concrete workshop floor, next to them a shallow steel tray of shredded colorful plastic flakes, natural daylight, documentary style, crisp detail, photorealistic. Avoid: text, logos on caps, brand names. --ar 4:5 --style raw
```
```text
Macro photograph of a handful of colorful shredded recycled plastic flakes (red, green, blue, white, yellow) falling from cupped hands into a steel hopper, frozen motion, dark graphite background, single soft spotlight, high detail, photorealistic. Avoid: text, logo. --ar 4:5 --style raw
```

### Мастерская целиком (о компании)
```text
Wide photograph of a small clean design workshop in Astana: a large-format pellet 3D printer printing a red chair, finished chairs and stools in red, green, sand and blue standing in a row, labeled plastic bins of sorted caps, a sanding workbench, a young designer seen from behind checking a print, white walls, large industrial windows with daylight, calm modern atmosphere, 24 mm lens, f/5.6, photorealistic. Avoid: text, readable labels, logos, distorted faces. --ar 16:9 --style raw
```

### Упаковка (для карточек маркетплейсов)
```text
Studio photograph of a minimalist recycled kraft cardboard box with a cut-out window, inside it a deep bottle green 3D printed stool with visible horizontal layers, a plain blank off-white tag tied with cord, a small paper card on top left blank, seamless warm off-white bone backdrop, soft shadow, catalogue photography, photorealistic. Avoid: text, printed graphics, logo. --ar 1:1 --style raw
```

---

## 7. Листы-референсы для превращения в 3D (image-to-3D)

Эти кадры нужны, если вы захотите заменить процедурные модели на сайте настоящими GLB через Meshy, Tripo, Rodin и подобные сервисы. Сервису нужны чистые ракурсы без теней.

```text
Product reference sheet of the TOLQYN chair [вставьте блок DESIGN], shown four times in one image in a row: front view, left side view, back view and three-quarter view, identical object in all views, same scale, plain pure white background, flat even lighting with no shadows, no perspective distortion, high detail, photorealistic material. Avoid: text, labels, grid lines. --ar 3:1 --style raw
```

Для генератора 3D разрежьте лист на отдельные виды или загружайте фото «B — профиль» и «A — 3/4». Полученную модель упростите в Blender, сожмите командой `npx @gltf-transform/cli optimize in.glb out.glb --compress draco` и положите в `public/models/<slug>.glb`. Сайт подхватит её вместо процедурной (это заложено в PROMPT_v2).

---

## 8. Постобработка и размеры

1. **Апскейл** до нужного размера встроенным апскейлом генератора или в Photoshop.
2. **Цвет:** подгоните изделие под HEX из раздела 2.2. Фон студии выровняйте в #EFEBE4 через Curves, чтобы все карточки стояли на одинаковом фоне.
3. **Чистка:** уберите артефакты — лишние ножки, «поплывшие» слои, мусор на фоне — инструментами Generative Fill или Healing.
4. **Зерно:** добавьте одинаковое лёгкое зерно (2–3%) на все кадры. Это сильно убирает «ИИ-гладкость».
5. **Бирки и логотип:** наложите в Figma на кадры F и упаковку.

| Назначение | Формат | Размер | Имя файла |
|---|---|---|---|
| Сайт: карточки каталога | WebP, качество 82 | 1200×1500 (4:5) | `public/images/products/<slug>.webp` |
| Сайт: манифест | WebP, качество 80 | 2400×1500 | `public/images/manifesto.webp` |
| Сайт: шаги процесса | WebP | 1200×1500 | `public/images/process/step-1.webp` … `step-5.webp` |
| izicity.kz | JPG | 1600×1600 (1:1) | до 5 фото: A, C, D, E, F |
| viadigital.kz | JPG | 1600×1600 (1:1) | A, D, C |

Слаги: `tolqyn`, `tas`, `biik`, `qum`, `kol`, `saule`, `japyraq`, `saiabaq`, `ornek`, `uya`, `desk-kit`.

После того как положите файлы в `public/images`, напишите Claude Code: «Подключи реальные изображения из public/images вместо заглушек, проверь скриншотами».

---

## 9. Проверка перед публикацией

- Слои на всех кадрах горизонтальные и идут вдоль формы, без вертикальных полос и без гладких участков.
- Форма на кадрах A, B, D, E одна и та же: число ножек, изгибы, толщина.
- Цвет совпадает с палитрой, фон студии одинаковый на всех карточках.
- Нет случайных букв, логотипов и водяных знаков. Нет искажённых лиц и рук.
- Размеры правдоподобны: стул по колено-бедро стоящему человеку, табурет ниже сиденья стула, бар-табурет у стойки.
- В карточках и в футере сайта есть пометка «Изображения созданы с помощью ИИ».
