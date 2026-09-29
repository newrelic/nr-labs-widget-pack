const sharedParser = new DOMParser();

const getText = (el, selector) =>
  el.querySelector(selector)?.textContent?.trim() || '';

const findAtomLink = (el, prefix = '') =>
  (
    el.querySelector(`${prefix}link[rel="alternate"]`) ||
    el.querySelector(`${prefix}link:not([rel])`)
  )?.getAttribute('href') || '';

const stripTags = html => {
  const parsed = sharedParser.parseFromString(html || '', 'text/html');
  return parsed.body?.textContent?.trim() || '';
};

const toIsoDateOrEmpty = rawDate => {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

export const parseRSSFeed = xmlText => {
  const doc = sharedParser.parseFromString(xmlText, 'application/xml');
  const isAtom = !!doc.querySelector('feed');

  const feedTitle = getText(doc, isAtom ? 'feed > title' : 'channel > title');
  const feedDescription = getText(
    doc,
    isAtom ? 'feed > subtitle' : 'channel > description'
  );
  const feedLink = isAtom
    ? findAtomLink(doc, 'feed > ')
    : getText(doc, 'channel > link');

  const items = Array.from(doc.querySelectorAll(isAtom ? 'entry' : 'item')).map(
    item => {
      const title = getText(item, 'title');
      const link = isAtom
        ? findAtomLink(item) || getText(item, 'link')
        : getText(item, 'link');
      const rawDate = isAtom
        ? getText(item, 'published') || getText(item, 'updated')
        : getText(item, 'pubDate');
      const isoDate = toIsoDateOrEmpty(rawDate);
      const rawContent = isAtom
        ? getText(item, 'content') || getText(item, 'summary')
        : getText(item, 'description');
      const contentSnippet = stripTags(rawContent);

      return { title, link, isoDate, contentSnippet };
    }
  );

  return {
    title: feedTitle,
    description: feedDescription,
    link: feedLink,
    items
  };
};
