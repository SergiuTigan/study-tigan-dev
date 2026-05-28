---
title: "Day 65 -- streamUI with Real Components"
week: 10
day: 65
phase: 3
phaseLabel: "Production"
order: 1065
type: "day"
---
# Day 65 -- streamUI with Real Components

> *"The difference between 'The weather is 28 degrees' and a weather card with a gradient background, animated icons, and a 5-day forecast -- that's the difference between a chatbot and an application."*

**Date:** Marti, 22 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Building Streaming UI Components
**Phase:** Faza 3 -- Production · Week 10

---

## What You're Doing

Yesterday you learned the concept. Today you build a real streaming component end-to-end. Not a toy example with mock data -- a weather card that hits a real API, streams a loading skeleton, and renders an interactive component with actual meteorological data.

The goal is precise: when the user types "What's the weather in Bucharest?", they should see a beautiful weather card appear, not a paragraph of text. The card streams in (loading skeleton first), then fills with real data. When it is done, they can interact with it -- hover for details, see forecast data, all within the chat interface.

This is the pattern you will repeat for every tool in your Generative UI application. Master it once, then apply it everywhere.

## The Work

### The Weather Card Component

```tsx
// src/components/ui/WeatherCard.tsx

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  forecast: { day: string; high: number; low: number; condition: string }[];
}

function getWeatherEmoji(condition: string): string {
  const map: Record<string, string> = {
    'Clear sky': '☀️',
    'Partly cloudy': '⛅',
    'Overcast': '☁️',
    'Rain': '🌧️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Fog': '🌫️',
  };
  return map[condition] || '🌤️';
}

function getGradient(temp: number): string {
  if (temp < 0) return 'from-blue-400 to-blue-600';
  if (temp < 10) return 'from-cyan-400 to-blue-500';
  if (temp < 20) return 'from-green-400 to-cyan-500';
  if (temp < 30) return 'from-yellow-400 to-orange-500';
  return 'from-orange-400 to-red-500';
}

export function WeatherCardLoading() {
  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg animate-pulse">
      <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 p-6">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2" />
        <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40" />
      </div>
      <div className="bg-white dark:bg-gray-900 p-4 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  );
}

export function WeatherCard({ data }: { data: WeatherData }) {
  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg">
      {/* Main weather display */}
      <div className={`bg-gradient-to-br ${getGradient(data.temperature)} p-6 text-white`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium opacity-90">
              {data.city}, {data.country}
            </h3>
            <div className="text-5xl font-bold mt-1">
              {Math.round(data.temperature)}°C
            </div>
            <p className="text-sm opacity-80 mt-1">
              Feels like {Math.round(data.feelsLike)}°C
            </p>
          </div>
          <div className="text-5xl">
            {getWeatherEmoji(data.condition)}
          </div>
        </div>
        <p className="mt-3 text-sm opacity-90">{data.condition}</p>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex justify-between text-sm">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Humidity</p>
            <p className="font-semibold dark:text-white">{data.humidity}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Wind</p>
            <p className="font-semibold dark:text-white">{data.windSpeed} km/h</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Condition</p>
            <p className="font-semibold dark:text-white">{data.condition}</p>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {data.forecast.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            3-Day Forecast
          </p>
          <div className="flex justify-between">
            {data.forecast.slice(0, 3).map((day, i) => (
              <div key={i} className="text-center text-sm">
                <p className="text-gray-500 dark:text-gray-400">{day.day}</p>
                <p className="my-1">{getWeatherEmoji(day.condition)}</p>
                <p className="dark:text-white">
                  <span className="font-semibold">{day.high}°</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-gray-500">{day.low}°</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### The Server Action with streamUI

```tsx
// src/app/actions.tsx
'use server';

import { streamUI } from 'ai/rsc';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { WeatherCard, WeatherCardLoading } from '@/components/ui/WeatherCard';

// Weather code to condition mapping for Open-Meteo
function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain';
  if (code <= 99) return 'Thunderstorm';
  return 'Overcast';
}

export async function sendMessage(userMessage: string) {
  const result = await streamUI({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a helpful assistant. When users ask about weather,
always use the getWeather tool. Respond naturally to other questions.`,
    messages: [{ role: 'user', content: userMessage }],

    // For plain text responses
    text: ({ content }) => (
      <div className="prose dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    ),

    tools: {
      getWeather: {
        description: 'Get current weather and forecast for a city',
        parameters: z.object({
          city: z.string().describe('The city name'),
        }),
        generate: async function* ({ city }) {
          // Immediately show loading state
          yield <WeatherCardLoading />;

          try {
            // Geocode the city
            const geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
            );
            const geoData = await geoRes.json();

            if (!geoData.results?.length) {
              return (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-400">
                    Could not find city: {city}
                  </p>
                </div>
              );
            }

            const { latitude, longitude, name, country } = geoData.results[0];

            // Fetch weather
            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`
            );
            const weather = await weatherRes.json();
            const current = weather.current;
            const daily = weather.daily;

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            const weatherData = {
              city: name,
              country,
              temperature: current.temperature_2m,
              feelsLike: current.apparent_temperature,
              humidity: current.relative_humidity_2m,
              windSpeed: current.wind_speed_10m,
              condition: weatherCodeToCondition(current.weather_code),
              icon: '',
              forecast: daily.time.slice(1, 4).map((date: string, i: number) => ({
                day: days[new Date(date).getDay()],
                high: Math.round(daily.temperature_2m_max[i + 1]),
                low: Math.round(daily.temperature_2m_min[i + 1]),
                condition: weatherCodeToCondition(daily.weather_code[i + 1]),
              })),
            };

            return <WeatherCard data={weatherData} />;
          } catch (error) {
            return (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-400">
                  Failed to fetch weather data. Please try again.
                </p>
              </div>
            );
          }
        },
      },
    },
  });

  return result.value;
}
```

### The Client Page

```tsx
// src/app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessage } from './actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMsg,
    }]);
    setIsLoading(true);

    try {
      const response = await sendMessage(userMsg);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Weather Assistant</h1>
        <p className="text-sm text-gray-500">
          Ask about the weather in any city
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 max-w-[80%]">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[90%]">{msg.content}</div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the weather..."
          className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

### Testing the Flow

Run the app and type: "What's the weather in Bucharest?"

What should happen:
1. Your message appears on the right
2. The loading skeleton (WeatherCardLoading) appears immediately
3. The skeleton shows shimmer/pulse animation while the API calls happen
4. After 1-2 seconds, the skeleton is replaced by the full WeatherCard
5. The card shows real temperature, humidity, wind, and 3-day forecast
6. The card is styled with a temperature-based gradient

If the AI responds with text instead of calling the tool, adjust the system prompt. Be more explicit: "Always use the getWeather tool for any weather-related question. Never describe weather in text."

## Key Insight

The `yield` and `return` pattern in the generate function is the key to great UX. Without `yield`, the user stares at nothing while the API calls happen. With `yield`, they see a loading skeleton instantly, which sets expectations and prevents perceived latency. This is the same principle behind skeleton screens in Angular applications, but here it happens automatically as part of the AI's response stream. The loading state is not an afterthought -- it is a first-class part of the AI's output.

## Resources

- [AI SDK - streamUI Reference](https://sdk.vercel.ai/docs/reference/ai-sdk-rsc/stream-ui)
- [Open-Meteo API](https://open-meteo.com/en/docs) -- free weather API, no key needed
- [Tailwind CSS Gradients](https://tailwindcss.com/docs/gradient-color-stops)
- [Skeleton Loading Pattern](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)

## Done When

- [ ] "What's the weather in Bucharest?" renders a WeatherCard, NOT text
- [ ] The loading skeleton appears before the data loads
- [ ] The card shows real weather data from Open-Meteo
- [ ] The temperature-based gradient works (different colors for different temps)
- [ ] 3-day forecast shows at the bottom of the card
- [ ] Error handling works (try a nonsense city name)
- [ ] Non-weather questions still get text responses

---

*Tomorrow: Multiple tools, multiple components. The AI dynamically chooses which component to show based on what you ask.*
