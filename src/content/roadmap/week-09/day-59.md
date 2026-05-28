---
title: "Day 59 -- Server Actions: RPC That Feels Like Magic"
week: 9
day: 59
phase: 3
phaseLabel: "Production"
order: 959
type: "day"
---
# Day 59 -- Server Actions: RPC That Feels Like Magic

> *"Eight years of writing Angular services, interceptors, and HttpClient calls. One 'use server' directive and it all disappears."*

**Date:** Miercuri, 16 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Server Actions + Forms in Next.js
**Phase:** Faza 3 -- Production · Week 9

---

## What You're Doing

Today you learn Server Actions, and they will genuinely change how you think about client-server communication. In Angular, when you want to submit a form, you write a service with HttpClient, inject it, call .post(), handle the Observable, manage loading states, deal with error handling, and update the UI. You have done this hundreds of times.

In Next.js, you write a function with `'use server'` at the top, pass it directly to a form's action attribute, and it just works. The function runs on the server. It has access to your database, your environment variables, your file system. The client never sees the implementation. There is no API route. There is no HTTP call you write. There is no service layer.

This is not sugar over a REST call. It is a compiler-level transformation. Next.js generates the API endpoint, the fetch call, the serialization, and the revalidation automatically. Your server function is called as if it were a local function, but it executes on the server.

## The Work

### The Angular Way vs The Server Action Way

**Angular (what you have been doing for 8 years):**

```typescript
// post.service.ts
@Injectable({ providedIn: 'root' })
export class PostService {
  constructor(private http: HttpClient) {}

  createPost(data: { title: string; content: string }) {
    return this.http.post<Post>('/api/posts', data);
  }
}

// create-post.component.ts
@Component({
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="title" name="title" />
      <textarea [(ngModel)]="content" name="content"></textarea>
      <button [disabled]="loading">
        {{ loading ? 'Creating...' : 'Create Post' }}
      </button>
      <p *ngIf="error" class="error">{{ error }}</p>
    </form>
  `
})
export class CreatePostComponent {
  title = '';
  content = '';
  loading = false;
  error = '';

  constructor(private postService: PostService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.postService.createPost({ title: this.title, content: this.content })
      .subscribe({
        next: () => this.router.navigate(['/posts']),
        error: (err) => {
          this.error = err.message;
          this.loading = false;
        }
      });
  }
}
```

**Next.js Server Actions (the new way):**

```tsx
// app/posts/actions.ts
'use server';

import { db } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // Validate
  if (!title || !content) {
    return { error: 'Title and content are required' };
  }

  // Direct database access -- no API route, no service
  await db.insert('posts', { title, content, createdAt: new Date() });

  // Revalidate the posts page cache
  revalidatePath('/posts');

  // Redirect (server-side)
  redirect('/posts');
}
```

```tsx
// app/posts/new/page.tsx
import { createPost } from '../actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" required />
      <textarea name="content" placeholder="Write your post..." required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

That is the entire implementation. No service. No HttpClient. No Observable. No loading state management. The `action={createPost}` attribute tells Next.js to call that server function when the form submits. The function runs on the server, touches the database, revalidates the cache, and redirects. All in one place.

### Adding Client-Side Loading States with useActionState

The basic form above works but has no loading indicator. For that, you make the page a Client Component and use `useActionState`:

```tsx
// app/posts/new/page.tsx
'use client';

import { useActionState } from 'react';
import { createPost } from '../actions';

export default function NewPostPage() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" placeholder="Post title" required />
      <textarea name="content" placeholder="Write your post..." required />

      {state?.error && (
        <p className="text-red-500">{state.error}</p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

The server action needs a small modification to work with `useActionState`:

```tsx
// app/posts/actions.ts
'use server';

import { db } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) {
    return { error: 'Title and content are required' };
  }

  try {
    await db.insert('posts', { title, content, createdAt: new Date() });
  } catch (e) {
    return { error: 'Failed to create post. Try again.' };
  }

  revalidatePath('/posts');
  redirect('/posts');
}
```

### Server Actions for AI: A Practical Example

Here is where it gets relevant. Imagine a server action that calls your LLM:

```tsx
// app/actions/ai.ts
'use server';

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic(); // Uses ANTHROPIC_API_KEY env var

export async function summarizeText(
  prevState: { summary?: string; error?: string } | null,
  formData: FormData
) {
  const text = formData.get('text') as string;

  if (!text || text.length < 50) {
    return { error: 'Please provide at least 50 characters of text.' };
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Summarize this text in 2-3 sentences:\n\n${text}`
      }]
    });

    const summary = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Could not generate summary';

    return { summary };
  } catch (e) {
    return { error: 'AI summarization failed. Please try again.' };
  }
}
```

```tsx
// app/summarize/page.tsx
'use client';

import { useActionState } from 'react';
import { summarizeText } from '../actions/ai';

export default function SummarizePage() {
  const [state, formAction, isPending] = useActionState(summarizeText, null);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI Text Summarizer</h1>

      <form action={formAction}>
        <textarea
          name="text"
          rows={8}
          className="w-full border rounded p-3 mb-4"
          placeholder="Paste text to summarize..."
        />

        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isPending ? 'Summarizing...' : 'Summarize'}
        </button>
      </form>

      {state?.error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
          {state.error}
        </div>
      )}

      {state?.summary && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">Summary:</h2>
          <p>{state.summary}</p>
        </div>
      )}
    </div>
  );
}
```

Look at what you did NOT write: no API route, no fetch call, no request/response serialization, no CORS configuration, no error middleware. The server action handles everything. The API key is safe on the server. The client only sees the form and the result.

### Server Actions Beyond Forms

Server Actions are not limited to forms. You can call them from event handlers too:

```tsx
'use client';

import { deletePost } from '../actions';

function DeleteButton({ postId }: { postId: string }) {
  const handleDelete = async () => {
    if (confirm('Delete this post?')) {
      await deletePost(postId);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

```tsx
// actions.ts
'use server';

export async function deletePost(postId: string) {
  await db.delete('posts', postId);
  revalidatePath('/posts');
}
```

## Key Insight

Server Actions are the bridge between your frontend and your AI backend. In the AI applications you are building, most user interactions follow this pattern: user provides input, server processes it (calling LLMs, searching vectors, executing tools), server returns result. Server Actions make this pattern trivially simple. No API layer to maintain. No separate backend service. The function IS the API. This is why Next.js has become the default framework for AI applications.

## Resources

- [Next.js Server Actions docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [useActionState React docs](https://react.dev/reference/react/useActionState)
- [Forms and Mutations in Next.js](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations)

## Done When

- [ ] You wrote a Server Action that handles form submission
- [ ] You used `revalidatePath` to refresh cached data after a mutation
- [ ] You implemented `useActionState` for loading/error states
- [ ] You can explain the difference between a Server Action and an API route
- [ ] You see how Server Actions simplify AI application architecture
- [ ] You are slightly angry about all the Angular services you wrote that could have been 5 lines

---

*Tomorrow: Building a real chat app with Next.js. Raw API calls to Anthropic. No AI SDK yet -- you earn the abstraction by building without it first.*
