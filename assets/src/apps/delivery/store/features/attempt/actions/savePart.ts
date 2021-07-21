import { createAsyncThunk } from '@reduxjs/toolkit';
import { writePartAttemptState } from 'data/persistence/state/intrinsic';
import {
  defaultGlobalEnv,
  evalScript,
  getAssignScript,
} from '../../../../../../adaptivity/scripting';
import { RootState } from '../../../rootReducer';
import { selectPreviewMode, selectSectionSlug } from '../../page/slice';
import {
  AttemptSlice,
  selectActivtyAttemptState,
  selectById,
  upsertActivityAttemptState,
} from '../slice';

export const savePartState = createAsyncThunk(
  `${AttemptSlice}/savePartState`,
  async (payload: any, { dispatch, getState }) => {
    const { attemptGuid, partAttemptGuid, response } = payload;
    const rootState = getState() as RootState;
    const isPreviewMode = selectPreviewMode(rootState);
    const sectionSlug = selectSectionSlug(rootState);

    // update redux state to match optimistically
    const attemptRecord = selectById(rootState, attemptGuid);
    if (attemptRecord) {
      const partAttemptRecord = attemptRecord.parts.find((p) => p.attemptGuid === partAttemptGuid);
      if (partAttemptRecord) {
        const updated = {
          ...attemptRecord,
          parts: attemptRecord.parts.map((p) => {
            const result = { ...p };
            if (p.attemptGuid === partAttemptRecord.attemptGuid) {
              result.response = response;
            }
            return result;
          }),
        };
        await dispatch(upsertActivityAttemptState({ attempt: updated }));
      }
    }

    // need to write the "local" version of every part as well to scripting so that
    // any checks (mutate state, etc) are available
    // TODO: apply state in a sub env and pass as locals instead!
    const locals = Object.keys(response).reduce((acc: Record<string, any>, key) => {
      const value = response[key];
      const valueIsObject = value && value.constructor && value.constructor === Object;
      if (valueIsObject) {
        if (value.path) {
          const key = value.path.split('|')[1];
          if (key && key.indexOf('stage') === 0) {
            acc[key] = value.value;
          }
        }
      }
      return acc;
    }, {});
    const assignScript = getAssignScript({ ...response, ...locals });
    const { result: scriptResult } = evalScript(assignScript, defaultGlobalEnv);
    console.log('SAVE PART SCRIPTING', { response, locals, assignScript, scriptResult });

    // in preview mode we don't write to server, so we're done
    if (isPreviewMode) {
      // TODO: normalize response between client and server (nothing currently cares about it)
      return { result: scriptResult };
    }

    const finalize = false;

    return writePartAttemptState(sectionSlug, attemptGuid, partAttemptGuid, response, finalize);
  },
);

export const savePartStateToTree = createAsyncThunk(
  `${AttemptSlice}/savePartStateToTree`,
  async (payload: any, { dispatch, getState }) => {
    const { attemptGuid, partAttemptGuid, response, activityTree } = payload;
    const rootState = getState() as RootState;

    const attemptRecord = selectById(rootState, attemptGuid);
    const partId = attemptRecord?.parts.find((p) => p.attemptGuid === partAttemptGuid)?.partId;
    if (!partId) {
      throw new Error('cannot find the partId to update');
    }

    const updates = activityTree.map((activity: any) => {
      const attempt = selectActivtyAttemptState(rootState, activity.resourceId);
      if (!attempt) {
        return Promise.reject('could not find attempt!');
      }
      const attemptGuid = attempt.attemptGuid;
      const partAttemptGuid = attempt.parts.find((p) => p.partId === partId)?.attemptGuid;
      if (!partAttemptGuid) {
        // means its in the tree, but doesn't own or inherit this part (some grandparent likely)
        return Promise.resolve('does not own part but thats OK');
      }
      return dispatch(savePartState({ attemptGuid, partAttemptGuid, response }));
    });
    return Promise.all(updates);
  },
);
