import type { MealCandidate, UserContext } from "./types";

export const passesClinicalHardStops = (
  candidate: MealCandidate,
  user: UserContext
): boolean => {
  const hasAllergyConflict = candidate.allergens.some((allergen) =>
    user.allergies.includes(allergen)
  );
  if (hasAllergyConflict) return false;

  const hasConditionConflict = candidate.contraindicatedForConditions.some(
    (condition) => user.conditions.includes(condition)
  );
  if (hasConditionConflict) return false;

  const hasMedicationConflict = candidate.contraindicatedWithMedications.some(
    (medication) => user.medications.includes(medication)
  );
  if (hasMedicationConflict) return false;

  return true;
};

