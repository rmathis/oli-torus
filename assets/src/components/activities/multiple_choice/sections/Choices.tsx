import React from 'react';
import { Heading } from 'components/misc/Heading';
import { RichTextEditor } from 'components/content/RichTextEditor';
import { ModelEditorProps } from '../schema';
import { Choice, Response, RichText } from '../../types';
import { Description } from 'components/misc/Description';
import { IconCorrect, IconIncorrect } from 'components/misc/Icons';
import { CloseButton } from 'components/misc/CloseButton';
import { ProjectSlug } from 'data/types';
import * as Lang from 'utils/lang';
import { ShuffleChoicesOption } from 'components/activities/common/utils';

interface ChoicesProps extends ModelEditorProps {
  onAddChoice: () => void;
  onEditChoice: (id: string, content: RichText) => void;
  onRemoveChoice: (id: string) => void;
  projectSlug: ProjectSlug;
  onShuffle: () => void;
}
export const Choices = ({
  onAddChoice,
  onEditChoice,
  onRemoveChoice,
  editMode,
  model,
  projectSlug,
  onShuffle,
}: ChoicesProps) => {
  const {
    authoring: { parts },
    choices,
  } = model;
  const isCorrect = (response: Response) => response.score === 1;

  const correctChoice = choices.reduce((correct, choice) => {
    if (correct !== null) return correct;

    if (
      parts[0].responses.find(
        (response) => response.rule === `input like {${choice.id}}` && isCorrect(response),
      )
    ) {
      return choice;
    } else {
      return null;
    }
  }, null);

  if (correctChoice === null || correctChoice === undefined) {
    throw new Error('Correct choice could not be found:' + JSON.stringify(choices));
  }

  const incorrectChoices = choices.filter((choice) => choice.id !== correctChoice.id);

  return (
    <div className="my-5">
      <Heading
        title={Lang.dgettext('mcq', 'Answer Choices')}
        subtitle={Lang.dgettext(
          'mcq',
          'One correct answer choice and as many incorrect answer choices as you like.',
        )}
        id="choices"
      />

      <ShuffleChoicesOption onShuffle={onShuffle} model={model} />

      <Description>
        <IconCorrect /> {Lang.dgettext('mcq', 'Correct Choice')}
      </Description>
      <RichTextEditor
        className="mb-3"
        projectSlug={projectSlug}
        key="correct"
        editMode={editMode}
        text={correctChoice.content}
        onEdit={(content) => onEditChoice(correctChoice.id, content)}
      />
      {incorrectChoices.map((choice, index) => (
        <React.Fragment key={choice.id}>
          <Description>
            <IconIncorrect /> {Lang.dgettext('mcq', 'Incorrect Choice')} {index + 1}
          </Description>
          <div className="d-flex mb-3">
            <RichTextEditor
              className="flex-fill"
              projectSlug={projectSlug}
              editMode={editMode}
              text={choice.content}
              onEdit={(content) => onEditChoice(choice.id, content)}
            />
            <CloseButton
              className="pl-3 pr-1"
              onClick={() => onRemoveChoice(choice.id)}
              editMode={editMode}
            />
          </div>
        </React.Fragment>
      ))}
      <button className="btn btn-sm btn-primary my-2" disabled={!editMode} onClick={onAddChoice}>
        {Lang.dgettext('mcq', 'Add incorrect answer choice')}
      </button>
    </div>
  );
};