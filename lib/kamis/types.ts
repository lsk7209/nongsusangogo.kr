import { z } from "zod";

export const kamisRankSchema = z.enum(["high", "middle", "low", "unknown"]);
export const kamisWsrtSchema = z.enum(["wholesale", "retail"]);

export const kamisPriceRecordSchema = z.object({
  date: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  kindCode: z.string().min(1),
  kindName: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  unitType: z.enum(["unknown", "weight", "count", "volume"]).default("unknown"),
  rank: kamisRankSchema.default("unknown"),
  wsrt: kamisWsrtSchema,
  regionCode: z.string().nullable().default(null),
  price: z.string().nullable(),
  prevDay: z.string().nullable().default(null),
  m1Ma5: z.string().nullable().default(null),
  y1Ma5: z.string().nullable().default(null),
  normal3yr: z.string().nullable().default(null),
});

export const kamisPriceResponseSchema = z.object({
  sourceCode: z.literal("KAMIS"),
  records: z.array(kamisPriceRecordSchema),
  nextCursor: z.string().nullable().default(null),
});

export type KamisPriceRecord = z.infer<typeof kamisPriceRecordSchema>;
export type KamisPriceResponse = z.infer<typeof kamisPriceResponseSchema>;

export type KamisPriceRequest = {
  cursor?: string | null;
  limit?: number;
};

export interface KamisClient {
  fetchDailyPrices(request?: KamisPriceRequest): Promise<KamisPriceResponse>;
}

