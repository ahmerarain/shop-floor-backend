import { validateRow } from "../src/utils/validation";
import {
  sanitizeForCsvInjection,
  sanitizeRowForCsv,
} from "../src/utils/fileValidation";

describe("Validation Functions - Unit Tests", () => {
  describe("validateRow", () => {
    it("should validate a row with all required fields", () => {
      const validRow = {
        "Part Mark": "PART001",
        "Assembly Mark": "ASSY001",
        Material: "Steel",
        Thickness: "5mm",
      };

      const result = validateRow(validRow, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject a row missing required fields", () => {
      const invalidRow = {
        "Part Mark": "PART001",
        "Assembly Mark": "",
        Material: "Steel",
        Thickness: "",
      };

      const result = validateRow(invalidRow, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("AssemblyMark is required");
      expect(result.errors).toContain("Thickness is required");
    });

    it("should reject a row with empty string values", () => {
      const invalidRow = {
        "Part Mark": "   ",
        "Assembly Mark": "ASSY001",
        Material: "Steel",
        Thickness: "5mm",
      };

      const result = validateRow(invalidRow, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("PartMark is required");
    });

    it("should reject a row with undefined values", () => {
      const invalidRow = {
        "Part Mark": undefined,
        "Assembly Mark": "ASSY001",
        Material: "Steel",
        Thickness: "5mm",
      };

      const result = validateRow(invalidRow, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("PartMark is required");
    });
  });

  describe("sanitizeForCsvInjection", () => {
    it("should prefix dangerous characters with single quote", () => {
      expect(sanitizeForCsvInjection("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeForCsvInjection("+1+1")).toBe("'+1+1");
      expect(sanitizeForCsvInjection("-1-1")).toBe("'-1-1");
      expect(sanitizeForCsvInjection("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
    });

    it("should not modify safe strings", () => {
      expect(sanitizeForCsvInjection("Normal text")).toBe("Normal text");
      expect(sanitizeForCsvInjection("12345")).toBe("12345");
      expect(sanitizeForCsvInjection("PART001")).toBe("PART001");
    });

    it("should handle empty strings", () => {
      expect(sanitizeForCsvInjection("")).toBe("");
      expect(sanitizeForCsvInjection("   ")).toBe("   ");
    });

    it("should handle non-string inputs", () => {
      expect(sanitizeForCsvInjection(123)).toBe(123);
      expect(sanitizeForCsvInjection(null)).toBe(null);
      expect(sanitizeForCsvInjection(undefined)).toBe(undefined);
    });
  });

  describe("sanitizeRowForCsv", () => {
    it("should sanitize all values in a row", () => {
      const row = {
        part_mark: "PART001",
        assembly_mark: "=SUM(A1:A10)",
        material: "Steel",
        thickness: "+5mm",
        notes: "Normal notes",
      };

      const sanitized = sanitizeRowForCsv(row);

      expect(sanitized.part_mark).toBe("PART001");
      expect(sanitized.assembly_mark).toBe("'=SUM(A1:A10)");
      expect(sanitized.material).toBe("Steel");
      expect(sanitized.thickness).toBe("'+5mm");
      expect(sanitized.notes).toBe("Normal notes");
    });

    it("should handle empty row", () => {
      const row = {};
      const sanitized = sanitizeRowForCsv(row);
      expect(sanitized).toEqual({});
    });
  });
});
