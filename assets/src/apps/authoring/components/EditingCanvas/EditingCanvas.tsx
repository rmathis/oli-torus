import { saveActivity } from 'apps/authoring/store/activities/actions/saveActivity';
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { clone } from 'utils/common';
import { selectCurrentActivityTree } from '../../../delivery/store/features/groups/selectors/deck';
import { selectBottomPanel, setRightPanelActiveTab } from '../../store/app/slice';
import { selectCurrentSelection, setCurrentSelection } from '../../store/parts/slice';
import { RightPanelTabs } from '../RightMenu/RightMenu';
import KonvaStage from './KonvaStage';

const EditingCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const bottomPanelState = useSelector(selectBottomPanel);
  const currentActivityTree = useSelector(selectCurrentActivityTree);
  const currentPartSelection = useSelector(selectCurrentSelection);

  const [currentActivity] = (currentActivityTree || []).slice(-1);

  // TODO: pull from currentActivity with these defaults? (or lesson defaults)
  const width = currentActivity?.content?.custom?.width || 800;
  const height = currentActivity?.content?.custom?.height || 600;

  const background = {
    color: currentActivity?.content?.custom?.palette?.backgroundColor || '#ffffff',
  };

  const layers = (currentActivityTree || []).map((activity) => ({
    id: activity.id,
    parts: activity.content.partsLayout || [],
  }));

  const [toolbarConfig, setToolbarConfig] = useState<CSSProperties>({ display: 'none' });
  useEffect(() => {
    console.log('SELECTION CHANGE EFFECT?', { currentPartSelection });
    if (!currentPartSelection || !currentActivityTree) {
      return;
    }
    let partDef;
    for (let i = 0; i < currentActivityTree.length; i++) {
      const activity = currentActivityTree[i];
      partDef = activity.content?.partsLayout.find((part: any) => part.id === currentPartSelection);
      if (partDef) {
        break;
      }
    }
    console.log('part selected', { partDef });
    if (partDef) {
      setToolbarConfig({
        display: 'block',
        position: 'absolute',
        top: partDef.custom.y - 16,
        left: partDef.custom.x,
      });
    }
  }, [currentPartSelection, currentActivityTree]);

  const handleSelectionChanged = (selected: string[]) => {
    const [first] = selected;
    console.log('[handleSelectionChanged]', { selected });
    const newSelection = first || '';
    dispatch(setCurrentSelection({ selection: newSelection }));
    const selectedTab = newSelection ? RightPanelTabs.COMPONENT : RightPanelTabs.SCREEN;
    dispatch(setRightPanelActiveTab({ rightPanelActiveTab: selectedTab }));
  };

  const handlePositionChanged = useCallback(
    (id: string, position: { x: number; y: number }) => {
      console.log('[handlePositionChanged]', { id, position });
      if (!currentActivityTree) {
        return;
      }
      // only valid to move on the "owner" layer IF it's current
      const currentActivityClone = clone(currentActivityTree.slice(-1)[0]);
      const partDef = currentActivityClone.content.partsLayout.find((part: any) => part.id === id);
      if (!partDef) {
        return;
      }
      partDef.custom.x = position.x;
      partDef.custom.y = position.y;

      dispatch(saveActivity({ activity: currentActivityClone }));
    },
    [currentActivityTree],
  );

  console.log('EC: RENDER', { layers });

  return (
    <React.Fragment>
      <section className="aa-stage">
        <ButtonToolbar style={toolbarConfig} aria-label="Component Tools">
          <ButtonGroup className="me-2" aria-label="First group">
            <Button>
              <i className="fas fa-edit mr-2" />
            </Button>
            <Button variant="danger">
              <i className="fas fa-trash mr-2" />
            </Button>
          </ButtonGroup>
        </ButtonToolbar>
        {currentActivity && (
          <KonvaStage
            key={currentActivity.id}
            selected={[currentPartSelection]}
            background={background}
            size={{ width, height }}
            layers={layers}
            onSelectionChange={handleSelectionChanged}
            onPositionChange={handlePositionChanged}
          />
        )}
      </section>
    </React.Fragment>
  );
};

export default EditingCanvas;
