import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

describe("Footer", () => {
  it("should render footer with copyright text", () => {
    render(<Footer />);
    
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    expect(screen.getByText(/Software Production Line/i)).toBeInTheDocument();
  });

  it("should have the correct className", () => {
    render(<Footer />);
    
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("footer");
  });
});
