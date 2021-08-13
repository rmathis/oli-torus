import register from 'components/parts/customElementWrapper';
import React from 'react';
import DeckLayoutHeader from './DeckLayoutHeader';

const EditorApp = (props: any) => {
  console.log('EA', { props });
  const stylesheets: string[] = [];
  if (props.theme) {
    stylesheets.push(props.theme);
  }
  if (props.customTheme) {
    stylesheets.push(props.customTheme);
  }
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
            <div className="stage-content-wrapper">
              <p>content goes here</p>
            </div>
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

register(EditorApp, 'janus-wysiwyg', ['theme', 'custom-theme', 'custom-css', 'activityTree'], {
  shadow: true,
});
