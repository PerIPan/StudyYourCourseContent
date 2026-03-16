declare module 'pptx-parser' {
  export default class PptxParser {
    parse(buffer: Buffer): Promise<Array<{ text: string }>>;
  }
}
