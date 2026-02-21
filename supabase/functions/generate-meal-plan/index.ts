import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    // Get the user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Fetch all residents with profiles for dietary context
    const { data: residents } = await supabase
      .from("residents")
      .select("allergies, dietary_reqs, preferences");

    const { data: profiles } = await supabase
      .from("profiles")
      .select("full_name, age");

    // Build dietary context
    const allAllergies = [...new Set((residents || []).flatMap((r) => r.allergies))];
    const allDietaryReqs = [...new Set((residents || []).flatMap((r) => r.dietary_reqs))];
    const allPreferences = [...new Set((residents || []).flatMap((r) => r.preferences))];
    const ages = (profiles || []).map((p) => p.age).filter(Boolean);
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 65;

    const systemPrompt = `You are a clinical nutritionist AI for a care facility. Generate a 7-day meal plan (Monday-Sunday) with breakfast, lunch, dinner, and snack for each day.

IMPORTANT CONSTRAINTS:
- Average resident age: ${avgAge}
- Allergies to AVOID: ${allAllergies.join(", ") || "none reported"}
- Dietary requirements: ${allDietaryReqs.join(", ") || "standard balanced diet"}
- Preferences: ${allPreferences.join(", ") || "no specific preferences"}

RULES:
- Meals must be safe for elderly residents
- Avoid all listed allergens strictly
- Respect dietary requirements (e.g., low sodium, diabetic-friendly)
- Provide variety across the week
- Include nutrient-rich, easy-to-digest foods
- Each meal name should be concise (3-6 words)`;

    const userPrompt = `Generate a complete 7-day meal plan. Return ONLY the meal data.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_meal_plan",
              description: "Save a 7-day meal plan with breakfast, lunch, dinner, and snack for each day",
              parameters: {
                type: "object",
                properties: {
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string", enum: days },
                        breakfast: { type: "string", description: "Breakfast meal name, 3-6 words" },
                        lunch: { type: "string", description: "Lunch meal name, 3-6 words" },
                        dinner: { type: "string", description: "Dinner meal name, 3-6 words" },
                        snack: { type: "string", description: "Snack name, 3-6 words" },
                      },
                      required: ["day", "breakfast", "lunch", "dinner", "snack"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["days"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_meal_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured meal plan");

    const mealPlan = JSON.parse(toolCall.function.arguments);

    // Delete existing meal plans and insert new ones
    await supabase.from("meal_plans").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const rows = mealPlan.days.map((d: any) => ({
      day: d.day,
      breakfast: d.breakfast,
      lunch: d.lunch,
      dinner: d.dinner,
      snack: d.snack,
      created_by: user.id,
    }));

    const { error: insertError } = await supabase.from("meal_plans").insert(rows);
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, mealPlan: mealPlan.days }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-meal-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
