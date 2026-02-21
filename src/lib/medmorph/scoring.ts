import { buildMealExplanation } from "./explainability";
import { passesClinicalHardStops } from "./rules";
import type {
  MealCandidate,
  MealScoreBreakdown,
  RankedMeal,
  ScoringWeights,
  UserContext,
} from "./types";

export const DEFAULT_WEIGHTS: ScoringWeights = {
  userPreferenceWeight: 0.25,
  healthConstraintWeight: 0.3,
  costWeight: 0.1,
  adherenceWeight: 0.15,
  biomarkerImpactWeight: 0.2,
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const normalizeWeights = (weights: ScoringWeights): ScoringWeights => {
  const total =
    weights.userPreferenceWeight +
    weights.healthConstraintWeight +
    weights.costWeight +
    weights.adherenceWeight +
    weights.biomarkerImpactWeight;

  if (total <= 0) return DEFAULT_WEIGHTS;

  return {
    userPreferenceWeight: weights.userPreferenceWeight / total,
    healthConstraintWeight: weights.healthConstraintWeight / total,
    costWeight: weights.costWeight / total,
    adherenceWeight: weights.adherenceWeight / total,
    biomarkerImpactWeight: weights.biomarkerImpactWeight / total,
  };
};

export const scoreMealCandidate = (
  candidate: MealCandidate,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): MealScoreBreakdown => {
  const w = normalizeWeights(weights);
  const score: MealScoreBreakdown = {
    userPreferenceScore: clamp01(candidate.preferenceScore),
    healthConstraintScore: clamp01(candidate.healthConstraintScore),
    costScore: clamp01(candidate.costScore),
    adherencePredictionScore: clamp01(candidate.adherencePredictionScore),
    biomarkerImpactScore: clamp01(candidate.biomarkerImpactScore),
    weightedCompositeScore: 0,
  };

  score.weightedCompositeScore =
    score.userPreferenceScore * w.userPreferenceWeight +
    score.healthConstraintScore * w.healthConstraintWeight +
    score.costScore * w.costWeight +
    score.adherencePredictionScore * w.adherenceWeight +
    score.biomarkerImpactScore * w.biomarkerImpactWeight;

  return score;
};

export const rankMealCandidates = (
  user: UserContext,
  candidates: MealCandidate[],
  weights: ScoringWeights = DEFAULT_WEIGHTS
): RankedMeal[] => {
  return candidates
    .filter((candidate) => passesClinicalHardStops(candidate, user))
    .map((candidate) => {
      const score = scoreMealCandidate(candidate, weights);
      return {
        ...candidate,
        score,
        explanation: buildMealExplanation(user, candidate, score),
      };
    })
    .sort((a, b) => b.score.weightedCompositeScore - a.score.weightedCompositeScore);
};

