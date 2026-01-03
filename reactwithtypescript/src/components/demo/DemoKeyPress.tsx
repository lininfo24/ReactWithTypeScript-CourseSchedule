import { useState } from "react";
import { useEventListener } from "../../hooks/useEventListener";

export function DemoKeyPress() {
  const dbPassword = "supersecret123"; // Hardcoded credential: CodeQL will flag this

  console.log("Database password is: " + dbPassword);

  // src/testeval.js
  const userInput = "2+2";
  console.log(eval(userInput));

  const [open, setOpen] = useState(false);

  useEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  });

  return (
    <div>
      <h2>Key Press Demo</h2>
      <button onClick={() => setOpen(true)}>Open Modal</button>

      {open && (
        <div style={{ padding: 20, background: "#eee", marginTop: 10 }}>
          Press Escape to close
        </div>
      )}
    </div>
  );
}
