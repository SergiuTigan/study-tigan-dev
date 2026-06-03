/**
 * Converts Angular course data (TypeScript template literals) into
 * Astro-compatible markdown files with frontmatter.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const courses = [
  {
    file: '/tmp/angular-21-modules.ts',
    courseId: 'angular-21',
    courseTitle: 'Angular 21 Engineer',
    courseDescription: 'Master modern Angular development with signals, zoneless change detection, standalone components, and the latest APIs.',
    color: 'red',
  },
  {
    file: '/tmp/typescript-6-modules.ts',
    courseId: 'typescript-6',
    courseTitle: 'TypeScript 6',
    courseDescription: 'Deep dive into TypeScript 6 with strict defaults, new type system features, Temporal API, and the path to the native Go compiler.',
    color: 'blue',
  },
  {
    file: '/tmp/ai-engineer-modules.ts',
    courseId: 'ai-engineer',
    courseTitle: 'AI Engineer',
    courseDescription: 'From prompt engineering to production RAG systems, agents, and fine-tuning. Everything you need to build with LLMs.',
    color: 'purple',
  },
];

function parseModules(content) {
  const modules = [];
  // Match module objects: { id: '...', title: '...', description: '...', lessons: [ ... ] }
  const moduleRegex = /\{\s*id:\s*'([^']+)',\s*title:\s*'([^']*(?:\\.[^']*)*)',\s*description:\s*'([^']*(?:\\.[^']*)*)',\s*lessons:\s*\[/g;
  let moduleMatch;

  while ((moduleMatch = moduleRegex.exec(content)) !== null) {
    const mod = {
      id: moduleMatch[1],
      title: moduleMatch[2],
      description: moduleMatch[3],
      lessons: [],
    };

    // Find lessons within this module
    const afterModule = content.slice(moduleMatch.index + moduleMatch[0].length);
    const lessonRegex = /\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*duration:\s*'([^']+)',\s*content:\s*`/g;
    let lessonMatch;
    let searchPos = 0;

    while ((lessonMatch = lessonRegex.exec(afterModule)) !== null) {
      const lesson = {
        id: lessonMatch[1],
        title: lessonMatch[2],
        duration: lessonMatch[3],
      };

      // Extract content between the opening ` and closing `,
      const contentStart = lessonMatch.index + lessonMatch[0].length;
      let depth = 0;
      let i = contentStart;
      let lessonContent = '';

      // Find the closing backtick of the template literal
      while (i < afterModule.length) {
        if (afterModule[i] === '\\' && i + 1 < afterModule.length) {
          // Escaped character — include both and skip
          lessonContent += afterModule[i] === '\\' && afterModule[i + 1] === '`'
            ? '`'
            : afterModule[i] === '\\' && afterModule[i + 1] === '$'
            ? '$'
            : afterModule[i] + afterModule[i + 1];
          i += 2;
          continue;
        }
        if (afterModule[i] === '`') {
          // Check if this is the closing backtick
          const ahead = afterModule.slice(i + 1, i + 10).trimStart();
          if (ahead.startsWith(',') || ahead.startsWith('}')) {
            break; // End of template literal
          }
        }
        lessonContent += afterModule[i];
        i++;
      }

      lesson.content = lessonContent.trim();
      mod.lessons.push(lesson);

      // Check if we've reached the end of this module's lessons array
      const remaining = afterModule.slice(i);
      if (/^\s*`,?\s*\}\s*,?\s*\]\s*,?\s*\}/.test(remaining.slice(0, 50))) {
        break;
      }
    }

    modules.push(mod);
  }

  return modules;
}

const outBase = 'src/content/courses';
let totalLessons = 0;

for (const course of courses) {
  console.log(`\nProcessing: ${course.courseTitle}`);
  const raw = readFileSync(course.file, 'utf8');
  const modules = parseModules(raw);

  console.log(`  Found ${modules.length} modules`);

  let moduleOrder = 0;
  for (const mod of modules) {
    moduleOrder++;
    let lessonOrder = 0;

    for (const lesson of mod.lessons) {
      lessonOrder++;
      totalLessons++;

      // Derive slug from lesson id: "angular-21/signals/signal-basics" -> "signals/signal-basics"
      const parts = lesson.id.split('/');
      const lessonSlug = parts.slice(1).join('/'); // remove course prefix

      const dir = `${outBase}/${course.courseId}/${parts[1]}`;
      mkdirSync(dir, { recursive: true });

      const frontmatter = [
        '---',
        `title: "${lesson.title.replace(/"/g, '\\"')}"`,
        `course: "${course.courseId}"`,
        `courseTitle: "${course.courseTitle}"`,
        `module: "${mod.id}"`,
        `moduleTitle: "${mod.title.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`,
        `moduleDescription: "${mod.description.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`,
        `lessonId: "${lesson.id}"`,
        `duration: "${lesson.duration}"`,
        `order: ${(moduleOrder * 100) + lessonOrder}`,
        `moduleOrder: ${moduleOrder}`,
        `lessonOrder: ${lessonOrder}`,
        `color: "${course.color}"`,
        '---',
        '',
      ].join('\n');

      const filePath = `${dir}/${parts[2]}.md`;
      writeFileSync(filePath, frontmatter + lesson.content + '\n');
    }

    console.log(`  Module "${mod.title}": ${mod.lessons.length} lessons`);
  }
}

console.log(`\nTotal: ${totalLessons} lesson files written to ${outBase}/`);
