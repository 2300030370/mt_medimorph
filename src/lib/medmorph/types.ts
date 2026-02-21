export type MealType = "breakfast" | "lunch" | "dinner";

export interface UserContext {
  userId: string;
  tenantId: string;
  preferences: string[];
  allergies: string[];
  conditions: string[];
  medications: string[];
  budgetLevel: "low" | "medium" | "high";
}

export interface MealCandidate {
  id: string;
  name: string;
  type: MealType;
  tags: string[];
  allergens: string[];
  contraindicatedForConditions: string[];
  contraindicatedWithMedications: string[];
  costScore: number;
  preferenceScore: number;
  adherencePredictionScore: number;
  biomarkerImpactScore: number;
  healthConstraintScore: number;
}

export interface ScoringWeights {
  userPreferenceWeight: number;
  healthConstraintWeight: number;
  costWeight: number;
  adherenceWeight: number;
  biomarkerImpactWeight: number;
}

export interface MealScoreBreakdown {
  userPreferenceScore: number;
  healthConstraintScore: number;
  costScore: number;
  adherencePredictionScore: number;
  biomarkerImpactScore: number;
  weightedCompositeScore: number;
}

export interface RankedMeal extends MealCandidate {
  score: MealScoreBreakdown;
  explanation: string[];
}

