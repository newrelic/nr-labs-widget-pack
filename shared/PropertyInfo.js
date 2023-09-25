import React from 'react';

import { HeadingText, Link, BlockText } from 'nr1';

export default function RenderPropertyInfo(config, isNested, additionalDocs) {
  const { name, title, description, type, items } = config;
  const extraDocs = additionalDocs[name];

  if (type === 'collection') {
    return (
      <div>
        <HeadingText type={HeadingText.TYPE.HEADING_5}>{title}</HeadingText>
        <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
          {description || extraDocs?.description || 'No description provided.'}
        </BlockText>

        {items.map(item => {
          return RenderPropertyInfo(item, isNested + 1, additionalDocs);
        })}
      </div>
    );
  }

  return (
    <div key={name} style={{ paddingLeft: `${isNested * 15}px` }}>
      <HeadingText
        type={
          isNested ? HeadingText.TYPE.HEADING_6 : HeadingText.TYPE.HEADING_5
        }
      >
        {title}
      </HeadingText>
      <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
        {description || extraDocs?.description || 'No description provided.'}
      </BlockText>

      {extraDocs?.additionalInfo && (
        <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
          {extraDocs?.additionalInfo}
        </BlockText>
      )}

      <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
        {extraDocs?.links && (
          <>
            <HeadingText
              type={HeadingText.TYPE.HEADING_6}
              style={{ paddingBottom: '5px' }}
            >
              Links
            </HeadingText>

            <BlockText>
              {extraDocs.links.map((l, i) => (
                <code key={i}>
                  <Link to={l.link}>{l.name}</Link>
                  <br />
                </code>
              ))}
            </BlockText>
          </>
        )}
      </BlockText>
      <br />
    </div>
  );
}
