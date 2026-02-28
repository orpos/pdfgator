import type { PDFPageProxy } from "pdfjs-dist";

export interface PDFPg {
  id: string;
  // fileIndex: number;
  path: string;

  doc: Promise<PDFPageProxy>;

  // State
  pageNumber: number;
  flip: number;
  selected: boolean;
}

export interface ImgPG {
  id: string;
  img_path: string;
  thumb_path: string;

  // State
  flip: number;
  selected: boolean;
}
