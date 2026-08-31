# WebMCP Declarative API Guide

> Source: [Google Chrome WebMCP Declarative API Documentation](https://developer.chrome.com/docs/ai/webmcp/declarative-api)

## Overview

The Declarative API turns standard HTML `<form>` elements into WebMCP tools without requiring custom JavaScript registration calls. The browser automatically inspects annotated forms, generates JSON schemas from their child input elements, handles field population, and triggers form events.

---

## Form Attributes

| Attribute | Scope | Description |
| --- | --- | --- |
| `toolname` | `<form>` | Unique identifier for the tool (e.g. `bookFlight`, `submitSupportTicket`). |
| `tooldescription` | `<form>` | Natural language explanation of what the form accomplishes. |
| `toolautosubmit` | `<form>` | Optional boolean attribute. If present, the form automatically submits when the agent finishes filling fields. If omitted, the form fills and waits for the human to click Submit. |
| `toolparamdescription` | `<input>`, `<select>`, `<textarea>` | Description for the specific input parameter in the generated JSON schema. If omitted, the browser falls back to `<label>` text or `aria-description`. |

---

## Declarative Example

```html
<form 
  toolname="bookConsultation" 
  tooldescription="Schedules a consulting session with a legal advisor." 
  toolautosubmit
  action="/api/consultations" 
  method="POST"
>
  <label for="clientName">Full Name</label>
  <input 
    type="text" 
    id="clientName" 
    name="clientName" 
    toolparamdescription="Legal full name of the client" 
    required 
  />

  <label for="practiceArea">Practice Area</label>
  <select 
    id="practiceArea" 
    name="practiceArea" 
    toolparamdescription="Specialty area for legal advice" 
    required
  >
    <option value="corporate">Corporate & Securities</option>
    <option value="ip">Intellectual Property & Patents</option>
    <option value="employment">Employment & Labor</option>
  </select>

  <label for="date">Preferred Date</label>
  <input 
    type="date" 
    id="date" 
    name="date" 
    toolparamdescription="Consultation date in YYYY-MM-DD format" 
    required 
  />

  <button type="submit">Schedule Consultation</button>
</form>
```

---

## SubmitEvent Enhancements (`agentInvoked` & `respondWith`)

The standard DOM `SubmitEvent` is enhanced with:

* **`e.agentInvoked`**: A boolean flag indicating whether the submission was initiated by an AI agent or a manual human click.
* **`e.respondWith(Promise<any>)`**: Allows the page to asynchronously process the form submission (e.g., via `fetch`) and return the resulting text directly to the agent.

```javascript
document.querySelector('form[toolname="bookConsultation"]').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  if (e.agentInvoked) {
    // Custom handling for agent calls
    e.respondWith(
      fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => `Consultation booked with ID: ${data.bookingId} for ${payload.date}`)
      .catch(err => `Booking failed: ${err.message}`)
    );
  } else {
    // Standard human user flow
    await submitFormViaAjax(payload);
    showConfirmationModal();
  }
});
```

---

## Window Events for UI State Sync

The browser dispatches lifecycle events on `window` when declarative tools activate or cancel:

```javascript
// Fired when the agent selects and starts populating a form tool
window.addEventListener('toolactivated', ({ toolName }) => {
  console.log(`Agent started filling tool form: ${toolName}`);
  showAgentTypingBadge(toolName);
});

// Fired if the agent or user cancels during form filling
window.addEventListener('toolcancel', ({ toolName }) => {
  console.log(`Agent cancelled tool form: ${toolName}`);
  hideAgentTypingBadge();
});
```

---

## CSS Pseudo-Classes for Visual Feedback

Browsers apply specific pseudo-classes when an agent is actively filling or submitting a declarative form:

```css
/* Styling the active form while agent is typing */
form:tool-form-active {
  outline: 2px dashed #3b82f6;
  outline-offset: 4px;
  background-color: rgba(59, 130, 246, 0.04);
  transition: all 0.2s ease;
}

/* Styling the submit button when agent triggers submission */
button:tool-submit-active,
input[type="submit"]:tool-submit-active {
  outline: 2px solid #10b981;
  transform: scale(0.98);
}
```
