// Visual fallbacks — an emoji stands in for generic single-ingredient foods
// until a product photo exists (branded items get real Open Food Facts images).
import type { Food } from "@/data/foods";

const RULES: [RegExp, string][] = [
  [/pitta|bagel|naan|tortilla|chapati|crumpet|muffin|baguette|sourdough|bread|toastie|wrap/i, "🍞"],
  [/rice/i, "🍚"],
  [/pasta|spaghetti|noodle|penne/i, "🍝"],
  [/potato|chips|gnocchi/i, "🥔"],
  [/porridge|oats|muesli|granola|bran|cornflakes|shredded|weetabix|oatcake|cereal/i, "🥣"],
  [/quinoa|barley|bulgur|buckwheat|couscous|polenta/i, "🌾"],
  [/chicken/i, "🍗"],
  [/beef|steak|meatball|mince|lamb|turkey/i, "🥩"],
  [/sausage/i, "🌭"],
  [/bacon|ham/i, "🥓"],
  [/salmon|tuna|cod|haddock|prawn|sardine|mackerel|fish/i, "🐟"],
  [/egg/i, "🥚"],
  [/tofu|tempeh/i, "🧊"],
  [/falafel/i, "🧆"],
  [/bean|lentil|chickpea|quorn/i, "🫘"],
  [/halloumi|feta|mozzarella|cheddar|cottage cheese/i, "🧀"],
  [/yogurt|skyr/i, "🥛"],
  [/peanut|hummus/i, "🥜"],
  [/broccoli/i, "🥦"],
  [/spinach|kale|cavolo|cabbage|lettuce|rocket|salad/i, "🥬"],
  [/carrot/i, "🥕"],
  [/corn/i, "🌽"],
  [/tomato/i, "🍅"],
  [/pepper/i, "🫑"],
  [/avocado/i, "🥑"],
  [/mushroom/i, "🍄"],
  [/peas|edamame|mange/i, "🫛"],
  [/courgette|cucumber|aubergine|squash/i, "🥒"],
  [/banana/i, "🍌"],
  [/apple/i, "🍎"],
  [/orange/i, "🍊"],
  [/blueberr|blackberr/i, "🫐"],
  [/strawberr/i, "🍓"],
  [/raspberr/i, "🫐"],
  [/grape|raisin/i, "🍇"],
  [/melon/i, "🍈"],
  [/kiwi/i, "🥝"],
  [/mango/i, "🥭"],
  [/pineapple/i, "🍍"],
  [/pear|date/i, "🍐"],
  [/onion|leek|garlic/i, "🧅"],
  [/beetroot/i, "🍠"],
  [/asparagus/i, "🌿"],
  [/mushroom/i, "🍄"],
  [/oil|vinegar/i, "🫒"],
  [/passata|ketchup|sauce|mayo|pesto/i, "🥫"],
];

export function foodEmoji(f: Food): string {
  for (const [re, emoji] of RULES) {
    if (re.test(f.name)) return emoji;
  }
  if (f.category === "veg") return "🥗";
  if (f.category === "extra") return "🍎";
  if (f.category === "protein") return "🍖";
  return "🍽️";
}
