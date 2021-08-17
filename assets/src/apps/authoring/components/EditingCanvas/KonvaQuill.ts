import Konva from 'konva';
import { TextConfig } from 'konva/lib/shapes/Text';
import Delta from 'quill-delta';

export const createQuillText = (delta: Delta, width?: number) => {
  const group = new Konva.Group();
  const doc = new Delta().compose(delta);

  let y = 0;
  doc.forEach((op) => {
    if (typeof op.insert === 'string') {
      const config: TextConfig = {
        y,
        text: op.insert,
        fontSize: 16,
      };
      if (width) {
        config.width = width;
      }
      if (op.attributes) {
        if (op.attributes.fontSize) {
          config.fontSize = op.attributes.fontSize;
        }
        if (op.attributes.fontFamily) {
          config.fontFamily = op.attributes.fontFamily;
        }
        if (op.attributes.color) {
          config.fill = op.attributes.color;
        }
        if (op.attributes.bold) {
          config.fontStyle = 'bold';
        }
        if (op.attributes.italic) {
          config.fontStyle = 'italic';
        }
        if (op.attributes.bold && op.attributes.italic) {
          config.fontStyle = 'bold italic';
        }
      }
      const text = new Konva.Text(config);

      y = text.height() + y + 1;

      group.add(text);
    }
    // for now skip embeds
  });

  return group;
};
