import { describe, expect, it } from "vitest";
import { buildWeeklyPlan, rankMealCandidates, scoreMealCandidate } from "@/lib/medmorph";
import type { MealCandidate, UserContext } from "@/lib/medmorph";

const user: UserContext = {
  userId: "u1",
  tenantId: "t1",
  preferences: ["high-protein", "mediterranean"],
  allergies: ["peanut"],
  conditions: ["diabetes"],
  medications: ["warfarin"],
  budgetLevel: "medium",
};

const safeCandidate: MealCandidate = {
  id: "m1",
  name: "Grilled Salmon Bowl",
  type: "dinner",
  tags: ["high-protein"],
  allergens: [],
  contraindicatedForConditions: [],
  contraindicatedWithMedications: [],
  costScore: 0.7,
  preferenceScore: 0.8,
  adherencePredictionScore: 0.75,
  biomarkerImpactScore: 0.78,
  healthConstraintScore: 0.88,
};

const blockedCandidate: MealCandidate = {
  id: "m2",
  name: "Peanut Noodle Bowl",
  type: "dinner",
  tags: ["asian"],
  allergens: ["peanut"],
  contraindicatedForConditions: [],
  contraindicatedWithMedications: [],
  costScore: 0.8,
  preferenceScore: 0.6,
  adherencePredictionScore: 0.6,
  biomarkerImpactScore: 0.5,
  healthConstraintScore: 0.6,
};

describe("medmorph scoring", () => {
  it("scores with a weighted composite", () => {
    const score = scoreMealCandidate(safeCandidate);
    expect(score.weightedCompositeScore).toBeGreaterThan(0.7);
    expect(score.healthConstraintScore).toBe(0.88);
  });

  it("filters hard-stop clinical conflicts", () => {
    const ranked = rankMealCandidates(user, [safeCandidate, blockedCandidate]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe("m1");
  });

  it("returns explainability messages", () => {
    const ranked = rankMealCandidates(user, [safeCandidate]);
    expect(ranked[0].explanation.length).toBeGreaterThan(0);
  });

  it("builds a 7-day plan with 3 meals per day", () => {
    const candidates: MealCandidate[] = [
      { ...safeCandidate, type: "breakfast", id: "b1", name: "Greek Yogurt Bowl" },
      { ...safeCandidate, type: "lunch", id: "l1", name: "Lentil Veggie Salad" },
      { ...safeCandidate, type: "dinner", id: "d1", name: "Grilled Salmon Bowl" },
    ];
    const plan = buildWeeklyPlan(user, candidates);
    expect(plan).toHaveLength(7);
    expect(plan[0].breakfast?.id).toBe("b1");
    expect(plan[0].lunch?.id).toBe("l1");
    expect(plan[0].dinner?.id).toBe("d1");
  });
});
