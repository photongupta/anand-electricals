import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

describe("LanguageToggle", () => {
  it("switches displayed language from English to Hindi", () => {
    render(<LanguageToggle />);
    expect(screen.getByText(/english/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /hindi/i }));
    expect(screen.getByText(/हिन्दी|hindi/i)).toBeInTheDocument();
  });
});
