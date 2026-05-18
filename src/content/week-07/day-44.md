# Day 44 — MCP SDK: Hello World Server

> *"Every revolution starts with hello world. Today's hello world happens to be a universal AI tool server."*

**Date:** Marti, 1 Iulie 2026
**Hours:** 2h · Evening build session
**Topic:** Building your first MCP server with the TypeScript SDK
**Phase:** Faza 2 — Patterns · Week 7

---

## What You're Doing

Yesterday you learned what MCP is. Today you build one.

You're going to create an MCP server from scratch, expose a single tool, connect it to Claude Desktop, and watch Claude use your tool in a real conversation. It's a small step technically — maybe 50 lines of code — but it's a profound moment. You're not just building a tool for your application. You're building a tool that any AI client in the ecosystem can use.

The TypeScript SDK makes this almost unreasonably easy. The hard part isn't the code — it's understanding the lifecycle (initialization, tool discovery, tool execution) and getting the Claude Desktop configuration right.

## The Work

### Step 1: Project Setup (15 min)

```bash
mkdir mcp-hello-world
cd mcp-hello-world
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node tsx
npx tsc --init
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### Step 2: The Minimal Server (20 min)

Create `src/index.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create the server
const server = new McpServer({
  name: 'hello-world',
  version: '1.0.0',
});

// Register a tool
server.tool(
  'greet',                              // Tool name
  'Generate a personalized greeting',   // Description (this is what Claude sees)
  {
    name: z.string().describe('The name of the person to greet'),
    style: z.enum(['formal', 'casual', 'pirate'])
      .optional()
      .default('casual')
      .describe('The style of greeting'),
  },
  async ({ name, style }) => {
    // This is the tool's implementation
    let greeting: string;

    switch (style) {
      case 'formal':
        greeting = `Good day, ${name}. It is a pleasure to make your acquaintance.`;
        break;
      case 'pirate':
        greeting = `Ahoy, ${name}! Welcome aboard, ye scallywag!`;
        break;
      case 'casual':
      default:
        greeting = `Hey ${name}! What's up?`;
        break;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: greeting,
        },
      ],
    };
  }
);

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running and waiting for JSON-RPC messages on stdin
  console.error('MCP Hello World server started'); // stderr, not stdout!
}

main().catch(console.error);
```

Critical detail: **log to stderr, not stdout.** Stdout is reserved for JSON-RPC messages. Anything you `console.log` to stdout will corrupt the protocol. Use `console.error` for debugging.

### Step 3: Test It Locally (10 min)

Before connecting to Claude Desktop, test the server manually:

```bash
# Build and run
npx tsx src/index.ts
```

The server will start and wait for input on stdin. It won't print anything to stdout (that's correct — it's waiting for JSON-RPC messages).

Press Ctrl+C to stop it.

### Step 4: Connect to Claude Desktop (30 min)

This is the exciting part. Claude Desktop can connect to local MCP servers via its configuration file.

Find your Claude Desktop config:
```bash
# macOS
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
# %APPDATA%\Claude\claude_desktop_config.json
```

Edit it to add your server:

```json
{
  "mcpServers": {
    "hello-world": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-hello-world/src/index.ts"]
    }
  }
}
```

Important notes:
- Use the **absolute path** to your server file
- The `command` is what Claude Desktop will execute
- `npx tsx` runs TypeScript directly without a build step
- Restart Claude Desktop after changing the config

### Step 5: Test with Claude Desktop (20 min)

Open Claude Desktop. You should see a tools icon indicating your MCP server is connected.

Try these prompts:
```
"Greet me! My name is Alex."
"Give me a formal greeting for Dr. Smith."
"Greet Captain Jack in pirate style."
```

Watch Claude:
1. Recognize that it has a `greet` tool available
2. Decide to use it based on your prompt
3. Call the tool with appropriate parameters
4. Include the greeting in its response

This is the magic moment. Your code is running inside Claude's toolbelt.

### Step 6: Add a Second Tool (15 min)

One tool is hello world. Two tools proves you understand the pattern. Add a time-related tool:

```typescript
server.tool(
  'current_time',
  'Get the current date and time in a specified timezone',
  {
    timezone: z.string()
      .optional()
      .default('UTC')
      .describe('IANA timezone (e.g., "Europe/Bucharest", "America/New_York")'),
    format: z.enum(['short', 'long', 'iso'])
      .optional()
      .default('long')
      .describe('Output format'),
  },
  async ({ timezone, format }) => {
    try {
      const now = new Date();
      let formatted: string;

      switch (format) {
        case 'short':
          formatted = now.toLocaleDateString('en-US', { timeZone: timezone });
          break;
        case 'iso':
          formatted = now.toISOString();
          break;
        case 'long':
        default:
          formatted = now.toLocaleString('en-US', {
            timeZone: timezone,
            dateStyle: 'full',
            timeStyle: 'long',
          });
      }

      return {
        content: [{ type: 'text' as const, text: `Current time (${timezone}): ${formatted}` }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error: Invalid timezone "${timezone}". Use IANA format like "Europe/Bucharest".`,
        }],
        isError: true,
      };
    }
  }
);
```

Restart Claude Desktop and test:
```
"What time is it in Bucharest?"
"Greet me and tell me the time in Tokyo."
```

Notice how Claude can now chain your tools — greeting you AND checking the time.

### Step 7: Understand the Lifecycle

Document the full lifecycle of a tool call:

```markdown
## MCP Tool Call Lifecycle

1. **Server starts** → Registers tools with name, description, schema
2. **Client connects** → Sends "tools/list" to discover available tools
3. **User sends message** → Claude sees tool descriptions in its context
4. **Claude decides** → Based on the user's request, picks a tool
5. **Client sends "tools/call"** → With tool name and arguments
6. **Server validates** → Zod schema validates the arguments
7. **Server executes** → Your function runs
8. **Server responds** → Returns content (text, images, etc.)
9. **Client receives** → Passes result back to Claude
10. **Claude responds** → Incorporates tool result into its answer
```

## Key Insight

The MCP server is surprisingly thin. It's just a function with a schema — the same pattern as the tools you built for your research agent. The difference is standardization. Your research agent's tools only work with your agent code. An MCP tool works with any client that speaks the protocol. The extra 20 lines of setup code buy you universal compatibility. That's an extraordinary return on investment.

## Resources

- [MCP Quickstart — Server](https://modelcontextprotocol.io/quickstart/server)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop MCP Configuration](https://modelcontextprotocol.io/quickstart/user)
- [Zod — TypeScript Schema Validation](https://zod.dev/)

## Done When

- [ ] You've created an MCP server with at least 2 tools
- [ ] The server uses StdioServerTransport
- [ ] You understand why logging must go to stderr, not stdout
- [ ] Claude Desktop config is updated with your server
- [ ] You've tested the tools through Claude Desktop
- [ ] Claude successfully calls your tools and uses the results
- [ ] You can explain the 10-step lifecycle of a tool call

---

*Tomorrow: You build a real MCP server — not hello world, but actual useful tools wrapping a real API. The toy becomes a product.*
