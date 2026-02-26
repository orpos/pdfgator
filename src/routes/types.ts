import type { PDFPageProxy } from "pdfjs-dist";

export interface PDFPg {
  id: string;
  fileIndex: number;
  pageNumber: number;
  path: string;
  flip: number;
  selected: boolean;
  document: PDFPageProxy;
  prevData: File;
}

export interface ImgPG {
  id: string;
  img_path: string;
  mime: string;
  data: File;
  thumb: string;
  flip: number;
  selected: boolean;
}
