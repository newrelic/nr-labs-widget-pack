import React from 'react';

import {
  Card,
  CardHeader,
  CardBody,
  HeadingText,
  BlockText,
  Spacing
} from 'nr1';

import RenderPropertyInfo from '../../shared/PropertyInfo';

const properties = require('./nr1.json');

// if the key matches a config property name, the additional information will be added
const additionalDocs = {
  actions: {
    description:
      'Each action is rendered as one button. See "Action Types" above for what each type does and what to enter in the fields below.'
  },
  actionType: {
    description:
      'What the button does when clicked. See "Action Types" above for details and examples.'
  },
  id: {
    description:
      'The value depends on the Action Type: a nerdlet ID (Stacked Nerdlet ID), an entity GUID (Stacked Entity GUID), or an http(s) URL (Hyperlink, Stacked Link, Window URL Replace).'
  },
  urlState: {
    description:
      'Only used by Stacked Nerdlet ID. A JSON object passed to the nerdlet as its URL state. Invalid JSON is ignored and the nerdlet opens without state.'
  },
  immediateUrlReplace: {
    description:
      'Navigates the widget to this URL as soon as it loads, without a click. Must be an http(s) URL; any other value shows an error. The target must allow being framed by the platform.'
  }
};

const actionTypes = [
  {
    title: 'Stacked Nerdlet ID',
    description:
      'Opens a New Relic view in a stacked pane. Set the nerdlet ID in the ID field and, optionally, the nerdlet’s URL state as JSON.',
    example:
      'Nerdlet ID: service-maps.home\nJSON URL State: { "entityGuid": "MTYwNjg2MnxBUE18QVBQTElDQVRJT058NjI2OTA3NjE" }'
  },
  {
    title: 'Stacked Entity GUID',
    description:
      'Opens the entity with the given GUID in a stacked pane. Set the entity GUID in the ID field.',
    example: 'MTYwNjg2MnxBUE18QVBQTElDQVRJT058NjI2OTA3NjE'
  },
  {
    title: 'Hyperlink',
    description:
      'Opens an http(s) URL in a new browser tab. Works with any website. Other schemes such as mailto: are rejected.',
    example: 'https://docs.newrelic.com'
  },
  {
    title: 'Stacked Link (experimental)',
    description:
      'Opens an http(s) URL inside a stacked pane. The platform only allows framing of certain sites (for example, *.newrelic.com), and many sites refuse to be framed. If the page does not load, use Hyperlink instead.',
    example: 'https://one.newrelic.com'
  },
  {
    title: 'Window URL Replace (experimental)',
    description:
      'Replaces the widget’s current content with an http(s) URL. The same framing limits as Stacked Link apply. The widget is replaced, so reload the dashboard to get it back.',
    example: 'https://one.newrelic.com'
  }
];

export default function Docs() {
  return (
    <div style={{ textAlign: 'left' }}>
      <HeadingText type={HeadingText.TYPE.HEADING_2}>Documentation</HeadingText>
      <Card collapsible>
        <CardHeader title="Overview" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            Action Loader, is used to trigger other platform actions and
            features.
            <br />
            <br />
            Each action is shown as a button. Below are a list of action types
            available:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                {actionTypes.map(({ title }) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </Spacing>
          </BlockText>
        </CardBody>
      </Card>

      <Card collapsible>
        <CardHeader title="Action Types" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            For every URL-based action (Hyperlink, Stacked Link, Window URL
            Replace), and for Immediate URL Replace, only <code>http</code> and{' '}
            <code>https</code> URLs are accepted. Relative URLs are resolved
            against the current page. Anything else (for example a script URL or{' '}
            <code>mailto:</code>) shows an error and does nothing.
          </BlockText>
          {actionTypes.map(({ title, description, example }) => (
            <div key={title}>
              <HeadingText type={HeadingText.TYPE.HEADING_5}>
                {title}
              </HeadingText>
              <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
                {description}
              </BlockText>
              <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
                <code style={{ whiteSpace: 'pre-wrap' }}>{example}</code>
              </Spacing>
              <br />
              <br />
            </div>
          ))}
        </CardBody>
      </Card>

      <Card collapsible defaultCollapsed>
        <CardHeader title="Properties" />
        <CardBody style={{ marginLeft: '35px' }}>
          {properties.configuration
            .filter(c => c.name !== 'showDocs')
            .map(config => {
              return RenderPropertyInfo(config, false, additionalDocs);
            })}
        </CardBody>
      </Card>

      <hr />
    </div>
  );
}
