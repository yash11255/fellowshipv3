// GST helpers (client-safe). Indian retail prices are tax-inclusive (MRP), so GST is extracted from the price.

export type TaxSlab = { id: string; name: string; rate: number };
export type TaxSettings = {
  slabs: TaxSlab[];
  defaultSlab: string;
  gstin: string;
  businessState: string;   // place of supply origin, decides CGST+SGST vs IGST
  legalName: string;
  pricesIncludeTax: boolean;
};

export const DEFAULT_TAX: TaxSettings = {
  slabs: [
    { id: "gst0", name: "Exempt (0%)", rate: 0 },
    { id: "gst5", name: "GST 5%", rate: 5 },
    { id: "gst12", name: "GST 12%", rate: 12 },
    { id: "gst18", name: "GST 18%", rate: 18 },
  ],
  defaultSlab: "gst18", // most nutraceuticals (HSN 2106) are 18%. Confirm with your CA.
  gstin: "",
  businessState: "Haryana",
  legalName: "Arthroscopy College (Orthosport)",
  pricesIncludeTax: true,
};

export const rateFor = (t: TaxSettings, slab: string | null | undefined) =>
  (t.slabs.find((s) => s.id === slab) ?? t.slabs.find((s) => s.id === t.defaultSlab))?.rate ?? 0;

/** GST contained in an inclusive amount (paise-free, rounded per line). */
export const gstIn = (amount: number, rate: number) => Math.round((amount * rate) / (100 + rate));

export function split(taxTotal: number, shipState: string, businessState: string) {
  const intra = shipState.trim().toLowerCase() === businessState.trim().toLowerCase();
  if (!intra) return { cgst: 0, sgst: 0, igst: taxTotal };
  const half = Math.floor(taxTotal / 2);
  return { cgst: half, sgst: taxTotal - half, igst: 0 };
}
