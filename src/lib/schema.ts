import { z } from "zod";
import { PRICING } from "./content";
import { STATUSES } from "./db";

const productKeys = Object.keys(PRICING.product) as [string, ...string[]];
const fabricKeys = Object.keys(PRICING.fabric) as [string, ...string[]];
const decoKeys = Object.keys(PRICING.decoration) as [string, ...string[]];

/** Indian mobile numbers, tolerant of +91, spaces and dashes. */
const phone = z
  .string()
  .trim()
  .min(6, "Phone number looks too short")
  .max(20)
  .refine((v) => /^[+]?[\d\s-]{6,20}$/.test(v), "Enter a valid phone number");

export const lineSchema = z.object({
  product: z.enum(productKeys),
  fabric: z.enum(fabricKeys),
  decoration: z.enum(decoKeys),
  positions: z.coerce.number().int().min(1).max(6).default(1),
  colour: z.string().trim().max(120).default(""),
  sizes: z.record(z.string(), z.coerce.number().int().min(0).max(100000)),
  qty: z.coerce.number().int().min(0),
  est_low: z.coerce.number().min(0).default(0),
  est_high: z.coerce.number().min(0).default(0),
});

export const rfqSchema = z
  .object({
    kind: z.enum(["quote", "sample"]).default("quote"),
    name: z.string().trim().min(2, "Please enter your name").max(120),
    organisation: z.string().trim().max(160).default(""),
    phone,
    email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]).default(""),
    city: z.string().trim().max(120).default(""),
    buyerType: z.string().trim().max(80).default(""),
    colour: z.string().trim().max(160).default(""),
    requiredBy: z.string().trim().max(40).default(""),
    notes: z.string().trim().max(4000).default(""),
    // Honeypot — bots fill hidden fields, humans do not.
    website: z.string().max(0, "Rejected").optional().default(""),
    lines: z.array(lineSchema).min(1, "Add at least one product").max(12),
    uploadToken: z.string().trim().max(64).default(""),
    attachmentIds: z.array(z.coerce.number().int().positive()).max(10).default([]),
    attribution: z
      .object({
        utm_source: z.string().max(120).default(""),
        utm_medium: z.string().max(120).default(""),
        utm_campaign: z.string().max(120).default(""),
        utm_term: z.string().max(120).default(""),
        utm_content: z.string().max(120).default(""),
        referrer: z.string().max(300).default(""),
        landing_page: z.string().max(300).default(""),
        click_id: z.string().max(160).default(""),
        device: z.string().max(20).default(""),
        touches: z.coerce.number().int().min(0).max(9999).default(0),
      })
      .partial()
      .optional(),
  })
  .superRefine((v, ctx) => {
    const total = v.lines.reduce((a, l) => a + l.qty, 0);
    // A sample is one garment, but we only make one against an order of 75+.
    // The quantity submitted in sample mode is the intended ORDER size.
    const SAMPLE_MIN_ORDER = 75;
    const min = v.kind === "sample" ? SAMPLE_MIN_ORDER : PRICING.moq;
    if (total < min) {
      ctx.addIssue({
        code: "custom",
        path: ["lines"],
        message:
          v.kind === "sample"
            ? `Samples are made for orders of ${SAMPLE_MIN_ORDER} pieces and above — you have entered ${total}`
            : `Minimum order is ${PRICING.moq} pieces — your breakdown totals ${total}`,
      });
    }
  });

export type RfqInput = z.infer<typeof rfqSchema>;

export const statusSchema = z.object({
  ref: z.string().trim().min(3),
  status: z.enum(STATUSES),
  note: z.string().trim().max(2000).default(""),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Password required"),
});

/** Flatten Zod issues into { field: message } for the UI. */
export function fieldErrors(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.join(".") || "_";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
