require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');

// ENV
const LARAVEL_API = process.env.LARAVEL_API || 'http://127.0.0.1:8000/api/articles';
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function phase2() {
  if (!SERPER_API_KEY) {
    console.log('❌ Missing SERPER_API_KEY in .env (get it from https://serper.dev)');
    return;
  }
  if (!OPENAI_API_KEY) {
    console.log('❌ Missing OPENAI_API_KEY in .env');
    return;
  }

  console.log('🚀 PHASE 2: Google Search + LLM Rewrite');

  // 1. Get latest ORIGINAL article from Laravel API
  const { data: articles } = await axios.get(LARAVEL_API);
  if (!articles || articles.length === 0) {
    console.log('❌ No articles found. Run Phase 1 scraper first.');
    return;
  }

  const latest =
    articles.find(a => a.status === 'original') || articles[0];

  console.log('📄 Latest ORIGINAL article:', latest.title, '(ID:', latest.id + ')');

  // 2. Google search the title (via Serper.dev)
  console.log('🔍 Searching Google for:', `"${latest.title}" -site:beyondchats.com`);

  const searchRes = await axios.post(
    'https://google.serper.dev/search',
    {
      q: `"${latest.title}" -site:beyondchats.com`,
      num: 10,
    },
    {
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  // 3. Scrape first two external article links
  const refArticles = [];

  for (const result of (searchRes.data.organic || []).slice(0, 6)) {
    if (!result.link || result.link.includes('beyondchats.com')) continue;

    try {
      console.log('🌐 Scraping reference:', result.link);
      const { data: html } = await axios.get(result.link, { timeout: 10000 });
      const $ = cheerio.load(html);

      let content =
        $('article, .post-content, .entry-content, main, .content')
          .first()
          .text()
          .trim() ||
        $('[class*="article"], [class*="post"]').first().text().trim() ||
        $('p')
          .slice(0, 10)
          .text()
          .trim() ||
        '';

      if (!content) {
        console.log('⚠️ No readable content, skipping:', result.link);
        continue;
      }

      content = content.substring(0, 4000); // limit for prompt

      refArticles.push({
        title: result.title,
        url: result.link,
        content,
      });

      console.log(`✅ Reference ${refArticles.length}: ${result.title}`);

      if (refArticles.length >= 2) break;
    } catch (e) {
      console.log('⚠️ Failed scraping, skipping:', result.link);
    }
  }

  if (refArticles.length === 0) {
    console.log('❌ No suitable reference articles found.');
    return;
  }

  console.log(`🔗 Total references used: ${refArticles.length}`);

  // 4. Call OpenAI LLM to rewrite the article
  console.log('🧠 Calling OpenAI to rewrite article...');

  const prompt = `
You are a professional SEO blog writer.

Rewrite the ORIGINAL ARTICLE so that:
- It keeps the same topic and core ideas.
- It adopts the formatting and tone similar to the REFERENCE ARTICLES.
- It uses headings, subheadings, short paragraphs, and bullet points.
- It does NOT copy any sentences from the references; everything must be rephrased.
- At the end, add a "References" section with links to the reference URLs.

ORIGINAL ARTICLE (HTML allowed):
${latest.content_html || ''}

REFERENCE ARTICLE 1 (plain text):
${refArticles[0]?.content || ''}

REFERENCE ARTICLE 2 (plain text):
${refArticles[1]?.content || ''}

Return ONLY the final HTML of the rewritten article.
  `.trim();

  const completion = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt,
  });

  const aiOutput = completion.output[0].content[0].text;

  const referencesHtml = `
<h3>References</h3>
<ul>
  ${refArticles
      .map(
        (r) =>
          `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.title}</a></li>`
      )
      .join('\n')}
</ul>
  `.trim();

  const rewrittenHtml = `${aiOutput}\n\n${referencesHtml}`;

  // 5. Publish rewritten article via Laravel API
  console.log('📤 Publishing rewritten article back to Laravel...');

  try {
    const { data: newArticle } = await axios.post(
      LARAVEL_API,
      {
        source: 'beyondchats-rewritten',
        source_url: `${latest.source_url}#rewritten-${Date.now()}`,
        title: `${latest.title} (LLM Rewritten)`,
        content_html: rewrittenHtml,
        status: 'rewritten',
        rewritten_from_id: latest.id,
        references: refArticles.map((r) => ({
          title: r.title,
          url: r.url,
        })),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    console.log('✅ Rewritten article created: ID', newArticle.id);
    console.log('🌐 View all:', LARAVEL_API);
  } catch (error) {
    console.error('❌ Error saving rewritten article:', error.response?.data || error.message);
  }

  console.log('🎉 PHASE 2 with LLM COMPLETE');
}

phase2().catch((err) => {
  console.error('❌ Fatal error:', err.message);
});
