export type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type TextElement = {
  text: string;
  frame: Rect;
  recognizedLanguages: string[];
};

export type TextLine = {
  text: string;
  frame: Rect;
  recognizedLanguages: string[];
  elements: TextElement[];
};

export type Block = {
  text: string;
  frame: Rect;
  recognizedLanguages: string[];
  lines: TextLine[];
};

export type Text = {
  text: string;
  blocks: Block[];
};
