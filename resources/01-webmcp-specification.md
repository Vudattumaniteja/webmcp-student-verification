# WebMCP Specification Reference

> Source: [W3C Web Machine Learning Community Group Draft](https://webmachinelearning.github.io/webmcp/)
> Status: CG Draft Specification (Co-developed by Google, Microsoft, OpenAI)

## Overview

WebMCP (Web Model Context Protocol) extends the browser `Document` interface with a `modelContext` property. It allows client-side web applications to register structured tools that AI agents running in the browser (or in browser-hosted sidebars / extensions / chat apps) can discover, inspect, and invoke.

Web pages act as client-side MCP servers, running tool logic in the page's execution context rather than on a remote backend.

---

## WebIDL Interfaces

### Document Extension

```webidl
partial interface Document {
  [SecureContext] readonly attribute ModelContext modelContext;
};
```

* `document.modelContext` is available in secure contexts (`https://` or `localhost`).
* Requires document origin isolation (`Origin-Agent-Cluster` must not be `?0`).
* Gated by the `tools` Permissions Policy (defaults to `'self'`).

---

### ModelContext Interface

```webidl
[Exposed=Window, SecureContext]
interface ModelContext {
  Promise<undefined> registerTool(ModelContextTool tool, optional ModelContextRegisterToolOptions options = {});
  Promise<sequence<RegisteredTool>> getTools(optional ModelContextGetToolOptions options = {});
  Promise<DOMString?> executeTool(RegisteredTool tool, DOMString inputArguments, optional ModelContextExecuteToolOptions options = {});
};
```

---

### Dictionaries & Types

#### 1. `ModelContextTool`

```webidl
dictionary ModelContextTool {
  required DOMString name;
  DOMString title = "";
  required DOMString description;
  required object inputSchema;
  required ToolExecuteCallback execute;
  ModelContextToolAnnotations annotations;
};

callback ToolExecuteCallback = Promise<DOMString> (object input, ToolExecuteCallbackOptions options);
```

* **`name`**: 1 to 128 characters. Allowed characters: ASCII alphanumeric (`a-z`, `A-Z`, `0-9`), underscore (`_`), hyphen (`-`), and dot (`.`).
* **`title`**: Human-readable label for UI display.
* **`description`**: Natural language explanation of what the tool does and when the agent should invoke it.
* **`inputSchema`**: JSON Schema draft-07 compatible object defining expected input arguments.
* **`execute`**: Async JavaScript function receiving `(input, { signal })` and returning a string response or promise resolving to a string.
* **`annotations`**: Security and operational hints (`readOnlyHint`, `untrustedContentHint`).

#### 2. `ToolExecuteCallbackOptions`

```webidl
dictionary ToolExecuteCallbackOptions {
  AbortSignal signal;
};
```

* **`signal`**: An `AbortSignal` triggered if the caller (user or agent) cancels an in-flight tool execution.

#### 3. `ModelContextRegisterToolOptions`

```webidl
dictionary ModelContextRegisterToolOptions {
  AbortSignal signal;
  sequence<USVString> exposedTo;
};
```

* **`signal`**: Pass an `AbortController.signal` to unregister the tool dynamically by calling `controller.abort()`.
* **`exposedTo`**: Array of trusted origins (`https://...`) allowed to access this tool across frames.

#### 4. `RegisteredTool`

```webidl
dictionary RegisteredTool {
  required DOMString name;
  DOMString title = "";
  required DOMString description;
  required DOMString inputSchema;
  required USVString origin;
  required Window window;
  ModelContextToolAnnotations annotations;
};
```

#### 5. `ModelContextToolAnnotations`

```webidl
dictionary ModelContextToolAnnotations {
  boolean readOnlyHint = false;
  boolean untrustedContentHint = false;
};
```

* **`readOnlyHint`**: Set to `true` if the tool only reads data and has no side effects. Helps agents know when confirmation dialogs can be skipped.
* **`untrustedContentHint`**: Set to `true` if tool output contains untrusted third-party or user-generated content, warning the agent to treat returned text with heightened scrutiny against prompt injection.

---

## Tool Execution Lifecycle

1. **Registration:** Web app calls `document.modelContext.registerTool(toolDef, { signal })`. The browser records the tool definition in the document's model context map.
2. **Discovery:** The agent queries `document.modelContext.getTools()`. The browser filters tools by origin and permissions policy and returns `RegisteredTool[]`.
3. **Invocation:** The agent generates JSON arguments and invokes `document.modelContext.executeTool(tool, jsonString)`.
4. **Execution:** The browser parses arguments according to `inputSchema` and runs the registered `execute(input, { signal })` callback on the document's event loop.
5. **Resolution / Abort:** The tool returns a serialized string or aborts if `signal.aborted` fires. If tool triggers a page navigation, the result is `null`.
