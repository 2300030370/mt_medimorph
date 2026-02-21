import { rankMealCandidates } from "./scoring";
import type { MealCandidate, MealType, RankedMeal, UserContext } from "./types";

export interface DailyPlan {
  day: string;
  breakfast: RankedMeal | null;
  lunch: RankedMeal | null;
  dinner: RankedMeal | null;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const bestForType = (
  user: UserContext,
  candidates: MealCandidate[],
  mealType: MealType
): RankedMeal | null => {
  const ranked = rankMealCandidates(
    user,
    candidates.filter((candidate) => candidate.type === mealType)
  );
  return ranked[0] ?? null;
};

export const buildWeeklyPlan = (
  user: UserContext,
  candidates: MealCandidate[]
): DailyPlan[] => {
  const breakfast = bestForType(user, candidates, "breakfast");
  const lunch = bestForType(user, candidates, "lunch");
  const dinner = bestForType(user, candidates, "dinner");

  return DAYS.map((day) => ({
    day,
    breakfast,
    lunch,
    dinner,
  }));
};

