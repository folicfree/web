// Seed food data — static-first (Section 3.1). In production this merges with
// the Supabase `foods` table; until the DB is wired, this bundled asset powers the site.
// Values are CoFID-derived approximations; folate = NATURAL folate only (µg/100g).
// fa: "clean" | "added" | "review" (folic_acid_status)

export type FoodCategory = "base" | "protein" | "veg" | "sauce" | "extra";
export type FaStatus = "clean" | "added" | "review";

export interface Food {
  slug: string;
  name: string;
  category: FoodCategory;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  folate: number;
  fa: FaStatus;
  portionLabel: string;
  portionG: number;
  cost: number; // £ per 100g — derived from packPrice/packG where available
  packG?: number; // real pack size (g) as sold
  packPrice?: number; // observed shelf price (£) for the pack
  image?: string; // product photo (Open Food Facts image URL)
  barcode?: string; // EAN — used to pull image/ingredients from Open Food Facts
  producerUrl?: string; // producer's own site — linked with Google-compliant rel
  note?: string;
}

type Row = [string, string, FoodCategory, number, number, number, number, number, number, FaStatus, string, number, number, string?];

const rows: Row[] = [
  // ---------- BASES ----------
  ["white-bread", "Warburtons White Toastie", "base", 266, 9, 49, 3.2, 2.7, 27, "added", "2 slices", 76, 0.22, "Made with mandatory-fortified non-wholemeal wheat flour"],
  ["wholemeal-bread", "Hovis Wholemeal", "base", 246, 10, 41, 3.4, 6, 40, "clean", "2 slices", 76, 0.26, "Wholemeal flour is exempt from fortification"],
  ["sourdough-white", "Tesco Finest White Sourdough", "base", 262, 10.4, 49, 1.4, 2.3, 30, "added", "2 slices", 80, 0.45],
  ["sourdough-wholemeal", "Gail's Wholemeal Sourdough", "base", 250, 10.5, 44, 2.5, 5.5, 38, "clean", "2 slices", 80, 0.48],
  ["rye-bread", "Biona Organic Rye Bread", "base", 259, 8.5, 45.8, 3.3, 5.8, 30, "clean", "2 slices", 70, 0.4],
  ["seeded-wholemeal-bread", "Vogel's Soy & Linseed", "base", 272, 11, 36, 9, 6.5, 45, "clean", "2 slices", 76, 0.35],
  ["pitta-white", "Warburtons White Pittas", "base", 275, 9.5, 55, 1.9, 2.4, 25, "added", "1 pitta", 60, 0.16],
  ["pitta-wholemeal", "ASDA Wholemeal Pittas", "base", 265, 10, 50, 2.5, 5.5, 38, "clean", "1 pitta", 60, 0.19],
  ["bagel-plain", "New York Bakery Co. Plain Bagels", "base", 257, 10.2, 50, 1.7, 2.2, 28, "added", "1 bagel", 90, 0.25],
  ["naan-garlic", "ASDA Garlic & Coriander Naans", "base", 310, 8.5, 48, 9.5, 2.1, 30, "added", "1 naan", 90, 0.3],
  ["tortilla-flour", "Old El Paso Flour Tortillas", "base", 300, 8, 49, 7.5, 2.5, 26, "added", "1 wrap", 55, 0.14],
  ["tortilla-corn", "Santa Maria Corn Tortillas", "base", 218, 5.7, 44, 2.9, 6.3, 5, "clean", "2 tacos", 52, 0.28, "Maize flour, not covered by the wheat-flour mandate"],
  ["crumpets", "Warburtons Crumpets", "base", 213, 7.9, 43, 1.1, 2.4, 35, "added", "2 crumpets", 100, 0.15],
  ["english-muffin", "Warburtons English Muffins", "base", 235, 9, 44, 1.7, 2.5, 30, "added", "1 muffin", 60, 0.14],
  ["baguette-white", "ASDA White Baguette", "base", 274, 9.6, 55, 1.9, 2.6, 30, "added", "1/4 baguette", 60, 0.16],
  ["chapati-wholemeal", "ASDA Wholemeal Chapatis", "base", 297, 10, 47, 6.5, 5.4, 25, "clean", "1 chapati", 60, 0.12, "Atta is wholemeal flour"],
  ["oatcakes", "Nairn's Rough Cut Oatcakes", "base", 430, 9.5, 60, 15, 8, 20, "clean", "4 oatcakes", 40, 0.28],
  ["gluten-free-brown-bread", "Schär Wholesome Seed Loaf", "base", 250, 4.5, 45, 6, 4, 20, "review", "2 slices", 60, 0.65, "Fortification varies by brand — check the label"],
  ["rice-basmati-cooked", "Basmati rice (cooked)", "base", 132, 3.4, 28, 0.4, 0.6, 5, "clean", "1 cup", 158, 0.14],
  ["rice-brown-cooked", "Brown rice (cooked)", "base", 123, 2.9, 26, 1, 1.1, 5, "clean", "1 cup", 158, 0.18],
  ["quinoa-cooked", "Quinoa (cooked)", "base", 120, 4.4, 21, 1.9, 2.8, 42, "clean", "1 cup", 185, 0.42],
  ["couscous-cooked", "ASDA Plain Couscous (cooked)", "base", 112, 3.8, 23, 0.2, 1.4, 20, "added", "1 cup", 157, 0.2],
  ["couscous-wholemeal-cooked", "Tesco Wholemeal Couscous (cooked)", "base", 110, 4.2, 21, 0.5, 3, 30, "clean", "1 cup", 157, 0.26],
  ["pearl-barley-cooked", "Pearl barley (cooked)", "base", 103, 2.5, 22, 0.6, 3.8, 20, "clean", "1 cup", 157, 0.15],
  ["bulgur-wheat-cooked", "Bulgur wheat (cooked)", "base", 83, 3.1, 19, 0.2, 4.5, 20, "clean", "1 cup", 182, 0.22],
  ["buckwheat-cooked", "Buckwheat (cooked)", "base", 92, 3.4, 20, 0.6, 2.7, 30, "clean", "1 cup", 168, 0.3],
  ["spaghetti-white-cooked", "ASDA White Spaghetti (cooked)", "base", 158, 5.8, 31, 0.9, 1.8, 5, "added", "1 serving", 180, 0.11],
  ["wholemeal-pasta-cooked", "ASDA Wholemeal Penne (cooked)", "base", 124, 5, 22, 1.1, 4.5, 10, "clean", "1 serving", 180, 0.16],
  ["lentil-pasta-cooked", "Red lentil pasta (cooked)", "base", 145, 12, 22, 1.5, 5, 15, "clean", "1 serving", 180, 0.55],
  ["rice-noodles-cooked", "Rice noodles (cooked)", "base", 109, 1.1, 25, 0.2, 1, 3, "clean", "1 serving", 180, 0.24],
  ["soba-noodles-cooked", "Soba noodles (cooked)", "base", 130, 5.5, 25, 0.5, 2, 12, "review", "1 serving", 180, 0.5, "Wheat/buckwheat blends vary — check label"],
  ["gnocchi-cooked", "ASDA Gnocchi (cooked)", "base", 154, 3, 30, 0.6, 1.6, 5, "added", "1 serving", 180, 0.3],
  ["porridge-oats-cooked", "Porridge oats (cooked in water)", "base", 71, 2.5, 12, 1.4, 1.6, 9, "clean", "1 bowl", 230, 0.09],
  ["potato-boiled", "Boiled potatoes", "base", 73, 1.8, 16, 0.1, 1.5, 10, "clean", "2 medium", 240, 0.07],
  ["potato-baked", "Baked potato", "base", 87, 2.2, 19, 0.2, 2, 10, "clean", "1 large", 200, 0.08],
  ["potato-mashed", "Mashed potato", "base", 106, 1.8, 16, 4, 1.5, 10, "clean", "1 serving", 180, 0.1],
  ["sweet-potato-baked", "Baked sweet potato", "base", 90, 2, 21, 0.1, 3.3, 11, "clean", "1 medium", 180, 0.2],
  ["potato-chips-oven", "Oven chips", "base", 148, 2.4, 22, 5.4, 2, 8, "clean", "1 serving", 150, 0.15],
  ["polenta-cooked", "Polenta (cooked)", "base", 74, 1.7, 16, 0.2, 1, 3, "clean", "1 serving", 180, 0.18],
  ["bran-flakes", "Kellogg's Bran Flakes", "base", 320, 11, 62, 4, 12, 210, "added", "40g bowl", 40, 0.2, "Fortified cereals carry added folic acid"],
  ["cornflakes", "Kellogg's Corn Flakes", "base", 378, 7.5, 84, 0.9, 3, 240, "added", "30g bowl", 30, 0.13],
  ["shredded-wheat", "Nestlé Shredded Wheat", "base", 357, 10, 68, 2, 9, 30, "clean", "2 biscuits", 44, 0.18],
  ["weetabix", "Weetabix Original", "base", 362, 12, 64, 2.5, 10, 190, "added", "2 biscuits", 40, 0.2, "Fortified with added vitamins including folic acid — label checked 09/26"],
  ["muesli-no-added", "Dorset Cereals Simply Delicious Muesli", "base", 346, 9.5, 59, 7.5, 7, 40, "clean", "45g bowl", 45, 0.32],
  ["granola-nut", "Jordans Country Crisp Nut", "base", 458, 11, 55, 20, 6, 30, "clean", "40g bowl", 40, 0.42],
  ["oat-so-simple-pot", "Quaker Oat So Simple Original", "base", 374, 8, 66, 6, 5.5, 25, "clean", "1 pot", 55, 0.3],
  // ---------- PROTEINS ----------
  ["chicken-breast", "Chicken breast (grilled)", "protein", 165, 31, 0, 3.6, 0, 6, "clean", "1 fillet", 140, 1.05],
  ["chicken-thigh", "Chicken thighs", "protein", 209, 26, 0, 11, 0, 8, "clean", "2 thighs", 150, 0.75],
  ["chicken-drumsticks", "Chicken drumsticks", "protein", 190, 27, 0, 9, 0, 8, "clean", "2 drumsticks", 160, 0.62],
  ["turkey-mince-7", "Turkey mince (7% fat)", "protein", 130, 24, 0, 3.5, 0, 8, "clean", "1 serving", 125, 0.9],
  ["beef-mince-5", "Beef mince (5% fat)", "protein", 137, 20, 0, 6, 0, 8, "clean", "1 serving", 125, 0.85],
  ["beef-mince-20", "Beef mince (20% fat)", "protein", 254, 17, 0, 20, 0, 8, "clean", "1 serving", 125, 0.62],
  ["beef-sirloin", "Sirloin steak", "protein", 187, 27, 0, 9, 0, 8, "clean", "1 steak", 200, 2.2],
  ["pork-loin", "Pork loin chop", "protein", 176, 26, 0, 7, 0, 8, "clean", "1 chop", 150, 0.95],
  ["lamb-mince", "Lamb mince", "protein", 283, 17, 0, 23, 0, 8, "clean", "1 serving", 125, 1.3],
  ["pork-sausages", "Pork sausages", "protein", 301, 13, 1, 27, 0.5, 5, "clean", "2 sausages", 120, 0.45],
  ["bacon-medallions", "Bacon medallions", "protein", 191, 31, 0, 7, 0, 8, "clean", "3 rashers", 90, 0.8],
  ["ham-sliced", "Sliced ham", "protein", 108, 17, 1.5, 3.5, 0, 8, "clean", "3 slices", 60, 0.9],
  ["meatballs-beef", "Beef meatballs", "protein", 227, 15, 6, 16, 0.5, 8, "clean", "5 meatballs", 125, 0.75],
  ["salmon-fillet", "Salmon fillet", "protein", 208, 20, 0, 13, 0, 6, "clean", "1 fillet", 120, 1.55],
  ["salmon-smoked", "Smoked salmon", "protein", 117, 18, 0, 4.3, 0, 6, "clean", "1 serving", 60, 2.1],
  ["mackerel-fillets", "Mackerel fillets", "protein", 205, 19, 0, 14, 0, 12, "clean", "1 fillet", 90, 0.7],
  ["sardines-tinned", "Sardines in tomato sauce (tin)", "protein", 208, 25, 0, 11, 0, 40, "clean", "1 tin", 90, 0.55],
  ["tuna-tinned", "Tuna chunks in water (tin)", "protein", 116, 26, 0, 1, 0, 8, "clean", "1 tin", 80, 0.65],
  ["tuna-steak", "Tuna steak", "protein", 109, 24, 0, 1, 0, 8, "clean", "1 steak", 130, 1.6],
  ["cod-fillet", "Cod fillet", "protein", 82, 18, 0, 0.7, 0, 12, "clean", "1 fillet", 120, 1.1],
  ["haddock-fillet", "Haddock fillet", "protein", 90, 20, 0, 0.6, 0, 12, "clean", "1 fillet", 120, 1.05],
  ["prawns-cooked", "Cooked prawns", "protein", 99, 24, 0, 0.6, 0, 10, "clean", "1 serving", 100, 1.4],
  ["fish-fingers", "Fish fingers", "protein", 232, 13, 22, 11, 1.5, 10, "review", "4 fingers", 120, 0.35, "Breadcrumb fortification varies by brand"],
  ["eggs-boiled", "Boiled eggs", "protein", 143, 13, 0, 10, 0, 50, "clean", "2 eggs", 120, 0.3],
  ["eggs-fried", "Fried eggs", "protein", 196, 13.6, 0.8, 14.8, 0, 50, "clean", "2 eggs", 120, 0.35],
  ["eggs-scrambled", "Scrambled eggs", "protein", 149, 11, 1.6, 11, 0, 50, "clean", "2 eggs", 120, 0.35],
  ["tofu-firm", "Firm tofu", "protein", 76, 8, 1.9, 4.8, 0.3, 15, "clean", "1/4 block", 90, 0.65],
  ["tofu-smoked", "Smoked tofu", "protein", 130, 12, 2, 9, 0.5, 15, "clean", "1 serving", 90, 0.95],
  ["tempeh", "Tempeh", "protein", 193, 19, 9, 11, 1.4, 15, "clean", "1 serving", 100, 1.25],
  ["falafel-baked", "Falafel (baked)", "protein", 250, 12, 22, 12, 5, 45, "clean", "4 balls", 100, 0.4],
  ["chickpeas-tinned", "Chickpeas (tin, drained)", "protein", 121, 8, 16, 2.8, 4.5, 60, "clean", "1/2 tin", 120, 0.15],
  ["lentils-green-cooked", "Green lentils (cooked)", "protein", 105, 9, 16, 0.6, 5, 60, "clean", "1 serving", 150, 0.2],
  ["lentils-red-cooked", "Red lentils (cooked)", "protein", 108, 8.6, 17, 0.5, 4, 70, "clean", "1 serving", 150, 0.18],
  ["kidney-beans-tinned", "Kidney beans (tin, drained)", "protein", 103, 6.9, 14, 0.5, 5.4, 55, "clean", "1/2 tin", 120, 0.14],
  ["black-beans-tinned", "Black beans (tin, drained)", "protein", 106, 7.7, 13, 0.5, 6, 60, "clean", "1/2 tin", 120, 0.22],
  ["butter-beans-tinned", "Butter beans (tin, drained)", "protein", 99, 7.4, 12, 0.6, 5, 55, "clean", "1/2 tin", 120, 0.16],
  ["baked-beans", "Baked beans", "protein", 78, 5.4, 12, 0.4, 3.7, 40, "clean", "1/2 tin", 200, 0.11],
  ["edamame-beans", "Edamame beans (shelled)", "protein", 122, 12, 8, 5, 5, 311, "clean", "1 serving", 100, 0.55],
  ["quorn-mince", "Quorn mince", "protein", 105, 14, 2, 2.5, 4, 10, "review", "1 serving", 100, 0.85],
  ["halloumi", "Halloumi", "protein", 321, 25, 2, 25, 0, 40, "clean", "2 slices", 80, 1.0],
  ["feta", "Feta", "protein", 264, 14, 4, 21, 0, 32, "clean", "1 serving", 50, 1.1],
  ["mozzarella-light", "Light mozzarella", "protein", 254, 24, 2, 16, 0, 35, "clean", "1 serving", 60, 0.95],
  ["cheddar-mature", "Mature cheddar", "protein", 402, 25, 0.1, 33, 0, 28, "clean", "30g", 30, 0.85],
  ["cottage-cheese", "Cottage cheese", "protein", 98, 11, 4, 3.8, 0, 25, "clean", "1/2 tub", 100, 0.4],
  ["greek-yogurt-full", "Greek yogurt (full fat)", "protein", 97, 9, 4, 5, 0, 8, "clean", "150g pot", 150, 0.35],
  ["skyr", "Skyr", "protein", 63, 11, 4, 0.2, 0, 10, "clean", "1 pot", 170, 0.42],
  ["peanut-butter", "Peanut butter", "protein", 590, 25, 12, 46, 6, 100, "clean", "2 tbsp", 32, 0.45],
  ["hummus", "Hummus", "protein", 232, 7.9, 12, 18, 6, 80, "clean", "2 tbsp", 50, 0.3],
  // ---------- VEG ----------
  ["broccoli", "Broccoli", "veg", 35, 2.8, 3.6, 1.1, 3, 90, "clean", "3 florets", 90, 0.28],
  ["spinach", "Spinach", "veg", 25, 2.9, 1.8, 0.6, 2, 194, "clean", "1 handful", 60, 0.35],
  ["kale", "Kale", "veg", 36, 2.9, 2.4, 1.5, 3.6, 100, "clean", "1 handful", 60, 0.4],
  ["peas", "Garden peas", "veg", 78, 5.4, 12, 0.9, 5, 65, "clean", "1 serving", 100, 0.14],
  ["green-beans", "Green beans", "veg", 31, 1.8, 5, 0.3, 3, 33, "clean", "1 serving", 80, 0.3],
  ["carrots", "Carrots", "veg", 35, 0.9, 6.5, 0.4, 2.8, 25, "clean", "1 carrot", 80, 0.08],
  ["sweetcorn", "Sweetcorn", "veg", 86, 2.9, 16, 1.6, 2.4, 25, "clean", "1/2 tin", 100, 0.13],
  ["tomatoes", "Tomatoes", "veg", 18, 0.9, 3, 0.3, 1.1, 15, "clean", "1 tomato", 80, 0.2],
  ["cherry-tomatoes", "Cherry tomatoes", "veg", 20, 0.9, 3.4, 0.3, 1.1, 20, "clean", "1 handful", 80, 0.45],
  ["cucumber", "Cucumber", "veg", 12, 0.6, 2, 0.2, 0.7, 10, "clean", "1/3 cucumber", 100, 0.18],
  ["pepper-red", "Red pepper", "veg", 31, 1, 4.8, 0.5, 1.8, 30, "clean", "1/2 pepper", 80, 0.45],
  ["red-onion", "Red onion", "veg", 40, 1.1, 7, 0.2, 1.9, 20, "clean", "1/2 onion", 60, 0.1],
  ["mushrooms", "Closed-cup mushrooms", "veg", 22, 1.8, 2.3, 0.3, 1.6, 15, "clean", "1 handful", 80, 0.25],
  ["courgette", "Courgette", "veg", 19, 1.2, 2.2, 0.4, 1.1, 25, "clean", "1/2 courgette", 100, 0.3],
  ["aubergine", "Aubergine", "veg", 24, 0.9, 4, 0.3, 2.5, 22, "clean", "1/3 aubergine", 100, 0.45],
  ["cauliflower", "Cauliflower", "veg", 27, 2, 3, 0.5, 2, 55, "clean", "1/4 head", 120, 0.32],
  ["cabbage-white", "White cabbage", "veg", 24, 1.7, 3.6, 0.2, 2, 40, "clean", "1 serving", 90, 0.2],
  ["asparagus", "Asparagus", "veg", 25, 2.2, 1.7, 0.3, 1.8, 149, "clean", "6 spears", 100, 0.9],
  ["beetroot-cooked", "Cooked beetroot", "veg", 43, 1.7, 8, 0.2, 2, 110, "clean", "1 serving", 80, 0.25],
  ["brussels-sprouts", "Brussels sprouts", "veg", 43, 3.4, 3.6, 0.9, 3.8, 60, "clean", "6 sprouts", 90, 0.4],
  ["butternut-squash", "Butternut squash", "veg", 40, 1, 8, 0.4, 2, 20, "clean", "1 serving", 150, 0.3],
  ["leek", "Leek", "veg", 26, 1.5, 3.4, 0.3, 2.3, 35, "clean", "1 leek", 100, 0.35],
  ["parsnip", "Parsnip", "veg", 71, 1.3, 14, 0.5, 4, 65, "clean", "1 parsnip", 100, 0.3],
  ["avocado", "Avocado", "veg", 160, 1.9, 4, 22, 7, 81, "clean", "1/2 avocado", 75, 0.65],
  ["rocket", "Rocket", "veg", 25, 2.6, 2, 0.7, 1.6, 110, "clean", "1 handful", 40, 0.5],
  ["mixed-leaf-salad", "Mixed leaf salad", "veg", 18, 1.5, 2, 0.3, 1.8, 90, "clean", "1 serving", 60, 0.35],
  ["cavolo-nero", "Cavolo nero", "veg", 40, 3, 3, 1.2, 3.5, 120, "clean", "1 handful", 60, 0.6],
  ["swede", "Swede", "veg", 32, 1, 6, 0.4, 2.5, 40, "clean", "1 serving", 130, 0.2],
  ["savoy-cabbage", "Savoy cabbage", "veg", 27, 2, 3.5, 0.3, 2.5, 70, "clean", "1 serving", 90, 0.22],
  ["roast-med-veg", "Roasted Mediterranean veg", "veg", 90, 2, 9, 4.5, 3, 40, "clean", "1 serving", 150, 0.55],
  ["peas-frozen-mint", "Minted garden peas", "veg", 82, 5.5, 11, 1, 5, 60, "clean", "1 serving", 100, 0.18],
  ["stir-fry-veg-mix", "Stir-fry veg mix", "veg", 40, 2, 5, 0.6, 2.4, 40, "clean", "1 serving", 120, 0.4],
  ["mange-tout", "Mange tout", "veg", 42, 2.8, 6, 0.3, 2.5, 40, "clean", "1 handful", 70, 0.7],
  ["onion-white", "Onion", "veg", 40, 1, 7, 0.2, 1.7, 15, "clean", "1 onion", 100, 0.08],
  ["sweet-potato-fries-oven", "Sweet potato fries (oven)", "veg", 130, 1.6, 20, 4.5, 3, 11, "clean", "1 serving", 130, 0.28],
  ["kimchi", "Kimchi", "veg", 15, 1.1, 1.6, 0.5, 1.6, 15, "clean", "1 tbsp", 30, 1.2],
  ["sauerkraut", "Sauerkraut", "veg", 19, 0.9, 4.1, 0.1, 2.9, 15, "clean", "1 tbsp", 30, 0.35],
  ["baby-spinach-cooked", "Wilted baby spinach", "veg", 30, 3, 1.5, 0.5, 2, 200, "clean", "1 serving", 80, 0.4],
  // ---------- EXTRAS (fruit & job-to-be-done upgrades) ----------
  ["pineapple-fresh", "Fresh pineapple", "extra", 50, 0.4, 13, 0.1, 1.4, 18, "clean", "1/2 pineapple", 200, 0.13],
  ["banana", "Banana", "extra", 89, 1.1, 23, 0.3, 2.6, 20, "clean", "1 banana", 118, 0.16],
  ["apple", "Apple", "extra", 52, 0.5, 12, 0.2, 2, 5, "clean", "1 apple", 150, 0.22],
  ["orange", "Orange", "extra", 47, 0.9, 9, 0.1, 2.4, 30, "clean", "1 orange", 160, 0.18],
  ["blueberries", "Blueberries", "extra", 57, 0.7, 12, 0.3, 2.4, 6, "clean", "1 handful", 80, 0.85],
  ["strawberries", "Strawberries", "extra", 30, 0.7, 6, 0.3, 1.8, 25, "clean", "1 handful", 100, 0.7],
  ["raspberries", "Raspberries", "extra", 37, 1.2, 5, 0.3, 3.3, 30, "clean", "1 handful", 80, 0.9],
  ["kiwi", "Kiwi", "extra", 61, 1.1, 12, 0.5, 3, 25, "clean", "1 kiwi", 75, 0.35],
  ["mango", "Mango", "extra", 60, 0.8, 15, 0.4, 1.6, 40, "clean", "1/2 mango", 150, 0.45],
  ["grapes", "Grapes", "extra", 69, 0.6, 16, 0.2, 0.9, 5, "clean", "1 handful", 100, 0.45],
  ["melon", "Melon", "extra", 28, 0.6, 6, 0.2, 0.9, 5, "clean", "1/4 melon", 150, 0.25],
  ["pear", "Pear", "extra", 57, 0.4, 13, 0.1, 3.1, 10, "clean", "1 pear", 170, 0.25],
  ["dates", "Dates", "extra", 282, 2.5, 75, 0.4, 8, 15, "clean", "3 dates", 60, 0.8],
  ["raisins", "Raisins", "extra", 300, 3, 79, 0.5, 3, 5, "clean", "1 tbsp", 30, 0.55],
  // ---------- SAUCES (schema-ready; sauces step deferred to v1.1) ----------
  ["olive-oil", "Olive oil", "sauce", 884, 0, 0, 100, 0, 0, "clean", "1 tbsp", 14, 0.85],
  ["passata", "Passata", "sauce", 38, 1.6, 6.6, 0.3, 1.5, 10, "clean", "1/4 jar", 100, 0.2],
  ["soy-sauce", "Soy sauce", "sauce", 53, 8, 4, 0.1, 0.6, 15, "clean", "1 tbsp", 15, 0.9],
  ["ketchup", "Tomato ketchup", "sauce", 99, 1.2, 24, 0.1, 0.3, 10, "clean", "1 tbsp", 17, 0.35],
  ["mayo", "Mayonnaise", "sauce", 680, 1, 0.6, 75, 0, 5, "clean", "1 tbsp", 15, 0.4],
  ["pesto", "Green pesto", "sauce", 450, 5, 6, 45, 2, 15, "clean", "1 tbsp", 16, 0.9],
  ["balsamic-vinegar", "Balsamic vinegar", "sauce", 88, 0.5, 17, 0, 0, 0, "clean", "1 tbsp", 15, 1.1],
  ["hot-sauce", "Hot sauce", "sauce", 15, 0.5, 2.5, 0.3, 0.3, 5, "clean", "1 tsp", 5, 1.3],
];

export const foods: Food[] = rows.map(
  ([slug, name, category, kcal, protein, carbs, fat, fibre, folate, fa, portionLabel, portionG, cost, note]) => ({
    slug, name, category, kcal, protein, carbs, fat, fibre, folate, fa,
    portionLabel, portionG, cost, note, jurisdiction: "UK",
  })
);

// ---------- Pack data (Section 4 pricing) ----------
// Real pack sizes and observed shelf prices. cost per 100g is DERIVED from these
// (packPrice / packG), never guessed. Portion costs therefore come from actual
// retail packs. Rows not listed here keep their cold-start estimate.
// NOTE: shelf prices are approximate observed values — the community price
// pipeline (Section 4.2) is the long-term source of truth.
const PACKS: Record<string, { packG: number; packPrice: number; producerUrl?: string }> = {
  "white-bread": { packG: 800, packPrice: 1.4 },
  "wholemeal-bread": { packG: 800, packPrice: 1.4, producerUrl: "https://www.hovis.co.uk" },
  "sourdough-white": { packG: 400, packPrice: 1.9 },
  "sourdough-wholemeal": { packG: 800, packPrice: 5.4, producerUrl: "https://gails.com" },
  "rye-bread": { packG: 500, packPrice: 2.35, producerUrl: "https://www.biona.co.uk" },
  "seeded-wholemeal-bread": { packG: 800, packPrice: 2.3 },
  "pitta-white": { packG: 360, packPrice: 0.95 },
  "pitta-wholemeal": { packG: 360, packPrice: 0.55 },
  "bagel-plain": { packG: 450, packPrice: 1.2, producerUrl: "https://newyorkbakery.co.uk" },
  "naan-garlic": { packG: 180, packPrice: 0.75 },
  "tortilla-flour": { packG: 320, packPrice: 1.75, producerUrl: "https://www.oldelpaso.co.uk" },
  "tortilla-corn": { packG: 232, packPrice: 1.2, producerUrl: "https://santamariaworld.com" },
  "crumpets": { packG: 300, packPrice: 0.9 },
  "english-muffin": { packG: 240, packPrice: 0.95 },
  "baguette-white": { packG: 260, packPrice: 0.55 },
  "chapati-wholemeal": { packG: 300, packPrice: 0.6 },
  "oatcakes": { packG: 300, packPrice: 1.45, producerUrl: "https://nairns-oatcakes.com" },
  "gluten-free-brown-bread": { packG: 500, packPrice: 3.0, producerUrl: "https://schaer.com" },
  "bran-flakes": { packG: 500, packPrice: 2.35 },
  "cornflakes": { packG: 500, packPrice: 2.5 },
  "shredded-wheat": { packG: 560, packPrice: 3.25, producerUrl: "https://www.nestle.co.uk" },
  "weetabix": { packG: 430, packPrice: 2.35, producerUrl: "https://www.weetabix.co.uk" },
  "muesli-no-added": { packG: 560, packPrice: 3.0, producerUrl: "https://www.dorsetcereals.co.uk" },
  "granola-nut": { packG: 500, packPrice: 2.75, producerUrl: "https://www.jordanscereals.co.uk" },
  "oat-so-simple-pot": { packG: 550, packPrice: 2.65, producerUrl: "https://www.quaker.co.uk" },
};

import imagesJson from "./food-images.json";

const IMAGES = imagesJson as Record<string, string>;

function applyPacks(f: Food): Food {
  const p = PACKS[f.slug];
  const image = IMAGES[f.slug];
  if (!p && !image) return f;
  return {
    ...f,
    image: image ?? f.image,
    ...(p
      ? {
          packG: p.packG,
          packPrice: p.packPrice,
          producerUrl: p.producerUrl,
          cost: Math.round((p.packPrice / p.packG) * 100 * 1000) / 1000, // £/100g derived from the real pack
        }
      : {}),
  };
}

export const foodsPriced: Food[] = foods.map(applyPacks);

export const foodsBySlug = new Map(foodsPriced.map((f) => [f.slug, f]));

export function getFood(slug: string): Food | undefined {
  return foodsBySlug.get(slug);
}

export function foodsInCategory(c: FoodCategory): Food[] {
  return foodsPriced.filter((f) => f.category === c);
}

// ---------- Comparison Cross (Section 6.2) ----------
// lateral = same-category alternatives (the search people arrive with)
// vertical = categorically different options solving the same job better
interface CrossEntry { center: string; lateral: string[]; vertical: string[] }

const crossRows: CrossEntry[] = [
  { center: "white-bread", lateral: ["wholemeal-bread", "rye-bread", "seeded-wholemeal-bread", "pitta-wholemeal", "sourdough-wholemeal"], vertical: ["pineapple-fresh", "banana", "porridge-oats-cooked"] },
  { center: "pitta-white", lateral: ["pitta-wholemeal", "wholemeal-bread", "chapati-wholemeal"], vertical: ["potato-baked", "banana"] },
  { center: "bagel-plain", lateral: ["wholemeal-bread", "rye-bread", "oatcakes"], vertical: ["banana", "porridge-oats-cooked"] },
  { center: "crumpets", lateral: ["wholemeal-bread", "oatcakes", "pitta-wholemeal"], vertical: ["porridge-oats-cooked", "banana"] },
  { center: "naan-garlic", lateral: ["chapati-wholemeal", "pitta-wholemeal"], vertical: ["rice-basmati-cooked", "potato-boiled"] },
  { center: "baguette-white", lateral: ["wholemeal-bread", "rye-bread", "sourdough-wholemeal"], vertical: ["pineapple-fresh", "melon"] },
  { center: "tortilla-flour", lateral: ["tortilla-corn", "chapati-wholemeal", "pitta-wholemeal"], vertical: ["potato-baked", "banana"] },
  { center: "sourdough-white", lateral: ["sourdough-wholemeal", "rye-bread", "wholemeal-bread"], vertical: ["pineapple-fresh", "banana"] },
  { center: "english-muffin", lateral: ["wholemeal-bread", "oatcakes", "pitta-wholemeal"], vertical: ["porridge-oats-cooked", "kiwi"] },
  { center: "crumpets", lateral: ["wholemeal-bread", "oatcakes", "pitta-wholemeal"], vertical: ["porridge-oats-cooked", "banana"] },
  { center: "spaghetti-white-cooked", lateral: ["wholemeal-pasta-cooked", "lentil-pasta-cooked"], vertical: ["quinoa-cooked", "bulgur-wheat-cooked"] },
  { center: "couscous-cooked", lateral: ["couscous-wholemeal-cooked", "quinoa-cooked", "bulgur-wheat-cooked"], vertical: ["potato-boiled", "pearl-barley-cooked"] },
  { center: "bran-flakes", lateral: ["shredded-wheat", "muesli-no-added", "oat-so-simple-pot"], vertical: ["porridge-oats-cooked", "banana"] },
  { center: "cornflakes", lateral: ["muesli-no-added", "shredded-wheat", "oat-so-simple-pot"], vertical: ["porridge-oats-cooked", "strawberries"] },
  { center: "gnocchi-cooked", lateral: ["wholemeal-pasta-cooked", "polenta-cooked"], vertical: ["potato-boiled", "quinoa-cooked"] },
];

export const comparisonCross: Map<string, CrossEntry> = new Map(crossRows.map((c) => [c.center, c]));

export function getCross(slug: string): CrossEntry | undefined {
  return comparisonCross.get(slug);
}




