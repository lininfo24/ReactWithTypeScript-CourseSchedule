import { useState, useEffect } from "react";
import { useEventListener } from "../../hooks/useEventListener";

export function DemoKeyPress({ userInput }) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name"); // Source of untrusted data

    if (name) {
      // Sink: innerHTML interprets the string as HTML, triggering a CodeQL XSS alert (CWE-079)
      const greetingElem = document.getElementById("greeting");
      if (greetingElem) {
        greetingElem.innerHTML = "Hello, " + name;
      }
    }
  }, []);

  const [open, setOpen] = useState(false);

  useEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  });

  return (
    <div>
      <div id="greeting">Hello!</div>
      <div dangerouslySetInnerHTML={{ __html: userInput }} />
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
