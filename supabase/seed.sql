-- ============================================================
-- Chester Guinness Index — Seed Data
-- 15 real Chester pubs with realistic coordinates
-- ============================================================

INSERT INTO pubs (name, slug, address, area, lat, lng, guinness_price_gbp, description) VALUES
(
  'The Old Harkers Arms',
  'the-old-harkers-arms',
  '1 Russell Street, Chester, CH3 5AL',
  'City Centre',
  53.1935,
  -2.8953,
  5.10,
  'A beautifully converted Victorian warehouse on the Shropshire Union Canal. High ceilings, exposed brickwork, and an exceptional Guinness.'
),
(
  'The Bear & Billet',
  'the-bear-and-billet',
  '94 Lower Bridge Street, Chester, CH1 1RU',
  'City Centre',
  53.1882,
  -2.8921,
  4.90,
  'One of Chester''s oldest pubs, dating to 1664. A Grade I listed gem on Lower Bridge Street serving a consistently fine pint.'
),
(
  'The Pied Bull',
  'the-pied-bull',
  '57 Northgate Street, Chester, CH1 2HQ',
  'City Centre',
  53.1916,
  -2.8941,
  4.80,
  'Chester''s oldest inn, with origins in 1154. Low beams, history seeping from every wall, and a surprisingly good Guinness.'
),
(
  'Ye Olde King''s Head',
  'ye-olde-kings-head',
  '48-50 Lower Bridge Street, Chester, CH1 1RS',
  'City Centre',
  53.1878,
  -2.8919,
  4.70,
  'A timber-framed Tudor pub with deep history and a warm, welcoming tap. The Guinness is poured with patience.'
),
(
  'The Albion Inn',
  'the-albion-inn',
  'Park Street, Chester, CH1 1RN',
  'City Centre',
  53.1874,
  -2.8938,
  4.50,
  'A proper time capsule — no fruit machines, no music, no nonsense. Just great beer in a Victorian pub that time forgot.'
),
(
  'Telford''s Warehouse',
  'telfords-warehouse',
  'Tower Wharf, Raymond Street, Chester, CH1 4EJ',
  'City Centre',
  53.1941,
  -2.8961,
  5.20,
  'A converted 19th-century warehouse by the canal basin. Industrial chic with an excellent selection and reliable Guinness.'
),
(
  'The Union Vaults',
  'the-union-vaults',
  '14 Egerton Street, Chester, CH1 3ND',
  'City Centre',
  53.1907,
  -2.8901,
  4.60,
  'A no-frills boozer beloved by locals. The Guinness arrives with minimal fuss and maximum quality.'
),
(
  'The Botanist',
  'the-botanist',
  '2 Bridge Street Row, Chester, CH1 1NW',
  'City Centre',
  53.1897,
  -2.8912,
  5.40,
  'A stylish bar housed in Chester''s iconic Rows. Excellent atmosphere and a well-kept Guinness for a more modern crowd.'
),
(
  'The Brewery Tap',
  'the-brewery-tap',
  '52-54 Lower Bridge Street, Chester, CH1 1RU',
  'City Centre',
  53.1883,
  -2.8905,
  4.85,
  'Chester''s own craft brewery tap. The Guinness competes admirably with the house ales.'
),
(
  'The Watergate',
  'the-watergate',
  '18 Watergate Street, Chester, CH1 2LA',
  'City Centre',
  53.1908,
  -2.8953,
  5.00,
  'Right on historic Watergate Street with magnificent black-and-white timbered surroundings. A premium setting for a premium pint.'
),
(
  'The Falcon',
  'the-falcon',
  '8-10 Lower Bridge Street, Chester, CH1 1RU',
  'City Centre',
  53.1876,
  -2.8915,
  4.75,
  'A handsome pub at the bottom of Lower Bridge Street. Consistent form and friendly bar staff who know their Guinness.'
),
(
  'The Cellar',
  'the-cellar',
  '12 St Werburgh Street, Chester, CH1 2DY',
  'City Centre',
  53.1919,
  -2.8924,
  5.15,
  'Underground bar tucked beneath the city streets. Intimate, dark, and unexpectedly brilliant for a pint.'
),
(
  'The Bull & Stirrup Hotel',
  'the-bull-and-stirrup',
  '42 Upper Northgate Street, Chester, CH1 4EE',
  'City Centre',
  53.1924,
  -2.8945,
  4.95,
  'A traditional coaching inn that''s been refreshed without losing its soul. The Guinness is well-settled and worth the walk.'
),
(
  'The Ship Victory',
  'the-ship-victory',
  '19 George Street, Chester, CH1 3EQ',
  'City Centre',
  53.1892,
  -2.8930,
  4.55,
  'A compact, characterful pub just off the main drag. No pretence, proper Guinness, loyal regulars.'
),
(
  'The Architect',
  'the-architect',
  '45 Bridge Street, Chester, CH1 1NQ',
  'City Centre',
  53.1888,
  -2.8911,
  5.30,
  'A Wetherspoon conversion of a former Lloyd''s Bank — high ceilings, art deco touches, and the most affordable Guinness in Chester.'
);

-- ============================================================
-- SEED REVIEWS (official, varied scores)
-- ============================================================

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  9, 9, 10, 10, 8,
  5.10,
  'Immaculate bar, perfectly cleaned glassware. The pour was textbook — two-stage, proper settle time, domed head. Taste was silky and roast-forward.',
  'The finest Guinness in Chester. The Old Harkers Arms sets the standard every other pub is measured against.',
  TRUE,
  '2026-01-15'
FROM pubs p WHERE p.slug = 'the-old-harkers-arms';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  8, 8, 9, 9, 9,
  4.90,
  'Historic setting, well-maintained. Staff knowledgeable and unhurried. The pour respected the process.',
  'Elite status. The Bear & Billet consistently delivers. History and quality in one glass.',
  TRUE,
  '2026-01-22'
FROM pubs p WHERE p.slug = 'the-bear-and-billet';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  7, 8, 8, 8, 9,
  4.80,
  'Oldest inn in Chester, and it shows — in the best possible way. The Guinness was well-kept and properly poured.',
  'Strong showing from one of England''s oldest pubs. The Pied Bull earns its reputation.',
  TRUE,
  '2026-01-28'
FROM pubs p WHERE p.slug = 'the-pied-bull';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  8, 7, 8, 8, 9,
  4.70,
  'Lovely timber beams and a characterful bar. The Guinness was good — not exceptional but very solid.',
  'Ye Olde King''s Head delivers a strong, dependable pint in a stunning historic setting.',
  TRUE,
  '2026-02-04'
FROM pubs p WHERE p.slug = 'ye-olde-kings-head';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  9, 10, 8, 9, 10,
  4.50,
  'The Albion is a time capsule. No TV, no noise, just serious drinkers and serious beer. Staff are old school and excellent.',
  'The Albion Inn is a national treasure. The Guinness is outstanding and the price is the best value in Chester.',
  TRUE,
  '2026-02-10'
FROM pubs p WHERE p.slug = 'the-albion-inn';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  8, 7, 8, 8, 6,
  5.20,
  'Superb setting in the converted warehouse. The Guinness was well-poured but slightly overcooled. Price is steep.',
  'Telford''s scores on atmosphere but loses points on price and a slightly thin taste. Worth a visit for the setting.',
  TRUE,
  '2026-02-14'
FROM pubs p WHERE p.slug = 'telfords-warehouse';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  6, 7, 7, 7, 9,
  4.60,
  'A no-frills local. Nothing flashy — just a clean glass, a willing barman, and a decent pint.',
  'The Union Vaults is an honest pub with an honest pint. Solid Decent territory.',
  TRUE,
  '2026-02-18'
FROM pubs p WHERE p.slug = 'the-union-vaults';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  8, 7, 7, 7, 5,
  5.40,
  'Beautiful bar space inside Chester''s iconic Rows. Guinness was fine but overpriced for what it is.',
  'The Botanist is all style, reasonable substance. The Guinness is acceptable but the premium price stings.',
  TRUE,
  '2026-02-20'
FROM pubs p WHERE p.slug = 'the-botanist';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  7, 7, 8, 8, 8,
  4.85,
  'Good atmosphere, friendly staff. The Guinness pour was careful and the result was a well-balanced pint.',
  'The Brewery Tap is a reliable mid-tier choice. Strong Decent — good all round.',
  TRUE,
  '2026-02-25'
FROM pubs p WHERE p.slug = 'the-brewery-tap';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  8, 8, 9, 9, 7,
  5.00,
  'Gorgeous historic setting on Watergate Street. Two-stage pour done properly. Taste was excellent — bitter, creamy, complex.',
  'The Watergate punches above its weight. An Elite pub in an Elite setting.',
  TRUE,
  '2026-03-02'
FROM pubs p WHERE p.slug = 'the-watergate';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  7, 8, 7, 7, 8,
  4.75,
  'Comfortable lower Bridge Street pub. Staff were attentive and the Guinness was decent if unremarkable.',
  'The Falcon is a solid, dependable local. Decent territory — does the job well.',
  TRUE,
  '2026-03-05'
FROM pubs p WHERE p.slug = 'the-falcon';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  7, 6, 8, 8, 7,
  5.15,
  'Underground bar with great atmosphere. A little dim to check the glass but the Guinness spoke for itself.',
  'The Cellar surprises. Hidden away below street level, it pours a seriously good Guinness.',
  TRUE,
  '2026-03-09'
FROM pubs p WHERE p.slug = 'the-cellar';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  7, 7, 7, 7, 7,
  4.95,
  'Clean, well-run hotel pub. The Guinness was standard issue — no complaints, no fireworks.',
  'The Bull & Stirrup is a dependable choice. Decent in every category.',
  TRUE,
  '2026-03-12'
FROM pubs p WHERE p.slug = 'the-bull-and-stirrup';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  5, 6, 6, 6, 9,
  4.55,
  'Small and a little tired-looking. Staff were fine. The Guinness was poured quickly — too quickly. Taste was flat.',
  'The Ship Victory scores on price but falls short on the pour. Weak territory, needs improvement.',
  TRUE,
  '2026-03-15'
FROM pubs p WHERE p.slug = 'the-ship-victory';

INSERT INTO reviews (pub_id, pub_look_cleanliness, staff, glass_pour, taste_quality, price_score, guinness_price_gbp, notes, verdict, is_official, visited_at)
SELECT
  p.id,
  7, 5, 6, 6, 10,
  5.30,
  'The converted bank is a stunning space. Wetherspoon efficiency means the Guinness arrives fast — sometimes too fast. Taste is mediocre.',
  'The Architect wins on price and atmosphere but loses on pour quality and taste. A Decent Wetherspoon pint.',
  TRUE,
  '2026-03-18'
FROM pubs p WHERE p.slug = 'the-architect';
