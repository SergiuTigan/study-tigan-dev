---
title: "Day 66 -- Tool-Driven Dynamic Components"
week: 10
day: 66
phase: 3
phaseLabel: "Production"
order: 1066
type: "day"
---
# Day 66 -- Tool-Driven Dynamic Components

> *"The AI does not just answer. It decides what interface to build. 'Compare X vs Y' gets a table. 'Show revenue' gets a chart. 'Book a flight' gets a form. Same chat, different UIs."*

**Date:** Miercuri, 23 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Multiple Tools Rendering Different UI Components
**Phase:** Faza 3 -- Production · Week 10

---

## What You're Doing

Yesterday you had one tool that rendered one component. Today you build a system where three or four tools each render completely different UI components, and the AI dynamically chooses which one to use based on what the user says. This is the "generative" part of Generative UI -- the AI generates different interfaces for different needs.

"Compare React and Angular" renders a comparison table. "Show me the revenue data" renders a chart. "Help me plan a workout" renders an interactive form. The user does not choose which interface they get. The AI infers the right tool from the conversation context and renders the appropriate component.

## The Work

### Component Library

Build four distinct UI components, each designed for a different tool output:

```tsx
// src/components/ui/ComparisonTable.tsx

interface ComparisonItem {
  feature: string;
  optionA: string;
  optionB: string;
  winner?: 'A' | 'B' | 'tie';
}

export function ComparisonTableLoading() {
  return (
    <div className="w-full rounded-xl border overflow-hidden animate-pulse">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 flex gap-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="p-4 border-t flex gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

export function ComparisonTable({
  title,
  optionAName,
  optionBName,
  items,
  summary,
}: {
  title: string;
  optionAName: string;
  optionBName: string;
  items: ComparisonItem[];
  summary: string;
}) {
  return (
    <div className="w-full rounded-xl border dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
        <h3 className="font-semibold dark:text-white">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
              Feature
            </th>
            <th className="px-4 py-2 text-left font-medium text-blue-600 dark:text-blue-400">
              {optionAName}
            </th>
            <th className="px-4 py-2 text-left font-medium text-purple-600 dark:text-purple-400">
              {optionBName}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-2 font-medium dark:text-gray-200">
                {item.feature}
              </td>
              <td className={`px-4 py-2 ${item.winner === 'A' ? 'text-green-600 dark:text-green-400 font-semibold' : 'dark:text-gray-300'}`}>
                {item.optionA}
              </td>
              <td className={`px-4 py-2 ${item.winner === 'B' ? 'text-green-600 dark:text-green-400 font-semibold' : 'dark:text-gray-300'}`}>
                {item.optionB}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {summary}
      </div>
    </div>
  );
}
```

```tsx
// src/components/ui/BarChart.tsx

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export function BarChartLoading() {
  return (
    <div className="w-full rounded-xl border p-6 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
      <div className="flex items-end gap-3 h-48">
        {[60, 80, 45, 90, 70, 55].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  title,
  data,
  unit,
}: {
  title: string;
  data: ChartData[];
  unit?: string;
}) {
  const maxValue = Math.max(...data.map(d => d.value));
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-amber-500', 'bg-red-500', 'bg-cyan-500',
    'bg-pink-500', 'bg-indigo-500',
  ];

  return (
    <div className="w-full rounded-xl border dark:border-gray-700 p-6 shadow-sm">
      <h3 className="font-semibold mb-6 dark:text-white">{title}</h3>
      <div className="flex items-end gap-3 h-48">
        {data.map((item, i) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium dark:text-gray-300">
                {item.value}{unit || ''}
              </span>
              <div
                className={`w-full ${colors[i % colors.length]} rounded-t transition-all duration-500 hover:opacity-80`}
                style={{ height: `${heightPercent}%` }}
                title={`${item.label}: ${item.value}${unit || ''}`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

```tsx
// src/components/ui/FormCard.tsx

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export function FormCardLoading() {
  return (
    <div className="w-full max-w-md rounded-xl border p-6 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
      <div className="space-y-3">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
    </div>
  );
}

export function FormCard({
  title,
  description,
  fields,
  submitLabel,
}: {
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel: string;
}) {
  return (
    <div className="w-full max-w-md rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4">
        <h3 className="font-semibold dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <form className="p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'select' ? (
              <select className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white">
                <option value="">{field.placeholder || 'Select...'}</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                placeholder={field.placeholder}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white"
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
```

### Wire All Tools Into streamUI

```tsx
// src/app/actions.tsx
'use server';

import { streamUI } from 'ai/rsc';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { WeatherCard, WeatherCardLoading } from '@/components/ui/WeatherCard';
import { ComparisonTable, ComparisonTableLoading } from '@/components/ui/ComparisonTable';
import { BarChart, BarChartLoading } from '@/components/ui/BarChart';
import { FormCard, FormCardLoading } from '@/components/ui/FormCard';

export async function sendMessage(userMessage: string) {
  const result = await streamUI({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a versatile assistant with UI tools. Choose the right tool:
- compare: When users want to compare two things (technologies, products, options)
- showChart: When users want to visualize data, stats, or rankings
- createForm: When users want to fill out or configure something
- getWeather: When users ask about weather
Always prefer tools over text when the user's request matches a tool's purpose.`,
    messages: [{ role: 'user', content: userMessage }],

    text: ({ content }) => (
      <div className="prose dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    ),

    tools: {
      compare: {
        description: 'Compare two options side by side with a detailed comparison table',
        parameters: z.object({
          title: z.string(),
          optionA: z.string(),
          optionB: z.string(),
          features: z.array(z.object({
            feature: z.string(),
            valueA: z.string(),
            valueB: z.string(),
            winner: z.enum(['A', 'B', 'tie']),
          })),
          summary: z.string(),
        }),
        generate: async function* ({ title, optionA, optionB, features, summary }) {
          yield <ComparisonTableLoading />;
          // Simulate processing time
          await new Promise(r => setTimeout(r, 500));
          return (
            <ComparisonTable
              title={title}
              optionAName={optionA}
              optionBName={optionB}
              items={features.map(f => ({
                feature: f.feature,
                optionA: f.valueA,
                optionB: f.valueB,
                winner: f.winner,
              }))}
              summary={summary}
            />
          );
        },
      },

      showChart: {
        description: 'Display data as a bar chart for visualizing rankings, stats, or comparisons',
        parameters: z.object({
          title: z.string(),
          data: z.array(z.object({
            label: z.string(),
            value: z.number(),
          })),
          unit: z.string().optional(),
        }),
        generate: async function* ({ title, data, unit }) {
          yield <BarChartLoading />;
          await new Promise(r => setTimeout(r, 300));
          return <BarChart title={title} data={data} unit={unit} />;
        },
      },

      createForm: {
        description: 'Generate an interactive form for user input, bookings, or configurations',
        parameters: z.object({
          title: z.string(),
          description: z.string().optional(),
          fields: z.array(z.object({
            name: z.string(),
            label: z.string(),
            type: z.enum(['text', 'number', 'select', 'date']),
            placeholder: z.string().optional(),
            options: z.array(z.string()).optional(),
            required: z.boolean().optional(),
          })),
          submitLabel: z.string(),
        }),
        generate: async function* ({ title, description, fields, submitLabel }) {
          yield <FormCardLoading />;
          await new Promise(r => setTimeout(r, 400));
          return (
            <FormCard
              title={title}
              description={description}
              fields={fields}
              submitLabel={submitLabel}
            />
          );
        },
      },

      // Include the weather tool from yesterday...
    },
  });

  return result.value;
}
```

### Test the Dynamic Routing

Try these prompts and watch the AI choose different components:

- **"Compare React and Angular for enterprise apps"** -- should render ComparisonTable
- **"Show me the top 5 programming languages by popularity"** -- should render BarChart
- **"I want to book a hotel room"** -- should render FormCard
- **"What's the weather in Tokyo?"** -- should render WeatherCard
- **"Tell me about machine learning"** -- should render plain text (no tool needed)

The AI reads the user's intent and picks the right tool. No explicit routing. No if-else chains. The model's understanding of the tool descriptions handles the dispatch.

## Key Insight

You have built a system where the AI is essentially a UI router. Traditional apps have fixed pages with fixed components. Your app has a conversation that dynamically renders components based on need. The user does not navigate to a "comparison page" or a "chart page." They describe what they want, and the AI assembles the right interface. This is the core promise of Generative UI: conversational interfaces that are as rich as traditional UIs, but assembled on-demand by AI.

## Resources

- [AI SDK - streamUI with multiple tools](https://sdk.vercel.ai/docs/ai-sdk-rsc/generative-ui)
- [Tailwind CSS Tables](https://tailwindcss.com/docs/table-layout)
- [CSS Bar Charts](https://web.dev/building-a-bar-chart-component/) -- inspiration for pure CSS charts

## Done When

- [ ] You have 3+ tools, each rendering a different component type
- [ ] The AI correctly chooses which tool to use based on the user's message
- [ ] "Compare X vs Y" renders a table, "Show data" renders a chart, "Book/Create" renders a form
- [ ] Each tool has a loading skeleton that appears before the final component
- [ ] You can have a mixed conversation: some messages get text, some get components
- [ ] The system feels like magic -- describe what you want, get the right interface

---

*Tomorrow: Start building your full Generative UI portfolio app. Pick a theme, build the structure, get the core working.*
