import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

interface PageText {
  pageNumber: number;
  text: string;
}

export async function parsePdf(buffer: Buffer): Promise<PageText[]> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();

  return result.pages.map(p => ({
    pageNumber: p.num,
    text: p.text.trim(),
  })).filter(p => p.text.length > 0);
}

export async function parseDocx(buffer: Buffer): Promise<PageText[]> {
  const result = await mammoth.extractRawText({ buffer });
  return [{
    pageNumber: 1,
    text: result.value,
  }];
}

export async function parsePptx(buffer: Buffer): Promise<PageText[]> {
  const PptxParser = (await import('pptx-parser')).default;
  const parser = new PptxParser();
  const slides = await parser.parse(buffer);

  return slides.map((slide: { text: string }, i: number) => ({
    pageNumber: i + 1,
    text: typeof slide === 'string' ? slide : (slide.text || ''),
  })).filter((p: PageText) => p.text.length > 0);
}

export async function parseFile(buffer: Buffer, fileType: string): Promise<PageText[]> {
  switch (fileType) {
    case 'pdf': return parsePdf(buffer);
    case 'docx': return parseDocx(buffer);
    case 'pptx': return parsePptx(buffer);
    default: throw new Error(`Unsupported file type: ${fileType}`);
  }
}
