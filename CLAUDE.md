# Composed Claude Code Configuration

This configuration combines: Next.js 15, shadcn/ui, Memory MCP Server

---

## Project Context

*Combined from: Next.js 15, shadcn/ui, Memory MCP Server*

This is a comprehensive project that combines multiple technologies:

This is a Next.js 15 application using:

- **App Router** (not Pages Router)
- **React 19** with Server Components by default
- **TypeScript** for type safety
- **Tailwind CSS** for styling (if configured)
- **Server Actions** for mutations
- **Turbopack** for faster builds (optional)

This is a shadcn/ui project focused on:

- **Component-first development** with copy-paste architecture
- **Radix UI primitives** for behavior and accessibility
- **Tailwind CSS** for utility-first styling
- **TypeScript** for type-safe component APIs
- **React 18/19** with modern patterns (Server Components when applicable)
- **Accessibility-first** design with full keyboard and screen reader support

This is a Memory MCP Server project focused on:

- **Persistent memory storage** with PostgreSQL and pgvector
- **Semantic search** using OpenAI embeddings
- **Multi-tenant architecture** for AI companions
- **Production deployment** with monitoring and scaling
- **MCP protocol compliance** using @modelcontextprotocol/sdk

## Security Best Practices

*Combined from: Next.js 15, shadcn/ui, Memory MCP Server*

1. **Always validate Server Actions input** with Zod or similar
2. **Authenticate and authorize** in Server Actions and middleware
3. **Sanitize user input** before rendering
4. **Use environment variables correctly**:
   - `NEXT_PUBLIC_*` for client-side
   - Others stay server-side only
5. **Implement rate limiting** for public actions
6. **Configure CSP headers** in next.config.js
7. **Sanitize user input** in dynamic content
8. **Validate form data** with Zod schemas
9. **Use TypeScript** for type safety
10. **Escape HTML** in user-generated content
11. **Implement CSP** headers when applicable

## Performance Optimization

*Combined from: Next.js 15, shadcn/ui, Memory MCP Server*

1. **Use Server Components** to reduce bundle size
2. **Implement streaming** with Suspense boundaries
3. **Optimize images** with next/image component
4. **Use dynamic imports** for code splitting
5. **Configure proper caching** strategies
6. **Enable Partial Prerendering** (experimental) when stable
7. **Monitor Core Web Vitals**

## Common Commands

*Combined from: Next.js 15, shadcn/ui, Memory MCP Server*

```bash

## ⚠️ Breaking Changes from Next.js 14

1. **Async Request APIs**: `params`, `searchParams`, `cookies()`, and `headers()` are now async

   ```typescript
   // ❌ OLD (Next.js 14)
   export default function Page({ params, searchParams }) {
     const id = params.id;
   }
   
   // ✅ NEW (Next.js 15)
   export default async function Page({ params, searchParams }) {
     const { id } = await params;
     const { query } = await searchParams;
   }
   
   // Server Actions and API Routes
   import { cookies, headers } from 'next/headers';
   
   export async function GET() {
     const cookieStore = await cookies();
     const headersList = await headers();
     
     const token = cookieStore.get('auth');
     const userAgent = headersList.get('user-agent');
   }
   ```

2. **React 19 Required**: Minimum React version is 19.0.0
   - Update package.json: `"react": "19.0.0"`
   - Update React types: `"@types/react": "^19.0.0"`

3. **`useFormState` → `useActionState`**: Import from 'react' not 'react-dom'
   ```typescript
   // ❌ OLD
   import { useFormState } from 'react-dom';
   
   // ✅ NEW  
   import { useActionState } from 'react';
   ```

4. **Fetch Caching**: Fetch requests are no longer cached by default
   ```typescript
   // ❌ OLD (cached by default)
   const data = await fetch('/api/data');
   
   // ✅ NEW (explicit caching required)
   const data = await fetch('/api/data', {
     next: { revalidate: 3600 } // Cache for 1 hour
   });
   ```

5. **TypeScript 5+**: Minimum TypeScript version is 5.0
   - Update tsconfig.json for stricter checking
   - Use new TypeScript features like const type parameters

## 2. File Conventions

Always use these file names in the `app/` directory:

- `page.tsx` - Route page component
- `layout.tsx` - Shared layout wrapper
- `loading.tsx` - Loading UI (Suspense fallback)
- `error.tsx` - Error boundary (must be Client Component)
- `not-found.tsx` - 404 page
- `route.ts` - API route handler
- `template.tsx` - Re-rendered layout
- `default.tsx` - Parallel route fallback

## 3. Data Fetching Patterns

```typescript
// ✅ GOOD: Fetch in Server Component
async function ProductList() {
  const products = await db.products.findMany();
  return <div>{/* render products */}</div>;
}

// ❌ AVOID: Client-side fetching when not needed
'use client';
function BadPattern() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data')... }, []);
}
```

## 3. Installation Patterns

```bash

## 3. Animation Performance

```tsx
// Use CSS transforms for animations
className="transition-transform hover:scale-105"

// Avoid layout shifts
className="transform-gpu"
```

## 1. Component Testing

*Combined from: Next.js 15, shadcn/ui, Memory MCP Server*

- **Unit tests**: Jest/Vitest for logic and utilities
- **Component tests**: React Testing Library
- **E2E tests**: Playwright or Cypress
- **Server Components**: Test data fetching logic separately
- **Server Actions**: Mock and test validation/business logic
npm run test
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
test('button click', async () => {
  const user = userEvent.setup()
  const handleClick = jest.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  await user.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```
import { axe } from 'jest-axe'
test('no accessibility violations', async () => {
  const { container } = render(<Card>Content</Card>)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```
npm run mcp:test      # Test MCP server
npm run mcp:debug     # Debug MCP protocol
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Build succeeds locally
- [ ] Tests pass
- [ ] Security headers configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] SEO metadata in place
- [ ] Performance monitoring active

## Debugging Tips

1. **Check Radix UI data attributes** for component state
2. **Use React DevTools** to inspect component props
3. **Verify Tailwind classes** are being applied
4. **Check CSS variable values** in browser DevTools
5. **Test keyboard navigation** manually
6. **Validate ARIA attributes** with accessibility tools

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [CVA Documentation](https://cva.style)
- [React Hook Form](https://react-hook-form.com)
- [TanStack Table](https://tanstack.com/table)
- [Recharts](https://recharts.org)

Remember: **Beautiful, Accessible, Customizable, and Yours!**

# shadcn/ui Development Assistant

*Combined from: Next.js 15, shadcn/ui, Memory MCP Server*

You are an expert Next.js 15 developer with deep knowledge of the App Router, React Server Components, and modern web development best practices.
You are an expert shadcn/ui developer with deep knowledge of React component architecture, Tailwind CSS, Radix UI primitives, and modern web accessibility standards. You specialize in building beautiful, accessible, and performant UI components following shadcn/ui patterns and conventions.
You are an expert in building production MCP (Model Context Protocol) servers with memory persistence, vector search capabilities, and AI companion systems. You have deep expertise in PostgreSQL, pgvector, Drizzle ORM, and the MCP SDK.

## 1. Server Components First

- **Default to Server Components** - Only use Client Components when you need interactivity
- **Data fetching on the server** - Direct database access, no API routes needed for SSR
- **Zero client-side JavaScript** for static content
- **Async components** are supported and encouraged

## 4. Caching Strategy

- Use `fetch()` with Next.js extensions for HTTP caching
- Configure with `{ next: { revalidate: 3600, tags: ['products'] } }`
- Use `revalidatePath()` and `revalidateTag()` for on-demand updates
- Consider `unstable_cache()` for expensive computations

## Development

*Combined from: Next.js 15, shadcn/ui, Memory MCP Server*

```bash
npm run dev          # Start dev server with hot reload
npm run dev:turbo    # Start with Turbopack (faster)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```
npm run dev           # Start development server
npm run build         # Build for production
npm run test          # Run tests
npm run lint          # Lint code

## Code Generation

```bash
npx create-next-app@latest  # Create new app
npx @next/codemod@latest    # Run codemods for upgrades
```

## Project Structure

```text
app/
├── (auth)/          # Route group (doesn't affect URL)
├── api/             # API routes
│   └── route.ts     # Handler for /api
├── products/
│   ├── [id]/        # Dynamic route
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── page.tsx
├── layout.tsx       # Root layout
├── page.tsx         # Home page
└── globals.css      # Global styles
```

## Server Action with Form

```typescript
// actions.ts
'use server';
export async function createItem(prevState: any, formData: FormData) {
  // Validate, mutate, revalidate
  const validated = schema.parse(Object.fromEntries(formData));
  await db.items.create({ data: validated });
  revalidatePath('/items');
}

// form.tsx
'use client';
import { useActionState } from 'react';
export function Form() {
  const [state, formAction] = useActionState(createItem, {});
  return <form action={formAction}>...</form>;
}
```

## Optimistic Updates

```typescript
'use client';
import { useOptimistic } from 'react';
export function OptimisticList({ items, addItem }) {
  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state, newItem) => [...state, newItem]
  );
  // Use optimisticItems for immediate UI update
}
```

## Memory Integration

This CLAUDE.md follows official Claude Code patterns for MCP server development:

- **MCP protocol compliance** - Follows @modelcontextprotocol/sdk standards
- **Project memory** - Instructions shared with development team
- **Tool integration** - Works with Claude Code's MCP commands
- **Automated discovery** - Available when MCP server is configured

## Available Commands

Project-specific slash commands for shadcn/ui development:

- `/shadcn-add [component]` - Add shadcn/ui component to project
- `/shadcn-theme [variant]` - Update theme configuration
- `/shadcn-custom [name]` - Create custom component following patterns
- `/shadcn-compose [components]` - Compose complex component from primitives
- `/shadcn-test [component]` - Generate accessibility and unit tests

## Core Technologies

- **React 18/19** - Component framework
- **TypeScript** - Type-safe development
- **Tailwind CSS v3.4+** - Utility-first styling
- **Radix UI** - Unstyled, accessible primitives
- **Class Variance Authority (CVA)** - Component variants
- **tailwind-merge** - Intelligent class merging
- **clsx** - Conditional classes
- **Lucide React** - Icon system

## Framework Support

- **Next.js 13-15** (App Router preferred)
- **Vite** with React
- **Remix** with React Router
- **Astro** with React integration
- **Laravel** with Inertia.js
- **TanStack Router/Start**
- **React Router**

## 1. Copy-Paste Architecture

- **No npm package** - Components are copied into your project
- **Full ownership** - The code is yours to modify
- **Direct customization** - Edit components directly
- **No abstraction layers** - See exactly what's happening

## 2. Component Anatomy

Every component follows this structure:

```tsx
// Root component with forwardRef
const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn(componentVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"

// Sub-components for composition
const ComponentTrigger = React.forwardRef<...>()
const ComponentContent = React.forwardRef<...>()
const ComponentItem = React.forwardRef<...>()

// Export all parts
export { Component, ComponentTrigger, ComponentContent, ComponentItem }
```

# CLI installation (recommended)

npx shadcn@latest init
npx shadcn@latest add [component]

# 3. Update imports

```

## 4. File Structure

```text
components/
└── ui/
    ├── accordion.tsx
    ├── alert-dialog.tsx
    ├── alert.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── form.tsx
    ├── input.tsx
    ├── label.tsx
    ├── select.tsx
    └── ...
lib/
└── utils.ts        # cn() helper function
```

## 1. Variant System with CVA

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## 2. Polymorphic Components with asChild

```tsx
import { Slot } from "@radix-ui/react-slot"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp ref={ref} className={cn(...)} {...props} />
  }
)
```

## 3. Controlled/Uncontrolled Pattern

```tsx
// Controlled
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>...</SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>

// Uncontrolled
<Select defaultValue="apple">
  <SelectTrigger>...</SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```

## 4. Form Integration with React Hook Form

```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="email@example.com" {...field} />
        </FormControl>
        <FormDescription>
          Enter your email address
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

## CSS Variables Structure

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark theme variables ... */
  }
}
```

## Color Convention

- Each color has a **base** and **foreground** variant
- Base: Background color
- Foreground: Text color on that background
- Ensures proper contrast automatically

## 1. ARIA Attributes

```tsx
// Proper ARIA labeling
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>
        Description for screen readers
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## 2. Keyboard Navigation

All components support:
- **Tab/Shift+Tab** - Focus navigation
- **Enter/Space** - Activation
- **Escape** - Close/cancel
- **Arrow keys** - List navigation
- **Home/End** - Boundary navigation

## 3. Focus Management

```tsx
// Visible focus indicators
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Focus trap in modals
<FocusTrap>
  <DialogContent>...</DialogContent>
</FocusTrap>
```

## 1. Tables with TanStack Table

```tsx
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})

<Table>
  <TableHeader>
    {table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ))}
  </TableHeader>
  <TableBody>
    {table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## 2. Charts with Recharts

```tsx
<ChartContainer config={chartConfig}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <ChartTooltip />
    <Area
      type="monotone"
      dataKey="value"
      stroke="hsl(var(--chart-1))"
      fill="hsl(var(--chart-1))"
    />
  </AreaChart>
</ChartContainer>
```

# Initialize shadcn/ui

npx shadcn@latest init

# Add components

npx shadcn@latest add button card dialog form

# Add all components

npx shadcn@latest add --all

# Update components

npx shadcn@latest add button --overwrite

# Build custom registry

npx shadcn@latest build
```

## Component Development

```bash

# Development server

npm run dev

# Type checking

npm run type-check

# Linting

npm run lint

# Build

npm run build
```

## 1. Bundle Size

- Only import what you use
- Components are tree-shakeable
- No runtime overhead from library

## 2. Code Splitting

```tsx
// Lazy load heavy components
const HeavyChart = lazy(() => import('@/components/ui/chart'))

<Suspense fallback={<Skeleton />}>
  <HeavyChart />
</Suspense>
```

## Form Controls

- Input, Textarea, Select, Checkbox, RadioGroup, Switch
- Slider, DatePicker, Form, Label

## Overlays

- Dialog, AlertDialog, Sheet, Popover
- DropdownMenu, ContextMenu, Tooltip, HoverCard

## Navigation

- NavigationMenu, Tabs, Breadcrumb
- Pagination, Sidebar

## Data Display

- Table, DataTable, Card, Badge
- Avatar, Chart, Progress

## Layout

- Accordion, Collapsible, ResizablePanels
- ScrollArea, Separator, AspectRatio

## Feedback

- Alert, Toast (Sonner), Skeleton
- Progress, Loading states

## MCP Configuration

To use this server with Claude Code:

```bash

# Add local MCP server

claude mcp add memory-server -- npx memory-mcp-server

# Add with environment variables

claude mcp add memory-server --env DATABASE_URL=your_db_url --env OPENAI_API_KEY=your_key -- npx memory-mcp-server

# Check server status

claude mcp list
```

## Available MCP Tools

When connected, provides these tools to Claude Code:

- `memory.create` - Store new memory with vector embedding
- `memory.search` - Semantic search through stored memories  
- `memory.update` - Update existing memory content
- `memory.delete` - Remove memories by ID
- `memory.list` - List memories for user/companion
- `memory.consolidate` - Merge similar memories

## Database & ORM

- **Drizzle ORM v0.44.4** - Type-safe database access
- **pgvector v0.8.0** - Vector similarity search
- **@neondatabase/serverless** - Serverless PostgreSQL client

## Vector Search

- **OpenAI Embeddings** - text-embedding-3-small model
- **HNSW Indexes** - High-performance similarity search
- **Hybrid Search** - Combining vector and keyword search

## Memory System Design

```typescript
// Memory schema with vector embeddings
export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  companionId: text('companion_id').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata'),
  importance: real('importance').default(0.5),
  lastAccessed: timestamp('last_accessed'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  embeddingIdx: index().using('hnsw', t.embedding.op('vector_cosine_ops')),
  userCompanionIdx: index().on(t.userId, t.companionId),
}));
```

## MCP Server Implementation

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'memory-server',
  version: '1.0.0',
}, {
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Implementation
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## 1. Vector Search Optimization

```typescript
// Efficient similarity search with pgvector
const similar = await db
  .select()
  .from(memories)
  .where(
    and(
      eq(memories.userId, userId),
      sql`${memories.embedding} <=> ${embedding} < 0.5`
    )
  )
  .orderBy(sql`${memories.embedding} <=> ${embedding}`)
  .limit(10);
```

## 2. Memory Lifecycle Management

- **Consolidation**: Merge similar memories periodically
- **Decay**: Reduce importance over time without access
- **Archival**: Move old memories to cold storage
- **Deduplication**: Prevent duplicate memory storage

## 3. Multi-tenant Isolation

```typescript
// Row-level security for tenant isolation
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON memories
  FOR ALL
  USING (user_id = current_setting('app.user_id')::text);
```

## 4. Error Handling

```typescript
// Comprehensive error handling
try {
  const result = await operation();
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  if (error instanceof ZodError) {
    return { error: { code: 'INVALID_PARAMS', message: error.message } };
  }
  logger.error('Operation failed', { error, context });
  return { error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } };
}
```

## Database Indexing

```sql
-- HNSW index for vector search
CREATE INDEX memories_embedding_idx ON memories 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- B-tree indexes for filtering
CREATE INDEX memories_user_companion_idx ON memories(user_id, companion_id);
CREATE INDEX memories_created_at_idx ON memories(created_at DESC);
```

## Connection Pooling

```typescript
// Neon serverless with connection pooling
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, {
  poolQueryViaFetch: true,
  fetchConnectionCache: true,
});
```

## Caching Strategy

- **Embedding Cache**: Cache frequently used embeddings
- **Query Cache**: Cache common search results
- **Connection Cache**: Reuse database connections

## Input Validation

```typescript
// Zod schemas for all inputs
const CreateMemorySchema = z.object({
  content: z.string().min(1).max(10000),
  metadata: z.record(z.unknown()).optional(),
  importance: z.number().min(0).max(1).optional(),
});

// Validate before processing
const validated = CreateMemorySchema.parse(input);
```

## Authentication & Authorization

```typescript
// JWT-based authentication
const token = request.headers.authorization?.split(' ')[1];
const payload = jwt.verify(token, process.env.JWT_SECRET);

// Role-based access control
if (!payload.roles.includes('memory:write')) {
  throw new ForbiddenError('Insufficient permissions');
}
```

## Data Encryption

- Encrypt sensitive memory content at rest
- Use TLS for all connections
- Implement field-level encryption for PII

## Unit Tests

```typescript
// Test memory operations
describe('MemoryService', () => {
  it('should create memory with embedding', async () => {
    const memory = await service.create({
      content: 'Test memory',
      userId: 'test-user',
    });
    expect(memory.embedding).toBeDefined();
    expect(memory.embedding.length).toBe(1536);
  });
});
```

## Integration Tests

```typescript
// Test MCP server
describe('MCP Server', () => {
  it('should handle memory.create tool', async () => {
    const response = await server.handleRequest({
      method: 'tools/call',
      params: {
        name: 'memory.create',
        arguments: { content: 'Test' },
      },
    });
    expect(response.content[0].type).toBe('text');
  });
});
```

## Docker Setup

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
OPENAI_API_KEY=sk-...
MCP_SERVER_PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## Structured Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});
```

## Metrics Collection

```typescript
// Prometheus metrics
import { register, Counter, Histogram } from 'prom-client';

const memoryCreated = new Counter({
  name: 'memory_created_total',
  help: 'Total number of memories created',
});

const searchDuration = new Histogram({
  name: 'memory_search_duration_seconds',
  help: 'Duration of memory search operations',
});
```

# Database

npm run db:migrate    # Run migrations
npm run db:push       # Push schema changes
npm run db:studio     # Open Drizzle Studio


---

## Configuration Metadata

### Included Configurations

- **Next.js 15** v15.0.0: Next.js 15 with App Router, React 19, and Server Components
- **shadcn/ui** v0.8.0: Beautiful, accessible components with Radix UI and Tailwind CSS
- **Memory MCP Server** v1.0.0: MCP server with memory persistence and vector search capabilities

### Dependencies

#### Required Engines

- **node**: >=18.17.0, >=18.0.0

#### Peer Dependencies

These packages should be installed in your project:

- **next**: >=15.0.0
- **react**: >=19.0.0 or >=18.0.0
- **react-dom**: >=19.0.0 or >=18.0.0
- **typescript**: >=5.0.0
- **tailwindcss**: >=3.4.0
- **@modelcontextprotocol/sdk**: >=1.0.0
- **drizzle-orm**: >=0.40.0


### Generation Details

- Generated: 2026-03-23T14:42:31.193Z
- Generator: Claude Config Composer v1.0.0

### Compatibility Notes

This is a composed configuration. Some features may require additional setup or conflict resolution.
Review the combined configuration carefully and adjust as needed for your specific project.