/**
 * <Table For User Rank Informations>
 */
export const Ranks: {name: "bronze" | "silver" | "gold" | "platinum" , threshold: number, serviceFee: number}[]  = [
  { name: "bronze", threshold: 100, serviceFee: 0.05 },
  { name: "silver", threshold: 200, serviceFee: 0.03 },
  { name: "gold", threshold: 400, serviceFee: 0.02 },
  { name: "platinum", threshold: 800, serviceFee: 0.05 }
];