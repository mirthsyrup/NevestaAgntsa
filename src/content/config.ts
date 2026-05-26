import { defineCollection, z } from 'astro:content';

const sermonsCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.string(),
    speaker: z.string(),
    embedId: z.string(),
    coverImage: z.union([image(), z.string()]),
  }),
});

const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    day: z.string(),
    month: z.string(),
    title: z.string(),
    timeOrDate: z.string(),
    location: z.string(),
    icon: z.string().optional(),
  }),
});

export const collections = {
  sermons: sermonsCollection,
  events: eventsCollection,
};
