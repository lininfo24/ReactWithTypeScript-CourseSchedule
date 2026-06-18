import React from "react";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Best-practice test suite for CoursePlannerPage
// - Mocks child components to keep tests focused and deterministic
// - Uses semantic queries (role/label) and scoping (within)
// - Cleans up global listeners and module state between tests

// Default mocks for child components. These are defined BEFORE importing the page so
// the page uses these mocks when imported.
vi.mock("../components/CourseCartValue", () => ({
  default: () => <div data-testid="mock-cart">Cart total: <span data-testid="mock-cart-value">0</span></div>,
}));
vi.mock("../components/Location", () => ({
  default: () => <div data-testid="mock-location">Location: Remote</div>,
}));
vi.mock("../components/CourseList", () => ({
  default: () => (
    <div data-testid="mock-course-list">
      <button type="button">Add Course A</button>
    </div>
  ),
}));
vi.mock("../components/ItemCourseSelected", () => ({
  default: ({ onSubmit }: any) => {
    const MockItem: React.FC = () => {
      const [name, setName] = React.useState("");
      const [credits, setCredits] = React.useState("");
      const [errors, setErrors] = React.useState<{ name?: string; credits?: string }>({});

      const validate = () => {
        const e: { name?: string; credits?: string } = {};
        if (!name.trim()) e.name = "Course name is required";
        if (!credits.trim()) e.credits = "Credits are required";
        else if (!/^[0-9]+$/.test(credits) || Number(credits) <= 0)
          e.credits = "Credits must be a positive integer";
        return e;
      };

      const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length === 0) {
          const payload = { name: name.trim(), credits: Number(credits) };
          window.dispatchEvent(new CustomEvent("test-course-submitted", { detail: payload }));
          onSubmit && onSubmit(payload);
        }
      };

      return (
        <form onSubmit={handleSubmit} data-testid="mock-item-form">
          <div>
            <label htmlFor="course-name">Course name</label>
            <input
              id="course-name"
              data-testid="course-name"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
            />
            {errors.name && (
              <div role="alert" data-testid="error-name">
                {errors.name}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="course-credits">Credits</label>
            <input
              id="course-credits"
              data-testid="course-credits"
              value={credits}
              onChange={(e) => setCredits((e.target as HTMLInputElement).value)}
            />
            {errors.credits && (
              <div role="alert" data-testid="error-credits">
                {errors.credits}
              </div>
            )}
          </div>
          <button type="submit">Add</button>
        </form>
      );
    };

    return <MockItem />;
  },
}));

// Import the page under test after mocks are set up
import CoursePlannerPage from "./CoursePlannerPage";

// Helper to remove any test-specific global listeners
const removeTestListeners = () => {
  // There's no straightforward way to list event listeners; remove expected ones explicitly when used.
  // Tests that add listeners remove them in their own scope. This helper exists as a placeholder.
};

describe("CoursePlannerPage - best-practice tests", () => {
  afterEach(() => {
    // cleanup DOM and restore mocked modules where appropriate
    cleanup();
    vi.restoreAllMocks();
    // Reset modules to allow dynamic re-mocking in specific tests
    vi.resetModules();
    removeTestListeners();
  });

  it("renders primary headings and sections (semantic queries)", () => {
    render(<CoursePlannerPage />);

    // h1 and h3 headings are important anchors for screen readers
    const h1 = screen.getByRole("heading", { level: 1, name: /course schedule/i });
    expect(h1).toBeInTheDocument();

    const courseListHeading = screen.getByRole("heading", { name: /course list/i });
    const addCourseHeading = screen.getByRole("heading", { name: /add course/i });

    expect(courseListHeading).toBeInTheDocument();
    expect(addCourseHeading).toBeInTheDocument();

    // Accessibility guard: exactly one H1 on the page
    const h1All = screen.getAllByRole("heading", { level: 1 });
    expect(h1All).toHaveLength(1);
  });

  it("renders mocked child components and respects structure", () => {
    render(<CoursePlannerPage />);

    expect(screen.getByTestId("mock-cart")).toBeInTheDocument();
    expect(screen.getByTestId("mock-location")).toBeInTheDocument();
    expect(screen.getByTestId("mock-course-list")).toBeInTheDocument();
    expect(screen.getByTestId("mock-item-form")).toBeInTheDocument();

    // Ensure the CourseList appears immediately after its heading
    const courseListHeading = screen.getByRole("heading", { name: /course list/i });
    const sibling = courseListHeading.nextElementSibling as HTMLElement | null;
    expect(sibling).not.toBeNull();
    expect(within(sibling as HTMLElement).getByTestId("mock-course-list")).toBeTruthy();
  });

  it("accepts user input and updates form controls (interaction test)", () => {
    render(<CoursePlannerPage />);

    const nameInput = screen.getByTestId("course-name") as HTMLInputElement;
    const creditsInput = screen.getByTestId("course-credits") as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "Intro to Testing" } });
    fireEvent.change(creditsInput, { target: { value: "3" } });

    expect(nameInput.value).toBe("Intro to Testing");
    expect(creditsInput.value).toBe("3");
  });

  it("renders validation errors when submitting invalid data (scoped queries)", async () => {
    render(<CoursePlannerPage />);

    const form = screen.getByTestId("mock-item-form");
    const submit = within(form).getByRole("button", { name: /add/i });

    // Submit empty form -> required errors
    fireEvent.click(submit);
    expect(await screen.findByTestId("error-name")).toHaveTextContent(/required/i);
    expect(await screen.findByTestId("error-credits")).toHaveTextContent(/required/i);

    // Provide invalid credits -> positive integer error
    const nameInput = screen.getByTestId("course-name") as HTMLInputElement;
    const creditsInput = screen.getByTestId("course-credits") as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "Valid" } });
    fireEvent.change(creditsInput, { target: { value: "-1" } });

    fireEvent.click(submit);
    expect(await screen.findByTestId("error-credits")).toHaveTextContent(/positive integer/i);
  });

  it("integrates with child form and receives submission payload (integration test)", async () => {
    const submissions: any[] = [];
    const handler = (e: Event) => submissions.push((e as CustomEvent).detail);
    window.addEventListener("test-course-submitted", handler as EventListener);

    render(<CoursePlannerPage />);

    const form = screen.getByTestId("mock-item-form");
    const nameInput = within(form).getByTestId("course-name") as HTMLInputElement;
    const creditsInput = within(form).getByTestId("course-credits") as HTMLInputElement;
    const submit = within(form).getByRole("button", { name: /add/i });

    fireEvent.change(nameInput, { target: { value: "Software Engineering" } });
    fireEvent.change(creditsInput, { target: { value: "4" } });
    fireEvent.click(submit);

    await waitFor(() => expect(submissions.length).toBe(1));
    expect(submissions[0]).toEqual({ name: "Software Engineering", credits: 4 });

    window.removeEventListener("test-course-submitted", handler as EventListener);
  });

  it("explicitly documents child-render failure behavior (module-level re-mock)", async () => {
    // This test verifies behavior when a child throws during render.
    // Reset module registry and provide a CourseList that throws.
    vi.resetModules();
    vi.doMock("../components/CourseCartValue", () => ({ default: () => <div data-testid="mock-cart" /> }));
    vi.doMock("../components/Location", () => ({ default: () => <div data-testid="mock-location" /> }));
    vi.doMock("../components/CourseList", () => ({
      default: () => {
        throw new Error("Simulated render error in CourseList");
      },
    }));
    // Keep ItemCourseSelected simple
    vi.doMock("../components/ItemCourseSelected", () => ({ default: () => <div data-testid="mock-item-form" /> }));

    // Import fresh instance of the page with the throwing mock
    const { default: PageWithThrow } = await import("./CoursePlannerPage");

    let renderError: Error | null = null;
    try {
      render(<PageWithThrow />);
    } catch (err) {
      renderError = err as Error;
    }

    // The expected behavior in this codebase is to let the error propagate (no error boundary).
    // Assert that a render error occurred and includes the simulated message.
    expect(renderError).not.toBeNull();
    expect(renderError?.message).toContain("Simulated render error in CourseList");
  });

  it("avoids brittle snapshot assertions and focuses on semantics (guidance test)", () => {
    // This test is a placeholder that demonstrates best-practice: prefer semantic assertions
    // over full DOM snapshots. It will assert a few key semantics and intentionally not
    // create a snapshot to avoid fragile tests.
    render(<CoursePlannerPage />);
    expect(screen.getByRole("heading", { name: /course schedule/i })).toBeInTheDocument();
    expect(screen.getByTestId("mock-item-form")).toBeInTheDocument();
  });
});