import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabaseClient";

/**
 * Diagnostic endpoint to check upload infrastructure
 * GET /api/upload/health
 */
export async function GET() {
  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "manuscripts";
  const diagnostics = {
    timestamp: new Date().toISOString(),
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ configured" : "✗ missing",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ configured" : "✗ missing",
    },
    bucket: storageBucket,
    tests: {},
  };

  const storageClient = supabaseAdmin ?? supabase;

  // Test 1: Supabase connection
  try {
    const { data, error } = await storageClient.storage.listBuckets();
    if (error) {
      diagnostics.tests.supabaseConnection = { status: "FAILED", error: error.message };
    } else {
      diagnostics.tests.supabaseConnection = { 
        status: "OK", 
        bucketsFound: data.length,
        buckets: data.map(b => ({ id: b.id, name: b.name }))
      };
    }
  } catch (error) {
    diagnostics.tests.supabaseConnection = { status: "ERROR", error: error.message };
  }

  // Test 2: Check storage bucket specifically
  try {
    const { data, error } = await storageClient.storage
      .from(storageBucket)
      .list("", { limit: 1 });
    
    if (error) {
      diagnostics.tests.manuscriptsBucket = { status: "FAILED", error: error.message };
    } else {
      diagnostics.tests.manuscriptsBucket = { 
        status: "OK", 
        accessible: true,
        fileCount: "Sample check passed"
      };
    }
  } catch (error) {
    diagnostics.tests.manuscriptsBucket = { status: "ERROR", error: error.message };
  }

  // Test 3: Try to get public URL format
  try {
    const testUrl = storageClient.storage
      .from(storageBucket)
      .getPublicUrl("test-file.pdf");
    
    diagnostics.tests.publicUrlGeneration = { 
      status: "OK", 
      sampleUrl: testUrl.publicUrl 
    };
  } catch (error) {
    diagnostics.tests.publicUrlGeneration = { status: "ERROR", error: error.message };
  }

  const hasErrors = Object.values(diagnostics.tests).some(test => test.status !== "OK");

  return NextResponse.json(
    diagnostics,
    { status: hasErrors ? 500 : 200 }
  );
}
