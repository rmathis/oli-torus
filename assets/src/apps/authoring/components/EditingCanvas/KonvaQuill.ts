import Konva from 'konva';
import { TextConfig } from 'konva/lib/shapes/Text';
import Delta from 'quill-delta';
import Op from 'quill-delta/dist/Op';

const test = {
  ops: [
    {
      attributes: {
        bold: true,
      },
      insert: 'This lesson is inspired by actual events in western ',
    },
    {
      attributes: {
        underline: true,
        bold: true,
      },
      insert: 'Europe',
    },
    {
      attributes: {
        bold: true,
      },
      insert: ' during the Middle Ages and Renaissance Era.',
    },
    {
      insert:
        '\nDuring this time, new inventions and discoveries changed the world nearly every day.\nWe’ve included pictures and paintings of real people and key places to help you feel part of the time and place. As you learn about eclipses, take some time to imagine yourself as a part of this unique time in history.\n',
    },
  ],
};

export const createQuillText = (delta: Delta) => {
  const group = new Konva.Group();
  const doc = new Delta().compose(delta);

  let y = 0;
  doc.forEach((op) => {
    if (typeof op.insert === 'string') {
      const config: TextConfig = {
        text: op.insert,
        fontSize: 16,
      };
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
      }
      const text = new Konva.Text(config);

      y = text.height() + y + 1;

      group.add(text);
    }
    // for now skip embeds
  });

  return group;
};

export const convertQuillToJanus = (delta: Delta) => {
  const doc = new Delta().compose(delta);
  const nodes: any[] = [];
  doc.eachLine((line, attrs) => {
    const nodeStyle: any = {};
    // TODO: handle line level attributes
    if (attrs.fontSize) {
      nodeStyle.fontSize = attrs.fontSize;
    }
    const node: { tag: string; style: any; children: any[] } = {
      tag: 'p',
      style: {},
      children: [],
    };
    line.forEach((op) => {
      if (typeof op.insert === 'string') {
        // TODO: handle attributes
        const child = {
          tag: 'span',
          style: {},
          children: [],
          text: op.insert,
        };
        node.children.push(child);
      }
    });
    nodes.push(node);
  });

  return nodes;
};

export const convertJanusToQuill = (nodes: any[]) => {};
