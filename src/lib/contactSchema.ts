import { z } from 'astro/zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'お名前を入力してください').max(100),
  email: z.string().trim().max(254).pipe(z.email('メールアドレスの形式が正しくありません')),
  message: z.string().trim().min(10, '10文字以上で入力してください').max(5000),
  // Honeypot: real users never fill this in.
  website: z.string().max(0).optional().default(''),
  turnstileToken: z.string().min(1, 'スパム対策の確認が完了していません').max(2048),
});

export type ContactInput = z.infer<typeof contactSchema>;
