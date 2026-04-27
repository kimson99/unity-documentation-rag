import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const NOISE_PATTERNS = [
  'nav', 'footer', 'header', 'sidebar', 'breadcrumb',
  'toolbar', 'toc', 'menu', 'cookie', 'banner',
  'modal', 'overlay', 'popup', 'advertisement',
];

const MAIN_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.manual-content',
  '.documentation-content',
  '.content-section',
  '#content',
  '.content',
];

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
});
turndown.addRule('strip-link-urls', {
  filter: 'a',
  replacement: (content) => content,
});

export function extractHtmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);

  $('script, style, noscript, iframe, select, option').remove();
  $('header, footer, nav, aside').remove();
  $('img, picture, svg, canvas, video, audio').remove();

  for (const pattern of NOISE_PATTERNS) {
    $(`[class*="${pattern}"], [id*="${pattern}"]`).remove();
  }

  let contentHtml = $('body').html() ?? '';
  for (const selector of MAIN_SELECTORS) {
    const el = $(selector).first();
    const elHtml = el.html();
    if (el.length && elHtml && elHtml.length > 200) {
      contentHtml = elHtml;
      break;
    }
  }

  return turndown
    .turndown(contentHtml)
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (/copyright|all rights reserved|built from job|built on:/i.test(t))
        return false;
      if (/see in glossary/i.test(t)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}
