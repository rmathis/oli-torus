/* eslint-disable react/prop-types */
import {
  NotificationContext,
  NotificationType,
  subscribeToNotification,
} from 'apps/delivery/components/NotificationContext';
import Unknown from 'apps/delivery/components/UnknownComponent';
import React, { CSSProperties, useContext, useEffect, useRef, useState } from 'react';

const AuthoredPartComponent: React.FC<any> = (props) => {
  const pusherContext = useContext(NotificationContext);

  // TODO: build from configuration instead
  const wcEvents: any = {
    init: props.onInit,
    ready: props.onReady,
    save: props.onSave,
    submit: props.onSubmit,
  };

  const ref = useRef<any>(null);
  useEffect(() => {
    if (!pusherContext) {
      return;
    }
    const notificationsHandled = [
      NotificationType.CHECK_STARTED,
      NotificationType.CHECK_COMPLETE,
      NotificationType.CONTEXT_CHANGED,
      NotificationType.STATE_CHANGED,
    ];
    const notifications = notificationsHandled.map((notificationType: NotificationType) => {
      const handler = (e: any) => {
        /* console.log(`${notificationType.toString()} notification handled [PC : ${props.id}]`, e); */
        const el = ref.current;
        if (el) {
          if (el.notify) {
            el.notify(notificationType.toString(), e);
          }
        }
      };
      const unsub = subscribeToNotification(pusherContext, notificationType, handler);
      return unsub;
    });
    return () => {
      notifications.forEach((unsub) => {
        unsub();
      });
    };
  }, [pusherContext]);

  const [listening, setIsListening] = useState(false);
  useEffect(() => {
    const wcEventHandler = async (e: any) => {
      /* console.log(`WebComponent event [PC : ${props.id}]`, e); */
      const { payload, callback } = e.detail;
      if (payload.id !== props.id) {
        // because we need to listen to document we'll get all part component events
        // each PC adds a listener, so we need to filter out our own here
        return;
      }
      const handler = wcEvents[e.type];
      if (handler) {
        const result = await handler(payload);
        if (callback) {
          callback(result);
        }
      }
    };
    Object.keys(wcEvents).forEach((eventName) => {
      /* console.log(`[PC : ${props.id}] listening to ${eventName} event`, wcEvents[eventName]); */
      document.addEventListener(eventName, wcEventHandler);
    });
    setIsListening(true);
    return () => {
      /* console.log(`[PC : ${props.id}] UNMOUNT`); */
      Object.keys(wcEvents).forEach((eventName) => {
        document.removeEventListener(eventName, wcEventHandler);
      });
    };
  }, []);

  const compStyles: CSSProperties = {
    display: 'block',
  };

  const handlePartClick = (e: any) => {
    if (props.onPartClick) {
      props.onPartClick({ id: props.id });
    }
  };

  // we need to position the host element instead of the contents
  if (props.model) {
    compStyles.width = props.model.width;
    compStyles.height = props.model.height;
    compStyles.position = 'absolute';
    compStyles.left = props.model.x;
    compStyles.top = props.model.y;
    compStyles.zIndex = props.model.z;
  }

  const webComponentProps = {
    ref,
    id: props.id,
    type: props.type,
    ...props,
    onClick: handlePartClick,
    model: JSON.stringify(props.model),
    state: JSON.stringify(props.state),
    style: compStyles,
  };

  if (props.selected) {
    console.log('WC SELECTED', { props, webComponentProps });
  }

  const wcTagName = props.type;
  if (!wcTagName || !customElements.get(wcTagName)) {
    const unknownProps = { ...webComponentProps, ref: undefined };
    return <Unknown {...unknownProps} />;
  }

  // don't render until we're listening because otherwise the init event will post too fast
  return listening ? React.createElement(wcTagName, webComponentProps) : null;
};

export default AuthoredPartComponent;
