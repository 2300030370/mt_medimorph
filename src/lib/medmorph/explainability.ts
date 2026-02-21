import type { MealCandidate, MealScoreBreakdown, UserContext } from "./types";

const topReason = (
  label: string,
  value: number,
  threshold: number,
  reason: string,
  out: string[]
) => {
  if (value >= threshold) {
    out.push(`${label}: ${reason}`);
  }
};

export const buildMealExplanation = (
  user: UserContext,
  candidate: MealCandidate,
  score: MealScoreBreakdown
): string[] => {
  const reasons: string[] = [];
  topReason(
    "Preference match",
    score.userPreferenceScore,
    0.7,
    "Aligned with your declared food preferences.",
    reasons
  );
  topReason(
    "Clinical fit",
    score.healthConstraintScore,
    0.7,
    "Compliant with your active health constraints.",
    reasons
  );
  topReason(
    "Adherence prediction",
    score.adherencePredictionScore,
    0.65,
    "Predicted to improve your long-term adherence.",
    reasons
  );
  topReason(
    "Biomarker impact",
    score.biomarkerImpactScore,
    0.65,
    "Expected to support favorable biomarker trends.",
    reasons
  );
  if (score.costScore >= 0.7) {
    reasons.push("Cost: Fits your configured budget profile.");
  }
  if (reasons.length === 0) {
    reasons.push(`Balanced recommendation for ${user.conditions.join(", ") || "general wellness"}.`);
  }

  reasons.push(`Meal candidate: ${candidate.name}.`);
  return reasons;
};

