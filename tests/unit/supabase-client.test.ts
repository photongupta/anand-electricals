import { describe, it, expect, vi } from "vitest";
import { createClient } from "@/lib/supabase/client";

describe("createClient", () => {
  it("throws a clear error when env vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => createClient()).toThrow();
  });
});
