import chroma from 'chroma-js';
import register from 'components/parts/customElementWrapper';
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
import AuthoringActivityRenderer from './AuthoringActivityRenderer';
import DeckLayoutHeader from './DeckLayoutHeader';

const EditorApp = (props: any) => {
  console.log('EA', { props });
  const stylesheets: string[] = ['https://cdn.quilljs.com/1.3.6/quill.snow.css'];
  if (props.theme) {
    stylesheets.push(props.theme);
  }
  if (props.customTheme) {
    stylesheets.push(props.customTheme);
  }

  const [currentActivityTree, setCurrentActivityTree] = useState<any[]>([]);
  useEffect(() => {
    if (props.activities) {
      try {
        const tree = JSON.parse(props.activities);
        setCurrentActivityTree(tree);
      } catch (e) {
        console.error(`Error parsing activity tree: ${e}`);
      }
    }
  }, [props.activities]);

  const renderActivities = useCallback(() => {
    if (!currentActivityTree || !currentActivityTree.length) {
      return <div>loading...</div>;
    }
    const [currentActivity] = currentActivityTree.slice(-1);
    const config = currentActivity.content.custom;
    const styles: CSSProperties = {
      width: config?.width || 1300,
    };
    if (config?.palette) {
      if (config.palette.useHtmlProps) {
        styles.backgroundColor = config.palette.backgroundColor;
        styles.borderColor = config.palette.borderColor;
        styles.borderWidth = config.palette.borderWidth;
        styles.borderStyle = config.palette.borderStyle;
        styles.borderRadius = config.palette.borderRadius;
      } else {
        styles.borderWidth = `${
          config?.palette?.lineThickness ? config?.palette?.lineThickness + 'px' : '1px'
        }`;
        styles.borderRadius = '10px';
        styles.borderStyle = 'solid';
        styles.borderColor = `rgba(${
          config?.palette?.lineColor || config?.palette?.lineColor === 0
            ? chroma(config?.palette?.lineColor).rgb().join(',')
            : '255, 255, 255'
        },${config?.palette?.lineAlpha})`;
        styles.backgroundColor = `rgba(${
          config?.palette?.fillColor || config?.palette?.fillColor === 0
            ? chroma(config?.palette?.fillColor).rgb().join(',')
            : '255, 255, 255'
        },${config?.palette?.fillAlpha})`;
      }
    }
    if (config?.x) {
      styles.left = config.x;
    }
    if (config?.y) {
      styles.top = config.y;
    }
    if (config?.z) {
      styles.zIndex = config.z || 0;
    }
    if (config?.height) {
      styles.height = config.height;
    }

    // only the current activity is editable
    const activities = currentActivityTree.map((activity, index) => (
      <AuthoringActivityRenderer
        key={activity.id}
        activityModel={activity}
        editMode={index === currentActivityTree.length - 1}
      />
    ));
    return (
      <div className="content" style={styles}>
        {activities}
      </div>
    );
  }, [currentActivityTree]);

  return (
    <>
      <style>
        {`:host {
          display: block;
          width: 100%;
          height: 100%;
          contain: strict;
        }`}
      </style>
      {stylesheets.map((style, index) => (
        <link key={index} rel="stylesheet" href={style} />
      ))}
      <div className="lesson-loaded previewView">
        <DeckLayoutHeader
          pageName={props.title || ''}
          userName="Learner Name"
          showScore={true}
          themeId="default"
        />
        <div className="background" />
        <div className="stageContainer columnRestriction">
          {props.customCss && <style>{props.customCss}</style>}
          <div id="stage-stage">
            <div className="stage-content-wrapper">{renderActivities()}</div>
          </div>
        </div>
        <div
          className={['checkContainer', 'rowRestriction', 'columnRestriction'].join(' ')}
          style={{ width: 1100 }}
        >
          <div className="buttonContainer">
            <button className="checkBtn">
              <div className="ellipsis">Next</div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditorApp;

register(EditorApp, 'janus-wysiwyg', ['theme', 'custom-theme', 'custom-css', 'activities'], {
  shadow: true,
});
