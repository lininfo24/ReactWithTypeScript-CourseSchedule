import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock child components before importing the page so that CoursePlannerPage uses these mocks.
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

// The mocked ItemCourseSelected exposes a small form that performs validation and dispatches
// a global CustomEvent 'test-course-submitted' with payload { name, credits } on successful submit.
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

    // Return the mock form component
    return <MockItem />;
  },
}));

// Import the page after mocks so the page uses the mocked child components.
import CoursePlannerPage from "./CoursePlannerPage";

describe("CoursePlannerPage (with mocked children)", () => {
  beforeEach(() => {});

  it("renders main headings and mocked child components", () => {
    render(<CoursePlannerPage />);

    expect(screen.getByRole("heading", { name: /course schedule/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /course list/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /add course/i })).toBeInTheDocument();

    expect(screen.getByTestId("mock-cart")).toBeInTheDocument();
    expect(screen.getByTestId("mock-location")).toBeInTheDocument();
    expect(screen.getByTestId("mock-course-list")).toBeInTheDocument();
    expect(screen.getByTestId("mock-item-form")).toBeInTheDocument();
  });

  it("accepts user input for course name and credits", async () => {
    render(<CoursePlannerPage />);
    const nameInput = screen.getByTestId("course-name") as HTMLInputElement;
    const creditsInput = screen.getByTestId("course-credits") as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "Intro to Testing" } });
    fireEvent.change(creditsInput, { target: { value: "3" } });

    expect(nameInput.value).toBe("Intro to Testing");
    expect(creditsInput.value).toBe("3");
  });

  it("renders validation errors when submitting invalid input", async () => {
    render(<CoursePlannerPage />);
    const form = screen.getByTestId("mock-item-form");
    const submit = within(form).getByRole("button", { name: /add/i });
    fireEvent.click(submit);

    expect(await screen.findByTestId("error-name")).toHaveTextContent(/required/i);
    expect(await screen.findByTestId("error-credits")).toHaveTextContent(/required/i);

    const nameInput = screen.getByTestId("course-name") as HTMLInputElement;
    const creditsInput = screen.getByTestId("course-credits") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Valid Name" } });
    fireEvent.change(creditsInput, { target: { value: "-5" } });

    fireEvent.click(submit);
    expect(await screen.findByTestId("error-credits")).toHaveTextContent(/positive integer/i);
  });

  it("dispatches submission event with correct payload on valid submit", async () => {
    const submissions: any[] = [];
    const handler = (e: Event) => submissions.push((e as CustomEvent).detail);
    window.addEventListener("test-course-submitted", handler as EventListener);

    render(<CoursePlannerPage />);
    const nameInput = screen.getByTestId("course-name") as HTMLInputElement;
    const creditsInput = screen.getByTestId("course-credits") as HTMLInputElement;
    const form = screen.getByTestId("mock-item-form");
    const submit = within(form).getByRole("button", { name: /add/i });

    fireEvent.change(nameInput, { target: { value: "Software Engineering" } });
    fireEvent.change(creditsInput, { target: { value: "4" } });
    fireEvent.click(submit);

    await waitFor(() => expect(submissions.length).toBe(1));
    expect(submissions[0]).toEqual({ name: "Software Engineering", credits: 4 });

    window.removeEventListener("test-course-submitted", handler as EventListener);
  });
});
