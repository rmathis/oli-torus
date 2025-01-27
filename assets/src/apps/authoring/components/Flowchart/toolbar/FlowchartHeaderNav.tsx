import React, { useCallback, useRef } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import useHover from '../../../../../components/hooks/useHover';
import guid from '../../../../../utils/guid';
import { selectCurrentActivity } from '../../../../delivery/store/features/activities/slice';
import { selectCurrentActivityTree } from '../../../../delivery/store/features/groups/selectors/deck';
import {
  selectPartComponentTypes,
  selectPaths,
  selectProjectSlug,
  selectRevisionSlug,
  setShowScoringOverview,
} from '../../../store/app/slice';
import { redo } from '../../../store/history/actions/redo';
import { undo } from '../../../store/history/actions/undo';
import { selectHasRedo, selectHasUndo } from '../../../store/history/slice';
import { addPart } from '../../../store/parts/actions/addPart';
import { verifyFlowchartLesson } from '../flowchart-actions/verify-flowchart-lesson';
import { getScreenQuestionType } from '../paths/path-options';
import { PreviewIcon } from './PreviewIcon';
import { RedoIcon } from './RedoIcon';
import { ScoringIcon } from './ScoringIcon';
import { UndoIcon } from './UndoIcon';
import { toolbarIcons, toolbarTooltips } from './toolbar-icons';

interface HeaderNavProps {
  panelState: any;
  isVisible: boolean;
  authoringContainer: React.RefObject<HTMLElement>;
  onToggleExport?: () => void;
}

// 'janus-fill-blanks'
// 'janus-navigation-button'

const staticComponents: string[] = [
  'janus_text_flow',
  'janus_image',
  'janus_video',
  //'janus_image_carousel',
  'janus_popup',
  'janus_audio',
  'janus_capi_iframe',
];
const questionComponents: string[] = [
  'janus_mcq',
  'janus_input_text',
  'janus_dropdown',
  'janus_input_number',
  'janus_slider',
  'janus_multi_line_text',
];

const ToolbarOption: React.FC<{ disabled?: boolean; component: string; onClick: () => void }> = ({
  component,
  onClick,
  disabled = false,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const hover = useHover(ref);

  const Icon = toolbarIcons[component];
  return (
    <button
      key={component}
      onClick={onClick}
      className="component-button"
      disabled={disabled}
      ref={ref}
    >
      <OverlayTrigger
        key={component}
        placement="bottom"
        delay={{ show: 150, hide: 150 }}
        overlay={
          <Tooltip placement="top" id="button-tooltip" style={{ fontSize: '12px' }}>
            <strong>{toolbarTooltips[component]}</strong>
            {disabled && <div>Only one question component per screen is allowed</div>}
          </Tooltip>
        }
      >
        <Icon
          fill={disabled ? '#F3F5F8' : hover ? '#dce7f9' : undefined}
          stroke={disabled ? '#696974' : undefined}
        />
      </OverlayTrigger>
    </button>
  );
};

export const FlowchartHeaderNav: React.FC<HeaderNavProps> = (props: HeaderNavProps) => {
  const projectSlug = useSelector(selectProjectSlug);
  const revisionSlug = useSelector(selectRevisionSlug);
  const availablePartComponents = useSelector(selectPartComponentTypes);
  const currentActivityTree = useSelector(selectCurrentActivityTree);

  const dispatch = useDispatch();

  const hasRedo = useSelector(selectHasRedo);
  const hasUndo = useSelector(selectHasUndo);

  const handleUndo = () => {
    dispatch(undo(null));
  };

  const handleRedo = () => {
    dispatch(redo(null));
  };

  const paths = useSelector(selectPaths);

  //const isReadOnly = useSelector(selectReadOnly);
  const currentActivity = useSelector(selectCurrentActivity);

  const questionType = getScreenQuestionType(currentActivity);
  const hasQuestion = questionType !== 'none';

  const url = `/authoring/project/${projectSlug}/preview/${revisionSlug}`;
  const windowName = `preview-${projectSlug}`;

  const previewLesson = useCallback(async () => {
    await dispatch(verifyFlowchartLesson({}));
    window.open(url, windowName);
  }, [dispatch, url, windowName]);

  const handleScoringOverviewClick = () => {
    dispatch(setShowScoringOverview({ show: true }));
  };

  const handleAddComponent = useCallback(
    (partComponentType: string) => () => {
      if (!availablePartComponents) {
        return;
      }
      const partComponent = availablePartComponents.find((p) => p.slug === partComponentType);
      if (!partComponent) {
        console.warn(`No part ${partComponentType} found in registry!`, {
          availablePartComponents,
        });
        return;
      }
      const PartClass = customElements.get(partComponent.authoring_element);
      if (PartClass) {
        // only ever add to the current activity, not a layer

        const part = new PartClass() as any;
        const newPartData = {
          id: `${partComponentType}-${guid()}`,
          type: partComponent.delivery_element,
          custom: {
            x: 10,
            y: 10,
            z: 0,
            width: 100,
            height: 100,
          },
        };
        const creationContext = { transform: { ...newPartData.custom } };
        if (part.createSchema) {
          newPartData.custom = { ...newPartData.custom, ...part.createSchema(creationContext) };
        }
        if (currentActivityTree) {
          const [currentActivity] = currentActivityTree.slice(-1);
          dispatch(addPart({ activityId: currentActivity.id, newPartData }));
        }
      }
    },
    [availablePartComponents, currentActivityTree, dispatch],
  );

  return (
    paths && (
      <div className="component-toolbar">
        <div className="toolbar-column" style={{ flexBasis: '10%', maxWidth: 50 }}>
          <label>Undo</label>
          <button className="undo-redo-button" onClick={handleUndo} disabled={!hasUndo}>
            <UndoIcon />
          </button>
        </div>

        <div className="toolbar-column" style={{ flexBasis: '10%', maxWidth: 50 }}>
          <label>Redo</label>
          <button className="undo-redo-button" onClick={handleRedo} disabled={!hasRedo}>
            <RedoIcon />
          </button>
        </div>

        <div className="toolbar-column" style={{ flexBasis: '42%' }}>
          <label>Static Components</label>
          <div className="toolbar-buttons">
            {staticComponents.map((component) => (
              <ToolbarOption
                component={component}
                key={component}
                onClick={handleAddComponent(component)}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-column" style={{ flexBasis: '42%' }}>
          <label>Question Components</label>
          <div className="toolbar-buttons">
            {questionComponents.map((component) => (
              <ToolbarOption
                disabled={hasQuestion}
                component={component}
                key={component}
                onClick={handleAddComponent(component)}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-column" style={{ flexBasis: '14%' }}>
          <label>Overview</label>
          <div className="toolbar-buttons">
            <button onClick={previewLesson} className="component-button">
              <PreviewIcon />
            </button>
            <button onClick={handleScoringOverviewClick} className="component-button">
              <ScoringIcon />
            </button>
          </div>
        </div>

        {/* <div className="btn-toolbar" role="toolbar">
          <div className="btn-group pl-3 align-items-center" role="group">
            <UndoRedoToolbar />
          </div>
          <div className="btn-group px-3 border-right align-items-center" role="group">
            <div>
              <label>Static Components</label>
              <AddComponentToolbar
                frequentlyUsed={staticComponents}
                authoringContainer={props.authoringContainer}
                showMoreComponentsMenu={false}
                showPasteComponentOption={false}
              />
            </div>

            <div>
              <label>Question Components</label>

              <AddComponentToolbar
                disabled={hasQuestion}
                frequentlyUsed={questionComponents}
                authoringContainer={props.authoringContainer}
                showMoreComponentsMenu={false}
              />
            </div>
          </div>

          <div className="btn-group pl-3 align-items-center" role="group">
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 150, hide: 150 }}
              overlay={
                <Tooltip id="button-tooltip" style={{ fontSize: '12px' }}>
                  Preview
                </Tooltip>
              }
            >
              <span>
                <button className="px-2 btn btn-link" onClick={previewLesson}>
                  <img src={`${paths.images}/icons/icon-preview.svg`}></img>
                </button>
              </span>
            </OverlayTrigger>
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 150, hide: 150 }}
              overlay={
                <Tooltip id="button-tooltip" style={{ fontSize: '12px' }}>
                  Scoring Overview
                </Tooltip>
              }
            >
              <span>
                <button className="px-2 btn btn-link" onClick={handleScoringOverviewClick}>
                  <i
                    className="fa fa-star"
                    style={{ fontSize: 32, color: '#333', verticalAlign: 'middle' }}
                  />
                </button>
              </span>
            </OverlayTrigger>

            {isReadOnly && (
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 150, hide: 150 }}
                overlay={
                  <Tooltip id="button-tooltip" style={{ fontSize: '12px' }}>
                    Read Only
                  </Tooltip>
                }
              >
                <span>
                  <button className="px-2 btn btn-link" onClick={handleReadOnlyClick}>
                    <i
                      className="fa fa-exclamation-triangle"
                      style={{ fontSize: 40, color: 'goldenrod' }}
                    />
                  </button>
                </span>
              </OverlayTrigger>
            )}
          </div>
        </div> */}
      </div>
    )
  );
};

export default FlowchartHeaderNav;
