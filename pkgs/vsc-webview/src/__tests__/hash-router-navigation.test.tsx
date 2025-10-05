import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/app/Context", () => ({
  Context: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock("@/app/Index", () => ({
  Index: ({ gatewaySecretState }: { gatewaySecretState: unknown }) => (
    <div data-testid="index-view">Index Route</div>
  ),
}));

vi.mock("@/app/Auth", () => ({
  Auth: ({ gatewaySecretState }: { gatewaySecretState: unknown }) => (
    <div data-testid="auth-view">Auth Route</div>
  ),
}));

vi.mock("@/app/hooks/useGatewaySecretState", () => ({
  useGatewaySecretState: () => ({
    maskedKey: null,
    hasKey: false,
    readOnly: false,
    isSaving: false,
    isResolved: true,
  }),
}));

import { App } from "@/app/App";
import { useAppNavigation } from "@/app/navigation";
import { HashRouter, Route, Routes } from "react-router-dom";

function NavigationHarness() {
  const { navigateTo, goBackOrIndex, currentRoute } = useAppNavigation();

  return (
    <div>
      <span data-testid="current-route">{currentRoute}</span>
      <button onClick={() => navigateTo("auth")}>to-auth</button>
      <button onClick={() => goBackOrIndex()}>go-back</button>
    </div>
  );
}

describe("HashRouter navigation", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  test("renders index route by default", () => {
    render(<App />);
    expect(screen.getByTestId("index-view")).toBeInTheDocument();
    expect(["", "#/"]).toContain(window.location.hash);
  });

  test("renders auth route when hash specifies /auth", () => {
    window.location.hash = "#/auth";
    render(<App />);
    expect(screen.getByTestId("auth-view")).toBeInTheDocument();
  });

  test("treats /index.html alias as index route", () => {
    window.location.hash = "#/index.html";
    render(<App />);
    expect(screen.getByTestId("index-view")).toBeInTheDocument();
    expect(window.location.hash).toBe("#/index.html");
  });

  test("falls back to index for unknown paths", async () => {
    window.location.hash = "#/unknown";
    render(<App />);
    await waitFor(() => expect(screen.getByTestId("index-view")).toBeInTheDocument());
    await waitFor(() => expect(window.location.hash).toBe("#/"));
  });

  test("goBackOrIndex falls back to index when history is empty", async () => {
    render(
      <HashRouter hashType="slash">
        <Routes>
          <Route path="/" element={<NavigationHarness />} />
          <Route path="/auth" element={<NavigationHarness />} />
        </Routes>
      </HashRouter>,
    );

    const toAuth = screen.getByText("to-auth");
    const goBack = screen.getByText("go-back");

    await userEvent.click(toAuth);
    await waitFor(() => expect(screen.getByTestId("current-route").textContent).toBe("auth"));

    Object.defineProperty(window.history, "state", {
      configurable: true,
      value: { idx: 0 },
    });

    await userEvent.click(goBack);
    await waitFor(() => expect(screen.getByTestId("current-route").textContent).toBe("index"));
    await waitFor(() => expect(window.location.hash).toBe("#/"));
  });
});
