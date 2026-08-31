# WebMCP Security & Best Practices Guide

> Source: [Google Chrome WebMCP Security Guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

## Security Architecture

Because LLMs treat instructions and user content within the same context window, agents are vulnerable to **indirect prompt injection** and **misrepresentation of intent**. WebMCP introduces security boundaries to mitigate these risks.

---

## 1. Character Budgets for Schemas & Outputs

To keep agent context windows lean and avoid triggering LLM safety overrides, follow these recommended limits:

| Element | Recommended Limit |
| --- | --- |
| Tool Name | Max 30 characters |
| Tool Description | Max 500 characters |
| Parameter Name | Max 30 characters |
| Parameter Description | Max 150 characters |
| Individual Tool Output | Max 1,500 characters |

---

## 2. Using Annotations (`readOnlyHint` & `untrustedContentHint`)

Always provide annotations on sensitive tools:

```typescript
annotations: {
  // Set to true if the tool ONLY retrieves information without mutating app state or placing orders
  readOnlyHint: true,

  // Set to true if output contains external untrusted data (e.g. user comments, scraped text, reviews)
  untrustedContentHint: true
}
```

* **`readOnlyHint: true`** signals to the agent and browser that invoking this tool does not execute critical state changes, allowing safe background execution without demanding unnecessary user confirmation prompts.
* **`untrustedContentHint: true`** tags the returned string as untrusted data so the LLM knows not to interpret text inside the payload as system instructions.

---

## 3. Cross-Origin Exposure (`exposedTo`)

By default, WebMCP tools are strictly isolated to the registering document's origin. Cross-origin iframes cannot see or invoke your tools unless explicitly granted:

```typescript
await document.modelContext.registerTool({
  name: "partner_checkout",
  description: "Checkout integration for trusted partners",
  // ...
}, {
  exposedTo: ["https://trusted-partner.com", "https://checkout.mystore.com"]
});
```

* Only expose tools containing sensitive user actions to explicitly trusted domains.
* Use the iframe attribute `allow="tools"` to enable WebMCP in embedded cross-origin frames.

---

## 4. Best Practices for Tool Design

### Focus on High-Level Intent
Expose tools that represent semantic user intents rather than raw UI clicks.
* **Good:** `filter_products({ category: 'laptops', maxPrice: 1500 })`
* **Bad:** `click_sidebar_checkbox({ index: 3 })`

### Return Structured, Succinct Feedback
Always return informative confirmation messages or structured JSON strings so the agent knows the exact state after execution.

```typescript
// Good
return JSON.stringify({ status: "success", appliedFilters: ["price_under_100", "size_m"], matchingItems: 14 });

// Bad
return "OK";
```

### Clean Error Handling
If an argument is invalid or an action fails, throw or return descriptive error text explaining what went wrong and how the agent can correct its parameters:

```typescript
if (input.quantity > item.stock) {
  return `Error: Only ${item.stock} units of ${item.name} are available in stock. Please adjust quantity.`;
}
```
