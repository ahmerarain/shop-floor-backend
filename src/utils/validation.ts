// Field mapping for CSV columns
export const FIELD_MAPPING = {
  part_mark: ["Part Mark", "PartMark", "Part_Mark"],
  assembly_mark: ["Assembly Mark", "AssemblyMark", "Assembly_Mark"],
  material: ["Material"],
  thickness: ["Thickness"],
  quantity: ["Quantity"],
  length: ["Length"],
  width: ["Width"],
  height: ["Height"],
  weight: ["Weight"],
  notes: ["Notes"],
} as const;

// Validation function for mandatory fields
export function validateRow(
  row: any,
  rowIndex: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (
    !row[FIELD_MAPPING.part_mark[0]] ||
    row[FIELD_MAPPING.part_mark[0]].trim() === ""
  ) {
    errors.push("PartMark is required");
  }

  if (
    !row[FIELD_MAPPING.assembly_mark[0]] ||
    row[FIELD_MAPPING.assembly_mark[0]].trim() === ""
  ) {
    errors.push("AssemblyMark is required");
  }

  if (
    !row[FIELD_MAPPING.material[0]] ||
    row[FIELD_MAPPING.material[0]].trim() === ""
  ) {
    errors.push("Material is required");
  }

  if (
    !row[FIELD_MAPPING.thickness[0]] ||
    row[FIELD_MAPPING.thickness[0]].trim() === ""
  ) {
    errors.push("Thickness is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper function to get field value from row
export function getFieldValue(
  row: any,
  field: keyof typeof FIELD_MAPPING
): any {
  return row[FIELD_MAPPING[field][0]];
}

// Helper function to safely get field value with fallback
export function getFieldValueSafe(
  row: any,
  field: keyof typeof FIELD_MAPPING,
  fallback: any = null
): any {
  const value = getFieldValue(row, field);
  return value !== undefined ? value : fallback;
}
