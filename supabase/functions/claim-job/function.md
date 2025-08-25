import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    // Create admin client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create client for request validation using the user's token
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate the requesting user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Check if user has contractor role in the database
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "contractor") {
      return new Response(
        JSON.stringify({ error: "Contractor access required" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Parse request body
    const { caseId } = await req.json();

    if (!caseId) {
      return new Response(JSON.stringify({ error: "Case ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // First, check if the job is available and meets requirements
    const { data: existingCase, error: fetchError } = await supabaseAdmin
      .from("legal_cases")
      .select("id, contractor_status, status, payment_status, contractor_id")
      .eq("id", caseId)
      .eq("contractor_status", "UNASSIGNED")
      .eq("status", "SUBMITTED")
      .eq("payment_status", "PAID")
      .single();

    if (fetchError) {
      console.error("Error fetching case:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Failed to verify job availability",
          details: fetchError.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!existingCase) {
      return new Response(
        JSON.stringify({
          error:
            "Job is no longer available, has been claimed, or does not meet the requirements (must be SUBMITTED, PAID, and UNASSIGNED)",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Use admin client to bypass RLS and claim the job
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("legal_cases")
      .update({
        contractor_id: user.id,
        contractor_status: "ASSIGNED",
        contractor_assigned_date: new Date().toISOString(),
      })
      .eq("id", caseId)
      .eq("contractor_status", "UNASSIGNED") // Additional safety check
      .select();

    if (updateError) {
      console.error("Error updating case:", updateError);

      // Handle specific error cases
      if (updateError.message.includes("duplicate key")) {
        return new Response(
          JSON.stringify({
            error: "Job has already been claimed by another contractor",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to claim job",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!updateData || updateData.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Job was claimed by another contractor during this request",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Job claimed successfully",
        caseId: caseId,
        contractorId: user.id,
        assignedAt: updateData[0].contractor_assigned_date,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Claim job error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
