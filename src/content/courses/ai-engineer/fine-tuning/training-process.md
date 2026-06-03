---
title: "Training Process"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "fine-tuning"
moduleTitle: "Fine-Tuning"
moduleDescription: "Learn when and how to fine-tune LLMs for specialized tasks."
lessonId: "ai-engineer/fine-tuning/training-process"
duration: "10 min"
order: 603
moduleOrder: 6
lessonOrder: 3
color: "purple"
---
# Training Process

Fine-tuning is the process of further training a pre-trained model on your specific dataset. This lesson covers the practical steps using the OpenAI API.

## Uploading Training Data

```typescript
import OpenAI from 'openai';
import * as fs from 'node:fs';

const openai = new OpenAI();

// Upload the training file
const file = await openai.files.create({
  file: fs.createReadStream('training_data.jsonl'),
  purpose: 'fine-tune',
});

console.log('File ID:', file.id);
```

## Starting a Fine-Tuning Job

```typescript
const job = await openai.fineTuning.jobs.create({
  training_file: file.id,
  model: 'gpt-4o-mini-2024-07-18',
  hyperparameters: {
    n_epochs: 3,
  },
  suffix: 'support-bot-v1',
});

console.log('Job ID:', job.id);
console.log('Status:', job.status);
```

## Monitoring Progress

```typescript
// Poll for status
async function waitForCompletion(jobId: string): Promise<string> {
  while (true) {
    const job = await openai.fineTuning.jobs.retrieve(jobId);
    console.log(`Status: ${job.status}`);

    if (job.status === 'succeeded') {
      return job.fine_tuned_model!;
    }

    if (job.status === 'failed') {
      throw new Error(`Fine-tuning failed: ${job.error?.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

const modelId = await waitForCompletion(job.id);
console.log('Fine-tuned model:', modelId);
// e.g., "ft:gpt-4o-mini-2024-07-18:org::support-bot-v1"
```

## Using Your Fine-Tuned Model

```typescript
const response = await openai.chat.completions.create({
  model: modelId, // Your fine-tuned model ID
  messages: [
    { role: 'system', content: 'You are a support assistant.' },
    { role: 'user', content: 'How do I cancel my subscription?' },
  ],
});

console.log(response.choices[0].message.content);
```

## Hyperparameters

- **Epochs (n_epochs):** How many times the model sees each example. Start with 3.
- **Batch size:** Number of examples per training step. Usually auto-tuned.
- **Learning rate multiplier:** Controls how aggressively the model learns. Default is usually fine.

## Tips

- Start with fewer epochs (2-3) and increase if the model underfits.
- Monitor the validation loss -- if it starts increasing, the model is overfitting.
- Keep the system prompt consistent between training data and production usage.
- Fine-tune the smallest model that meets your quality requirements.
