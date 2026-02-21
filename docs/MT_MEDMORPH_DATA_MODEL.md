# MT MedMorph Data Model (Core)

## Tenant and Identity

### `tenants`
- `id` (uuid, pk)
- `name` (text)
- `type` (hospital|insurer|care_home|enterprise)
- `created_at`

### `users`
- `id` (uuid, pk)
- `tenant_id` (fk tenants.id)
- `email` (unique)
- `role` (user|admin|tenant_admin|clinician)
- `status` (active|inactive)
- `created_at`

## Clinical Profile

### `health_profiles`
- `id` (uuid, pk)
- `user_id` (fk users.id)
- `age`, `gender`, `height_cm`, `weight_kg`, `activity_level`
- `goal_bmi_min`, `goal_bmi_max`
- `conditions` (jsonb)
- `allergies` (jsonb)
- `dietary_pattern` (jsonb)
- `created_at`, `updated_at`

### `medications`
- `id` (uuid, pk)
- `user_id` (fk users.id)
- `name`, `dose`, `schedule`
- `interaction_risk_level`
- `created_at`, `updated_at`

### `biomarker_snapshots`
- `id` (uuid, pk)
- `user_id` (fk users.id)
- `hba1c`, `ldl`, `hdl`, `triglycerides`, `glucose_mean`, `bmi`
- `captured_at`

## Nutrition and Planning

### `foods`
- `id` (uuid, pk)
- `name`, `category`, `allergen_flags`, `sustainability_score`

### `recipes`
- `id` (uuid, pk)
- `name`, `cuisine`, `prep_minutes`, `cost_tier`
- `ingredients` (jsonb)
- `nutrition_facts` (jsonb)

### `meal_plans`
- `id` (uuid, pk)
- `user_id` (fk users.id)
- `week_start_date`
- `status` (draft|active|archived)
- `composite_score`
- `explanation_bundle` (jsonb)
- `created_at`

### `meal_plan_items`
- `id` (uuid, pk)
- `meal_plan_id` (fk meal_plans.id)
- `date`
- `meal_type` (breakfast|lunch|dinner)
- `recipe_id` (fk recipes.id)
- `nutrient_projection` (jsonb)
- `swap_allowed` (bool)

### `grocery_lists`
- `id` (uuid, pk)
- `meal_plan_id` (fk meal_plans.id)
- `items` (jsonb)
- `estimated_total_cost`
- `generated_at`

## Feedback and Model Ops

### `feedback_events`
- `id` (uuid, pk)
- `user_id` (fk users.id)
- `meal_plan_id` (fk meal_plans.id)
- `rating` (1..5)
- `adherence_percent`
- `free_text`
- `created_at`

### `model_runs`
- `id` (uuid, pk)
- `model_name`
- `model_version`
- `dataset_hash`
- `metrics` (jsonb)
- `executed_at`

## Compliance and Security

### `audit_events`
- `id` (uuid, pk)
- `tenant_id`, `actor_user_id`
- `action`, `resource_type`, `resource_id`
- `before_state` (jsonb), `after_state` (jsonb)
- `ip_address`, `user_agent`
- `created_at`

### `integrity_anchors`
- `id` (uuid, pk)
- `event_batch_hash`
- `chain_network`
- `tx_hash`
- `anchored_at`

