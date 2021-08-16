import React from 'react';
import ReactDOM from 'react-dom';
import { AdaptiveModelSchema } from './schema';
import * as ActivityTypes from '../types';
import { AuthoringElement, AuthoringElementProps } from '../AuthoringElement';

const Adaptive = (props: AuthoringElementProps<AdaptiveModelSchema>) => {
  console.log('adaptive authoring', props);
  return <p>Adaptive</p>;
};

export class AdaptiveAuthoring extends AuthoringElement<AdaptiveModelSchema> {
  render(mountPoint: HTMLDivElement, props: AuthoringElementProps<AdaptiveModelSchema>) {
    ReactDOM.render(<Adaptive {...props} />, mountPoint);
  }
}
// eslint-disable-next-line
const manifest = require('./manifest.json') as ActivityTypes.Manifest;
window.customElements.define(manifest.authoring.element, AdaptiveAuthoring);
