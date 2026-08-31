# WebMCP Ecosystem, Testing & Starter Templates

> Reference guide for official tools, libraries, templates, and testing extensions.

---

## 1. Local Testing Setup

### Enable Chrome Experimental Flag
1. Open Google Chrome (v149+).
2. Enter `chrome://flags/#enable-webmcp-testing` in the URL bar.
3. Change the dropdown from **Default** to **Enabled**.
4. Restart Chrome.

### Model Context Tool Inspector Extension
Install the official Chrome Web Store extension:
* **Extension ID:** `gbpdfapgefenggkahomfgkhfehlcenpd`
* **Features:**
  * Displays all tools registered on the active tab via `document.modelContext`.
  * Allows manual test-invocations with custom JSON payloads.
  * Provides an in-browser chat agent powered by Gemini to test real natural language actuation against your tools.

---

## 2. Official npm Packages

### `webmcp-types`
Full TypeScript typings for `document.modelContext`, `ModelContextTool`, schemas, and callback signatures:
```bash
npm install -D webmcp-types
```

### `use-webmcp-tool`
Official React hook for automatic tool lifecycle binding:
```bash
npm install use-webmcp-tool
```

```typescript
import { useWebMCPTool } from 'use-webmcp-tool';

function CartComponent({ cart, updateCart }) {
  useWebMCPTool({
    name: 'update_cart_quantity',
    description: 'Updates item quantity in cart',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        quantity: { type: 'number' }
      },
      required: ['itemId', 'quantity']
    },
    execute: async ({ itemId, quantity }) => {
      updateCart(itemId, quantity);
      return `Updated item ${itemId} to quantity ${quantity}`;
    }
  });

  return <div>Cart UI</div>;
}
```

---

## 3. Supporter Templates & References

* **Cloudflare Workers Template:** [github.com/cloudflare/agents/tree/main/examples/webmcp-react](https://github.com/cloudflare/agents/tree/main/examples/webmcp-react)
* **Vercel Storefront WebMCP PR:** [github.com/vercel/shop/pull/498](https://github.com/vercel/shop/pull/498)
* **Google Chrome Labs WebMCP Demos:** [github.com/GoogleChromeLabs/webmcp-tools](https://github.com/GoogleChromeLabs/webmcp-tools)
  * *zaMaker (Pizza Builder):* Imperative canvas/DOM builder
  * *React Flight Search:* Multi-filter travel booking
  * *French Bistro:* Declarative HTML form tool
* **Netlify Starter:** [webmcp-starter.netlify.app](https://webmcp-starter.netlify.app/)
* **Shopify WebMCP Docs:** [shopify.dev/docs/api/web-mcp](https://shopify.dev/docs/api/web-mcp)

---

## 4. Free Credits for Builders

* **Vercel:** $30 build credits with promo code `OAIWEBMH-9E2F-MUT4` at [credits.vercel.sh/redeem](https://credits.vercel.sh/redeem)
* **Render:** $50 in credits via [credits-portal-mmdm.onrender.com/claim/openai-hackathon](https://credits-portal-mmdm.onrender.com/claim/openai-hackathon)
* **Netlify:** 3,000 credits via form claim at [forms.gle/xw75XGUQzCXEiALc7](https://forms.gle/xw75XGUQzCXEiALc7)
