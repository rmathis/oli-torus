import { convertJanusToQuill, convertQuillToJanus } from 'apps/authoring/components/EditingCanvas/TextFlowHelpers';
import Delta from 'quill-delta';

const sampleDelta = new Delta([
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
      '\nDuring this time, new inventions and discoveries changed the world nearly every day.\nWe’ve included pictures and paintings of real people and key places to help you feel part of the time and place. As you learn about eclipses, take some time to imagine yourself as a part of this unique time in history.',
  },
]);

const sampleJanus = [
  {
    tag: 'p',
    style: {},
    children: [
      {
        tag: 'span',
        style: {
          fontWeight: 'bold',
        },
        children: [
          {
            tag: 'text',
            text: 'This lesson is inspired by actual events in western ',
            children: [],
          },
        ],
      },
      {
        tag: 'span',
        style: {
          fontWeight: 'bold',
          textDecoration: 'underline',
        },
        children: [
          {
            tag: 'text',
            text: 'Europe',
            children: [],
          },
        ],
      },
      {
        tag: 'span',
        style: {
          fontWeight: 'bold',
        },
        children: [
          {
            tag: 'text',
            text: ' during the Middle Ages and Renaissance Era.',
            children: [],
          },
        ],
      },
    ],
  },
  {
    tag: 'p',
    style: {},
    children: [
      {
        tag: 'span',
        style: {},
        children: [
          {
            tag: 'text',
            text: 'During this time, new inventions and discoveries changed the world nearly every day.',
            children: [],
          },
        ],
      },
    ],
  },
  {
    tag: 'p',
    style: {},
    children: [
      {
        tag: 'span',
        style: {},
        children: [
          {
            tag: 'text',
            text: 'We’ve included pictures and paintings of real people and key places to help you feel part of the time and place. As you learn about eclipses, take some time to imagine yourself as a part of this unique time in history.',
            children: [],
          },
        ],
      },
    ],
  },
];

describe('Text Component', () => {
  it('should convert from Quill Delta to Janus format', () => {
    const converted = convertQuillToJanus(sampleDelta);
    expect(converted).toEqual(sampleJanus);
  });

  it('should convert from Janus format to Quill format', () => {
    const converted = convertJanusToQuill(sampleJanus);
    expect(converted.ops).toEqual(sampleDelta.ops);
  });
});
