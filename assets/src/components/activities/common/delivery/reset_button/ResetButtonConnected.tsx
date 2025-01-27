import React from 'react';
import { useSelector } from 'react-redux';
import { useDeliveryElementContext } from 'components/activities/DeliveryElementProvider';
import { ResetButton } from 'components/activities/common/delivery/reset_button/ResetButton';
import { ActivityDeliveryState, isEvaluated, isSubmitted } from 'data/activities/DeliveryState';

interface Props {
  onReset: () => void;
}
export const ResetButtonConnected: React.FC<Props> = ({ onReset }) => {
  const { graded, surveyId } = useDeliveryElementContext().context;
  const uiState = useSelector((state: ActivityDeliveryState) => state);

  return (
    <ResetButton
      shouldShow={(isEvaluated(uiState) || isSubmitted(uiState)) && !graded && surveyId === null}
      disabled={!uiState.attemptState.hasMoreAttempts}
      action={onReset}
    />
  );
};
