const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data'); // npm i form-data

const BEYONDCHATS_LAST_PAGE = 'https://beyondchats.com/blogs-2/page/8/';
const LARAVEL_API = 'http://127.0.0.1:8000/api/articles';

async function scrapeAndStore() {
  // 1. Fetch last page
  const { data } = await axios.get(BEYONDCHATS_LAST_PAGE);
  const $ = cheerio.load(data);

  // 2. Find first 5 article links (inspect page HTML)
  const articleLinks = [];
  $('.blog-post, .post-item, article a, h2 a, .entry-title a')
    .slice(0, 5)
    .each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (href && title) articleLinks.push({ href, title });
    });

  console.log(`Found ${articleLinks.length} articles`);

  // 3. For each: fetch full article → extract content → POST to Laravel
  for (const { href, title } of articleLinks) {
    try {
      const fullArticle = await axios.get(href);
      const $full = cheerio.load(fullArticle.data);

      // Extract main content (common selectors)
      let content = $full('article, .post-content, .entry-content').html() ||
        $full('.content, main').html() ||
        'Content not found';

      // POST to Laravel API
      await axios.post(LARAVEL_API, {
        source: 'beyondchats',
        source_url: href,
        title,
        content_html: content,
        status: 'original'
      });

      console.log(`✅ Stored: ${title}`);
    } catch (error) {
      console.error(`❌ Failed ${href}:`, error.message);
    }
  }
}

scrapeAndStore();
