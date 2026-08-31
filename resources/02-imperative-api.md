# WebMCP Imperative API Guide

> Source: [Google Chrome WebMCP Imperative API Documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

## Overview

The Imperative API allows web applications to register JavaScript functions as tools using `document.modelContext.registerTool()`. This is the primary approach for Single Page Applications (React, Next.js, Vue, Svelte, Angular, Solid), canvas apps, stateful dashboards, and real-time interactive tools.

---

## TypeScript Setup

Install the official types package:

```bash
npm install webmcp-types
```

Or declare global types manually if needed:

```typescript
// types/webmcp.d.ts
import 'webmcp-types';
```

---

## Basic Registration Example

```typescript
const toggleLayerTool = {
  name: "toggle_layer",
  title: "Toggle Pizza Layer",
  description: "Control pizza layers (sauce, cheese). Use 'add', 'remove', or 'toggle'.",
  inputSchema: {
    type: "object",
    properties: {
      layer: {
        type: "string",
        enum: ["sauce-layer", "cheese-layer"],
        description: "The name of the layer to modify"
      },
      action: {
        type: "string",
        enum: ["add", "remove", "toggle"],
        description: "The operation to perform"
      }
    },
    required: ["layer"]
  },
  execute: async ({ layer, action }: { layer: string; action?: string }, { signal }: { signal: AbortSignal }) => {
    if (signal.aborted) {
      throw new DOMException("Execution cancelled", "AbortError");
    }

    await toggleLayerInUI(layer, action || "toggle");
    return `Successfully executed ${action || 'toggle'} on layer ${layer}`;
  },
  annotations: {
    readOnlyHint: false,
    untrustedContentHint: false
  }
};

// Register tool with the browser
await document.modelContext.registerTool(toggleLayerTool);
```

---

## Dynamic Unregistration via `AbortController`

You can bind a tool's lifecycle to a React component lifecycle or view state using an `AbortController`.

```typescript
import { useEffect } from "react";

export function useWebMCPTool(toolDefinition: any) {
  useEffect(() => {
    if (!("modelContext" in document)) return;

    const controller = new AbortController();

    document.modelContext.registerTool(toolDefinition, {
      signal: controller.signal
    }).catch(console.error);

    return () => {
      // Aborts registration and removes tool when component unmounts
      controller.abort();
    };
  }, [toolDefinition]);
}
```

---

## Handling Tool Cancellation

Long-running operations (like `fetch` or complex computations) should forward the provided `signal` parameter:

```typescript
await document.modelContext.registerTool({
  name: "fetch_market_data",
  description: "Fetches live ticker data for a stock symbol",
  inputSchema: {
    type: "object",
    properties: {
      symbol: { type: "string", description: "Stock ticker symbol, e.g. GOOG" }
    },
    required: ["symbol"]
  },
  execute: async ({ symbol }, { signal }) => {
    // Forward signal to abort network request if user/agent cancels
    const response = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
    const data = await response.json();
    return JSON.stringify(data);
  },
  annotations: {
    readOnlyHint: true,
    untrustedContentHint: false
  }
});
```

---

## Tool Discovery & In-App Execution

You can build in-app agent chatbars or testing panels that discover and execute tools:

```typescript
// 1. Discover registered same-origin tools
const tools = await document.modelContext.getTools();
console.log(`Found ${tools.length} available tools`);

// 2. Discover cross-origin tools from allowed iframes
const allTools = await document.modelContext.getTools({
  fromOrigins: ["https://partner.com", "https://checkout.mystore.com"]
});

// 3. Programmatically execute a tool
const targetTool = tools.find(t => t.name === "fetch_market_data");
if (targetTool) {
  const result = await document.modelContext.executeTool(
    targetTool,
    JSON.stringify({ symbol: "AAPL" })
  );
  console.log("Tool returned:", result);
}
```

---

## JSON Schema Design Guidelines

* Keep property names short and camelCase or snake_case.
* Always specify `"type"` (`string`, `number`, `boolean`, `array`, `object`).
* Use `"enum"` or `"oneOf"` for constrained option sets so the agent doesn't guess.
* Add clear `"description"` fields to each property explaining formats, units, or valid ranges.
* Set `"required"` explicitly.
