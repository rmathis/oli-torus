import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateWithoutTime } from 'epoq';
import { PageDragBar } from './PageDragBar';
import { ScheduleHeader } from './ScheduleHeader';
import { DayGeometry } from './date-utils';
import { getSelectedId } from './schedule-selectors';
// import { SchedulePlaceholder } from './SchedulePlaceholder';
import { HierarchyItem, moveScheduleItem, selectItem, unlockScheduleItem } from './scheduler-slice';

interface ScheduleLineProps {
  item: HierarchyItem;
  indent: number;
  dayGeometry: DayGeometry;
}

export const PageScheduleLine: React.FC<ScheduleLineProps> = ({ item, indent, dayGeometry }) => {
  const dispatch = useDispatch();
  const isSelected = useSelector(getSelectedId) === item.id;

  const onUnlock = useCallback(() => {
    dispatch(unlockScheduleItem({ itemId: item.id }));
  }, [dispatch, item.id]);

  const onSelect = useCallback(() => {
    if (isSelected) {
      // dispatch(selectItem(null));
    } else {
      dispatch(selectItem(item.id));
    }
  }, [dispatch, item.id, isSelected]);

  const onChange = useCallback(
    (startDate: DateWithoutTime | null, endDate: DateWithoutTime) => {
      dispatch(moveScheduleItem({ itemId: item.id, startDate, endDate }));
    },
    [dispatch, item.id],
  );

  const rowClass = isSelected ? 'bg-green-50' : '';
  const labelClasses = item.scheduling_type === 'due_by' ? 'font-bold' : '';

  return (
    <>
      <tr className={`${rowClass} `}>
        <td className={`w-64 ${labelClasses}`} colSpan={2} onClick={onSelect}>
          <div style={{ paddingLeft: 20 + (1 + indent) * 10 }}>
            {item.manually_scheduled && (
              <span
                className="float-right"
                onClick={onUnlock}
                data-bs-toggle="tooltip"
                title="You have manually adjusted the dates on this. Click to unlock."
              >
                <i className="fa fa-lock fa-2xs"></i>
              </span>
            )}
            {item.title}
          </div>
        </td>

        <td className="relative p-0">
          <ScheduleHeader labels={false} dayGeometry={dayGeometry} />
          {item.endDate && (
            <PageDragBar
              onChange={onChange}
              onStartDrag={onSelect}
              endDate={item.endDate}
              manual={item.manually_scheduled}
              dayGeometry={dayGeometry}
              isContainer={false}
              isSingleDay={true}
              hardSchedule={item.scheduling_type === 'due_by'}
            />
          )}
        </td>
      </tr>
    </>
  );
};
