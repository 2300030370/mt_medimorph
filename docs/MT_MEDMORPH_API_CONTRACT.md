# MT MedMorph API Contract (v1)

## Auth and Access

All endpoints require OAuth2/JWT bearer tokens and tenant context.

## User Endpoints

### `POST /v1/profile`
Create/update demographic and health profile.

### `POST /v1/meal-plans/generate`
Generate clinically constrained 7-day plan.

Request:
- profile snapshot
- medication list
- wearable summary
- dietary preferences
- pantry ingredient detections

Response:
- 7-day plan (3 meals/day)
- per-meal score components
- explainability blocks (`why_this_meal`)

### `POST /v1/meal-plans/{plan_id}/swap`
Real-time meal swap with instant nutrient recalculation.

### `GET /v1/grocery-lists/{plan_id}`
Categorized grocery list with cost and substitute options.

### `POST /v1/feedback`
Submit rating, adherence, and text feedback for retraining.

## Admin Endpoints

### `POST /v1/admin/rules`
Create/update chronic condition and medication rules.

### `POST /v1/admin/knowledge-graph/nodes`
Manage nutrition knowledge graph entities.

### `POST /v1/admin/knowledge-graph/edges`
Manage entity relationships.

### `GET /v1/admin/models/metrics`
Model monitoring metrics and drift indicators.

### `POST /v1/admin/models/retrain`
Trigger retraining pipeline from approved datasets.

### `GET /v1/admin/compliance/audit`
Query immutable audit events by actor, action, and date range.

## Advanced Intelligence Endpoints

### `POST /v1/forecast/biomarkers`
Predict HbA1c, LDL, and BMI trajectory from adherence scenarios.

### `POST /v1/digital-twin/simulate`
Run metabolic simulation across candidate meal strategies.

### `POST /v1/cgm/recalibrate`
Adjust upcoming meals based on near-real-time CGM signals.

### `POST /v1/coaching/chat`
Behavioral coaching and habit guidance with relapse detection.

### `GET /v1/sustainability/score/{meal_id}`
Carbon footprint score and eco-optimized substitutions.

