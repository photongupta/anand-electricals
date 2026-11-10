"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t("language")}</h2>
        <LanguageToggle />
      </section>
      <Button variant="outline" onClick={handleLogout}>
        {t("logout")}
      </Button>
    </div>
  );
}
