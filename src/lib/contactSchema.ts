import { z } from 'astro/zod';

export const TOPICS = ['tokimochi', 'mochipo', 'other'] as const;

// Error messages are keys (name / email / message / token); the UI translates them.
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'name').max(100, 'name'),
  email: z.string().trim().max(254, 'email').pipe(z.email('email')),
  message: z.string().trim().min(10, 'message').max(5000, 'message'),
  topic: z.enum(TOPICS).default('other'),
  // Honeypot: real users never fill this in.
  website: z.string().max(0).optional().default(''),
  turnstileToken: z.string().min(1, 'token').max(2048, 'token'),
});

export type ContactInput = z.infer<typeof contactSchema>;
