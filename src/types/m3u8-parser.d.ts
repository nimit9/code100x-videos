declare module 'm3u8-parser' {
  class Parser {
    constructor();
    push(data: string): void;
    end(): void;
    manifest: any; // You might need to refine this type based on the library's documentation
  }

  namespace m3u8Parser {
    export { Parser };
  }

  export = m3u8Parser;
}