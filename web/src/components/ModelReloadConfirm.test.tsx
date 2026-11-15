// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModelReloadConfirm } from "./ModelReloadConfirm";

/**
 * #146342: a model pick is saved under the management scope the switcher had
 * selected, but the confirm dialog's plain `window.location.reload()` replays a
 * profile-less URL, which `initialProfileScope()` resolves back to the
 * `--open-profile` bootstrap preselection — so the dashboard comes back in a
 * different profile than the one the model was saved under. The reload must
 * carry the saved scope explicitly (`?profile=` with an empty value for "this
 * dashboard", which beats the bootstrap fallback by design).
 */
describe("ModelReloadConfirm reload scope", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  let originalLocation: Location;
  let locationStub: {
    href: string;
    assign: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    originalLocation = window.location;
    locationStub = {
      href: "http://localhost:3000/chat",
      assign: vi.fn(),
      reload: vi.fn(),
    };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: locationStub,
    });
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    container = null;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  function openAndConfirm(model: string, profile?: string) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(
        <ModelReloadConfirm model={model} profile={profile} onCancel={() => {}} />,
      );
    });
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    const button =
      (dialog!.querySelector<HTMLButtonElement>("[data-confirm]") ??
        Array.from(dialog!.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Reload"),
        ))!;
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }

  it("reloads into the dashboard's own scope when the pick was saved under it", () => {
    openAndConfirm("glm-5.3", "");

    expect(locationStub.reload).not.toHaveBeenCalled();
    expect(locationStub.assign).toHaveBeenCalledTimes(1);
    const url = new URL(locationStub.assign.mock.calls[0][0] as string);
    expect(url.searchParams.has("profile")).toBe(true);
    expect(url.searchParams.get("profile")).toBe("");
  });

  it("reloads into the named profile the pick was saved under", () => {
    openAndConfirm("glm-5.3", "code-monkey");

    expect(locationStub.reload).not.toHaveBeenCalled();
    const url = new URL(locationStub.assign.mock.calls[0][0] as string);
    expect(url.searchParams.get("profile")).toBe("code-monkey");
  });

  it("keeps the plain reload when no scope is known", () => {
    openAndConfirm("glm-5.3");

    expect(locationStub.reload).toHaveBeenCalledTimes(1);
    expect(locationStub.assign).not.toHaveBeenCalled();
  });
});
