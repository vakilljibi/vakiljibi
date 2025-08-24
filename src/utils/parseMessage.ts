interface ParsedMessage {
  title?: string;
  paragraphs: string[];
  separator?: string;
  footer?: string;
}

export const parseMessageContent = (content: string): ParsedMessage => {
  const lines = content.split("\n\n").filter((line) => line.trim());
  let title: string | undefined;
  let separator: string | undefined;
  let footer: string | undefined;
  const paragraphs: string[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    // Title: First line if short or starts with "عنوان:" or "پاسخ مشاوره حقوقی"
    if (
      (index === 0 && trimmedLine.length < 50 && !trimmedLine.includes(":")) ||
      trimmedLine.startsWith("عنوان:") ||
      trimmedLine.includes("پاسخ مشاوره حقوقی")
    ) {
      title = trimmedLine.replace(/^عنوان:\s*/, "");
    }
    // Separator: Lines with 10+ dashes or Persian dashes
    else if (/^[-ـ=]{10,}$/.test(trimmedLine)) {
      separator = trimmedLine;
    }
    // Footer: Lines with "مشاوره حقوقی توسط" or last line if short
    else if (
      index === lines.length - 1 &&
      (trimmedLine.includes("مشاوره حقوقی توسط") || trimmedLine.length < 100)
    ) {
      footer = trimmedLine;
    }
    // Paragraph: Everything else
    else {
      paragraphs.push(trimmedLine);
    }
  });

  return { title, paragraphs, separator, footer };
};
