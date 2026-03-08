import { describe, it, expect, vi } from 'vitest';

// Mock pdfjs-dist and mammoth to avoid browser API dependencies
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: { workerSrc: '' } }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }));
vi.mock('mammoth', () => ({ default: { extractRawText: vi.fn() } }));

import { getFileExtension, isSupportedDocument, isImageFile } from '../extractText';

describe('getFileExtension', () => {
  it('returns lowercase extension with dot', () => {
    expect(getFileExtension('document.PDF')).toBe('.pdf');
    expect(getFileExtension('image.PNG')).toBe('.png');
    expect(getFileExtension('file.TXT')).toBe('.txt');
  });

  it('returns extension for simple filenames', () => {
    expect(getFileExtension('test.csv')).toBe('.csv');
    expect(getFileExtension('readme.md')).toBe('.md');
    expect(getFileExtension('photo.jpg')).toBe('.jpg');
  });

  it('returns last extension for multiple dots', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('.gz');
    expect(getFileExtension('my.file.name.docx')).toBe('.docx');
  });

  it('returns empty string for no extension', () => {
    expect(getFileExtension('Makefile')).toBe('');
    expect(getFileExtension('README')).toBe('');
  });

  it('handles empty string', () => {
    expect(getFileExtension('')).toBe('');
  });

  it('handles dot-only filename', () => {
    expect(getFileExtension('.gitignore')).toBe('.gitignore');
  });
});

describe('isSupportedDocument', () => {
  it('accepts PDF files', () => {
    expect(isSupportedDocument('report.pdf')).toBe(true);
    expect(isSupportedDocument('REPORT.PDF')).toBe(true);
  });

  it('accepts DOCX files', () => {
    expect(isSupportedDocument('doc.docx')).toBe(true);
  });

  it('accepts text-based files', () => {
    expect(isSupportedDocument('notes.txt')).toBe(true);
    expect(isSupportedDocument('README.md')).toBe(true);
    expect(isSupportedDocument('data.csv')).toBe(true);
  });

  it('accepts image files', () => {
    expect(isSupportedDocument('photo.png')).toBe(true);
    expect(isSupportedDocument('image.jpg')).toBe(true);
    expect(isSupportedDocument('pic.jpeg')).toBe(true);
    expect(isSupportedDocument('banner.webp')).toBe(true);
  });

  it('rejects unsupported formats', () => {
    expect(isSupportedDocument('archive.zip')).toBe(false);
    expect(isSupportedDocument('program.exe')).toBe(false);
    expect(isSupportedDocument('video.mp4')).toBe(false);
    expect(isSupportedDocument('Makefile')).toBe(false);
  });
});

describe('isImageFile', () => {
  it('recognizes PNG', () => {
    expect(isImageFile('photo.png')).toBe(true);
    expect(isImageFile('PHOTO.PNG')).toBe(true);
  });

  it('recognizes JPG and JPEG', () => {
    expect(isImageFile('img.jpg')).toBe(true);
    expect(isImageFile('img.jpeg')).toBe(true);
  });

  it('recognizes WEBP', () => {
    expect(isImageFile('banner.webp')).toBe(true);
  });

  it('rejects non-image files', () => {
    expect(isImageFile('doc.pdf')).toBe(false);
    expect(isImageFile('text.txt')).toBe(false);
    expect(isImageFile('data.csv')).toBe(false);
    expect(isImageFile('file.docx')).toBe(false);
    expect(isImageFile('video.gif')).toBe(false);
  });
});

describe('isSupportedDocument – Excel & GIF', () => {
  it('accepts xlsx files', () => {
    expect(isSupportedDocument('data.xlsx')).toBe(true);
  });

  it('accepts xls files', () => {
    expect(isSupportedDocument('data.xls')).toBe(true);
  });

  it('rejects gif files', () => {
    expect(isSupportedDocument('anim.gif')).toBe(false);
  });
});
