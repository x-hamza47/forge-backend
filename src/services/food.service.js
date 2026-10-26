import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const MAX_RESULTS = 10;

const CALORIES = [1008, 2047, 2048]; 
const PROTEIN = 1003;
const FAT = 1004;
const CARBS = 1005;

const round = (n) => Math.round(n * 10) / 10;

const pick = (nutrients, ids) => {
  const list = Array.isArray(ids) ? ids : [ids];
  for (const id of list) {
    const found = nutrients.find((n) => n.nutrientId === id);
    if (found && typeof found.value === "number") return found.value;
  }
  return 0;
};

const cleanName = (name) => {
  const trimmed = String(name ?? "").trim();
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
};

const mapFood = (food) => {
  const nutrients = food.foodNutrients ?? [];
  return {
    fdcId: food.fdcId,
    name: cleanName(food.description),
    calories: Math.round(pick(nutrients, CALORIES)),
    protein: round(pick(nutrients, PROTEIN)),
    carbs: round(pick(nutrients, CARBS)),
    fat: round(pick(nutrients, FAT)),
  };
};

export const searchFoods = async (query) => {
  const q = String(query ?? "").trim();
  if (q.length < 2) return [];

  if (!env.usdaApiKey) {
    throw new ApiError(503, "Food search is not configured.");
  }

  const params = new URLSearchParams({
    query: q,
    dataType: "Foundation,SR Legacy",
    pageSize: String(MAX_RESULTS),
    api_key: env.usdaApiKey,
  });

  let res;
  try {
    res = await fetch(`${USDA_URL}?${params}`);
  } catch {
    throw new ApiError(502, "Could not reach the food database. Try again.");
  }

  if (!res.ok) {
    throw new ApiError(502, "Food database returned an error. Try again.");
  }

  const data = await res.json();
  return (data.foods ?? []).map(mapFood);
};