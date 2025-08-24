import * as XLSX from "xlsx";

// Interface for a single row in Excel data
interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined;
}

// Interface for the parsed file content
interface ParsedFileContent {
  text: string;
  excelData?: ExcelRow[];
}

export const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setError: (error: string | null) => void
): Promise<ParsedFileContent | null> => {
  const file = event.target.files?.[0];
  if (!file) {
    setError("هیچ فایلی انتخاب نشده است.");
    return null;
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    setError("حجم فایل باید کمتر از ۵ مگابایت باشد.");
    return null;
  }

  // Check file type using MIME types and file extensions
  const allowedTypes = [
    "text/plain",
    "application/msword",
    "application/vnd.ms-word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  const allowedExtensions = [".txt", ".doc", ".docx", ".xls", ".xlsx"];
  const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  if (
    !allowedExtensions.includes(fileExtension) ||
    !allowedTypes.includes(file.type)
  ) {
    setError(
      "فقط فایل‌های متنی (.txt)، ورد (.doc، .docx) یا اکسل (.xls، .xlsx) مجاز هستند."
    );
    return null;
  }

  try {
    let fileContent: string = "";
    let excelData: ExcelRow[] | undefined;

    if (fileExtension === ".txt") {
      // Handle text files
      fileContent = await file.text();
    } else if (fileExtension === ".doc" || fileExtension === ".docx") {
      // Handle Word files
      const arrayBuffer = await file.arrayBuffer();
      const { default: mammoth } = await import("mammoth");
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value === "" && fileExtension === ".doc") {
        throw new Error(
          "فرمت .doc پشتیبانی نمی‌شود، لطفاً از .docx استفاده کنید."
        );
      }
      fileContent = result.value;
    } else if (fileExtension === ".xls" || fileExtension === ".xlsx") {
      // Handle Excel files
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      excelData = [];
      let sheetCount = 0;

      // Process up to 4 sheets
      for (const sheetName of workbook.SheetNames) {
        if (sheetCount >= 4) break;
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
        });
        // Convert rows to objects
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as (
          | string
          | number
          | boolean
          | null
          | undefined
        )[][];
        const sheetData = rows
          .filter((row) =>
            row.some((cell) => cell !== undefined && cell !== null)
          ) // Skip empty rows
          .map((row) => {
            const rowObj: ExcelRow = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index] !== undefined ? row[index] : null;
            });
            return rowObj;
          });
        excelData.push(...sheetData);
        sheetCount++;
      }

      // Convert Excel data to string for inclusion in query
      fileContent = JSON.stringify(excelData, null, 2);
    }

    // Limit file content to 15,000 characters
    if (fileContent.length > 15000) {
      fileContent = fileContent.substring(0, 15000);
    }

    // Update input with combined content using the state updater function
    setInput((prev: string) => {
      const combined = prev
        ? `${prev}\n\nمحتوای فایل:\n${fileContent}`
        : `محتوای فایل:\n${fileContent}`;
      return combined.substring(0, 15000); // Ensure total input doesn't exceed 15,000 characters
    });

    // Clear the file input to prevent re-uploading
    if (event.target) {
      event.target.value = "";
    }

    return { text: fileContent, excelData };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message.includes("Could not find the body element") ||
          error.message.includes("docx")
          ? "لطفاً اطمینان حاصل کنید که فایل یک سند ورد معتبر (.doc یا .docx) است."
          : error.message.includes("excel")
          ? "لطفاً اطمینان حاصل کنید که فایل یک سند اکسل معتبر (.xls یا .xlsx) است."
          : `خطا در پردازش فایل: ${error.message}`
        : "خطای ناشناخته در پردازش فایل.";
    setError(errorMessage);
    return null;
  }
};
