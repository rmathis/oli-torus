/* eslint-disable react/prop-types */
import { ActivityState, PartComponentDefinition } from 'components/activities/types';
import React from 'react';
import Draggable from 'react-draggable';
import AuthoredPartComponent from './AuthoredPartComponent';

interface DraggablePartsLayoutRendererProps {
  parts: PartComponentDefinition[];
  editable: boolean;
  selectedPart: string;
  state?: ActivityState;
  onPartInit?: any;
  onPartReady?: any;
  onPartSave?: any;
  onPartSubmit?: any;
  onPartClick?: any;
}

const defaultHandler = async () => {
  /* console.log('CALLING DEFAULT PARTLAYOUTRENDERER EVENT HANDLER!'); */
  return {
    type: 'success',
    snapshot: {},
  };
};

const DraggablePartsLayoutRenderer: React.FC<DraggablePartsLayoutRendererProps> = ({
  parts,
  state = {},
  editable = false,
  selectedPart,
  onPartInit = defaultHandler,
  onPartReady = defaultHandler,
  onPartSave = defaultHandler,
  onPartSubmit = defaultHandler,
  onPartClick = defaultHandler,
}) => {
  const popups = parts.filter((part) => part.type === 'janus-popup');
  const partsWithoutPopups = parts.filter((part) => part.type !== 'janus-popup');

  const updatedParts = [...partsWithoutPopups, ...popups];
  return (
    <React.Fragment>
      {updatedParts.map((partDefinition: PartComponentDefinition) => {
        const partProps = {
          id: partDefinition.id,
          type: partDefinition.type,
          selected: partDefinition.id === selectedPart,
          model: partDefinition.custom,
          state,
          onInit: onPartInit,
          onReady: onPartReady,
          onSave: onPartSave,
          onSubmit: onPartSubmit,
          onPartClick,
        };
        return (
          <Draggable
            key={partDefinition.id}
            disabled={!editable || partProps.selected}
            handle=".handle"
            defaultPosition={{ x: 0, y: 0 }}
            grid={[25, 25]}
            scale={1}
          >
            <AuthoredPartComponent {...partProps} />
          </Draggable>
        );
      })}
    </React.Fragment>
  );
};

export default DraggablePartsLayoutRenderer;
