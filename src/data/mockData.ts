export interface Resident {
  id: string;
  name: string;
  room: string;
  age: number;
  allergies: string[];
  dietaryReqs: string[];
  preferences: string[];
  satisfactionScore: number;
  avatar: string;
}

export interface MealPlan {
  id: string;
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  residentId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: "good" | "low" | "expiring";
}

export const residents: Resident[] = [
  { id: "1", name: "Margaret Thompson", room: "101A", age: 82, allergies: ["Gluten"], dietaryReqs: ["Low Sodium"], preferences: ["Soup", "Fish", "Fruit"], satisfactionScore: 88, avatar: "MT" },
  { id: "2", name: "Robert Chen", room: "104B", age: 76, allergies: [], dietaryReqs: ["Diabetic"], preferences: ["Chicken", "Rice", "Vegetables"], satisfactionScore: 92, avatar: "RC" },
  { id: "3", name: "Dorothy Williams", room: "108A", age: 89, allergies: ["Dairy", "Nuts"], dietaryReqs: ["Soft Foods"], preferences: ["Porridge", "Stew", "Pudding"], satisfactionScore: 75, avatar: "DW" },
  { id: "4", name: "James Miller", room: "112C", age: 71, allergies: ["Shellfish"], dietaryReqs: ["High Protein"], preferences: ["Steak", "Eggs", "Beans"], satisfactionScore: 95, avatar: "JM" },
  { id: "5", name: "Patricia Davis", room: "115A", age: 85, allergies: [], dietaryReqs: ["Low Fat"], preferences: ["Salad", "Grilled Fish", "Yogurt"], satisfactionScore: 81, avatar: "PD" },
  { id: "6", name: "William Johnson", room: "203B", age: 78, allergies: ["Eggs"], dietaryReqs: ["Vegetarian"], preferences: ["Pasta", "Soup", "Bread"], satisfactionScore: 87, avatar: "WJ" },
];

export const weeklyMealPlan: MealPlan[] = [
  { id: "1", day: "Monday", breakfast: "Oatmeal with Berries", lunch: "Grilled Chicken Salad", dinner: "Baked Salmon with Vegetables", snack: "Fresh Fruit Bowl" },
  { id: "2", day: "Tuesday", breakfast: "Scrambled Eggs & Toast", lunch: "Minestrone Soup & Roll", dinner: "Beef Stew with Mashed Potato", snack: "Yogurt Parfait" },
  { id: "3", day: "Wednesday", breakfast: "Pancakes with Syrup", lunch: "Turkey Club Sandwich", dinner: "Pasta Primavera", snack: "Cheese & Crackers" },
  { id: "4", day: "Thursday", breakfast: "Fruit Smoothie Bowl", lunch: "Fish & Chips", dinner: "Roast Chicken with Greens", snack: "Rice Pudding" },
  { id: "5", day: "Friday", breakfast: "Porridge with Honey", lunch: "Vegetable Stir Fry", dinner: "Shepherd's Pie", snack: "Apple Slices & PB" },
  { id: "6", day: "Saturday", breakfast: "French Toast", lunch: "Tomato Soup & Grilled Cheese", dinner: "Grilled Fish Tacos", snack: "Banana Bread" },
  { id: "7", day: "Sunday", breakfast: "Full English Breakfast", lunch: "Roast Dinner", dinner: "Light Salad & Quiche", snack: "Scones with Jam" },
];

export const inventory: InventoryItem[] = [
  { id: "1", name: "Chicken Breast", category: "Protein", quantity: 15, unit: "kg", expiryDate: "2026-02-20", status: "good" },
  { id: "2", name: "Salmon Fillet", category: "Protein", quantity: 3, unit: "kg", expiryDate: "2026-02-18", status: "expiring" },
  { id: "3", name: "Brown Rice", category: "Grains", quantity: 25, unit: "kg", expiryDate: "2026-06-15", status: "good" },
  { id: "4", name: "Fresh Spinach", category: "Vegetables", quantity: 2, unit: "kg", expiryDate: "2026-02-17", status: "expiring" },
  { id: "5", name: "Whole Milk", category: "Dairy", quantity: 8, unit: "L", expiryDate: "2026-02-22", status: "good" },
  { id: "6", name: "Eggs (Free Range)", category: "Dairy", quantity: 4, unit: "dozen", expiryDate: "2026-02-25", status: "low" },
  { id: "7", name: "Pasta (Penne)", category: "Grains", quantity: 12, unit: "kg", expiryDate: "2026-08-10", status: "good" },
  { id: "8", name: "Tomatoes", category: "Vegetables", quantity: 5, unit: "kg", expiryDate: "2026-02-19", status: "good" },
  { id: "9", name: "Butter", category: "Dairy", quantity: 1, unit: "kg", expiryDate: "2026-02-18", status: "low" },
  { id: "10", name: "Apples", category: "Fruits", quantity: 8, unit: "kg", expiryDate: "2026-02-24", status: "good" },
];
