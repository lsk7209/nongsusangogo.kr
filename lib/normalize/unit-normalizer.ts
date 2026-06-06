export type UnitType = "unknown" | "weight" | "count" | "volume";

export type UnitNormalizerInput = {
  unit: string;
  unitType?: UnitType;
  price?: number | null;
};

export type NormalizedUnit = {
  unit: string;
  unitType: UnitType;
  weightG: number | null;
  pricePerKg: number | null;
};

export interface UnitNormalizer {
  normalize(input: UnitNormalizerInput): NormalizedUnit;
}

export class StubUnitNormalizer implements UnitNormalizer {
  normalize(input: UnitNormalizerInput): NormalizedUnit {
    return {
      unit: input.unit,
      unitType: input.unitType ?? "unknown",
      weightG: null,
      pricePerKg: null,
    };
  }
}

