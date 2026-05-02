// Serper.dev search service + Page content scraping
// Used to ground chatbot responses with real-time web data

import { config } from '../../config/index.js';
import { logger, retry } from '../../utils/index.js';
import type { SearchSource } from '../../types/index.js';

interface SerperResponse {
  organic?: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
  knowledgeGraph?: {
    title?: string;
    description?: string;
  };
  answerBox?: {
    snippet?: string;
    title?: string;
    link?: string;
  };
}

/**
 * Determine if a question needs web search for verification.
 */
export function shouldSearch(userMessage: string): boolean {
  const msg = userMessage.toLowerCase();

  const searchKeywords = [
    'học phí', 'chi tiêu', 'chỉ tiêu', 'điểm chuẩn', 'điểm trúng',
    'ngành', 'phương thức', 'xét tuyển', 'tuyển sinh',
    'hồ sơ', 'nhập học', 'thời gian', 'mốc', 'deadline',
    'địa chỉ', 'liên hệ', 'hotline', 'điện thoại', 'email',
    'ký túc', 'ktx', 'cơ sở', 'campus',
    'tổ hợp', 'tổ hợp môn', 'khối',
    'bao nhiêu', 'khi nào', 'ở đâu', 'năm nay',
    'mới nhất', 'cập nhật', 'thay đổi',
    'chương trình', 'đào tạo', 'chất lượng cao',
    'học bổng', 'miễn giảm',
    'utt', 'đại học công nghệ giao thông',
    'thống kê', 'so sánh', 'danh sách', 'liệt kê',
    'điểm', 'trúng tuyển', 'đỗ', 'đậu',
  ];

  return searchKeywords.some(kw => msg.includes(kw));
}

/**
 * Enhance user query for better search results
 */
function enhanceQuery(query: string): string {
  const year = new Date().getFullYear();
  const q = query.toLowerCase();

  let cleaned = query
    .replace(/^(cho tôi biết|hãy cho biết|bạn có thể|tôi muốn biết|tôi muốn hỏi|giúp tôi)/i, '')
    .replace(/\?+$/, '')
    .trim();

  const hasUTT = q.includes('utt') || q.includes('công nghệ giao thông') || q.includes('đại học giao thông');
  if (!hasUTT) {
    cleaned = `UTT Trường Đại học Công nghệ Giao thông Vận tải ${cleaned}`;
  }

  const timeKeywords = ['điểm chuẩn', 'học phí', 'tuyển sinh', 'xét tuyển', 'chỉ tiêu', 'năm nay', 'mới nhất'];
  if (timeKeywords.some(kw => q.includes(kw)) && !q.includes(String(year))) {
    cleaned = `${cleaned} ${year}`;
  }

  return cleaned;
}

// ==================== PAGE CONTENT SCRAPING ====================

/**
 * Fetch and extract text content from a URL
 * Focuses on extracting table data and structured content
 */
async function fetchPageContent(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UTTBot/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'vi,en;q=0.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    return extractTextFromHTML(html);
  } catch (err) {
    logger.debug(`Failed to fetch ${url}: ${err}`);
    return null;
  }
}

/**
 * Extract clean text from HTML, with special handling for tables
 */
function extractTextFromHTML(html: string): string {
  // Remove script, style, nav, footer, header, aside tags
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Convert tables to markdown-style text
  text = convertTablesToText(text);

  // Convert list items
  text = text.replace(/<li[^>]*>/gi, '- ');
  text = text.replace(/<\/li>/gi, '\n');

  // Convert headings
  text = text.replace(/<h[1-6][^>]*>/gi, '\n### ');
  text = text.replace(/<\/h[1-6]>/gi, '\n');

  // Convert paragraphs and line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '\n');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');

  // Clean up whitespace
  text = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Remove excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text;
}

/**
 * Convert HTML tables to markdown-style text representation
 * This is critical for extracting admission score data
 */
function convertTablesToText(html: string): string {
  const tableRegex = /<table[\s\S]*?<\/table>/gi;

  return html.replace(tableRegex, (tableHtml) => {
    const rows: string[][] = [];

    // Extract rows
    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[0])) !== null) {
        // Clean cell content
        let cellText = cellMatch[1]
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(cellText);
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) return '';

    // Build markdown table
    let md = '\n';
    const maxCols = Math.max(...rows.map(r => r.length));

    rows.forEach((row, i) => {
      // Pad row to max columns
      while (row.length < maxCols) row.push('');
      md += '| ' + row.join(' | ') + ' |\n';

      // Add header separator after first row
      if (i === 0) {
        md += '| ' + row.map(() => '---').join(' | ') + ' |\n';
      }
    });

    return md + '\n';
  });
}

// ==================== MAIN SEARCH ====================

/**
 * Search using Serper.dev API + scrape top UTT pages for actual data
 */
export async function searchWeb(query: string): Promise<SearchSource[]> {
  if (!config.search.enabled) {
    logger.warn('Search disabled: SERPER_API_KEY not set');
    return [];
  }

  const enhancedQuery = enhanceQuery(query);
  logger.info(`🔍 Enhanced query: "${enhancedQuery}"`);

  try {
    const results = await retry(async () => {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': config.search.serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: enhancedQuery,
          gl: 'vn',
          hl: 'vi',
          num: 10,
          tbs: 'qdr:y5',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Serper API error ${response.status}: ${errorText}`);
      }

      return response.json() as Promise<SerperResponse>;
    }, 1, 1000);

    const sources: SearchSource[] = [];

    // Add answer box if available
    if (results.answerBox?.snippet) {
      sources.push({
        title: results.answerBox.title || 'Kết quả nổi bật',
        link: results.answerBox.link || '',
        snippet: results.answerBox.snippet,
      });
    }

    // Add knowledge graph if available
    if (results.knowledgeGraph?.description) {
      sources.push({
        title: results.knowledgeGraph.title || 'Thông tin',
        link: '',
        snippet: results.knowledgeGraph.description,
      });
    }

    // Process organic results
    if (results.organic) {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 3;

      // Filter out results that only mention very old years
      const filtered = results.organic.filter(item => {
        const text = `${item.title} ${item.snippet}`.toLowerCase();
        const yearMatches = text.match(/20\d{2}/g);
        if (yearMatches) {
          return yearMatches.some(y => parseInt(y) >= minYear);
        }
        return true;
      });

      // Sort: utt.edu.vn first
      const sorted = filtered.sort((a, b) => {
        const aIsUTT = a.link.includes('utt.edu.vn') ? 0 : 1;
        const bIsUTT = b.link.includes('utt.edu.vn') ? 0 : 1;
        if (aIsUTT !== bIsUTT) return aIsUTT - bIsUTT;
        const aIsEdu = a.link.includes('.edu.vn') ? 0 : 1;
        const bIsEdu = b.link.includes('.edu.vn') ? 0 : 1;
        return aIsEdu - bIsEdu;
      });

      // Scrape top UTT pages for actual content (up to 3 pages in parallel)
      const topResults = sorted.slice(0, 8);
      const uttResults = topResults.filter(r => r.link.includes('utt.edu.vn')).slice(0, 3);
      const otherResults = topResults.filter(r => !r.link.includes('utt.edu.vn'));

      // Fetch UTT page contents in parallel
      const scrapePromises = uttResults.map(async (item) => {
        const content = await fetchPageContent(item.link);
        return { item, content };
      });

      const scraped = await Promise.all(scrapePromises);

      // Add UTT results with full page content
      for (const { item, content } of scraped) {
        const truncatedContent = content
          ? content.slice(0, 6000)  // Limit to ~6000 chars per page
          : item.snippet;

        sources.push({
          title: item.title,
          link: item.link,
          snippet: truncatedContent,
        });
      }

      // Add other results with just snippets
      for (const item of otherResults.slice(0, 5)) {
        sources.push({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        });
      }
    }

    logger.info(`🔍 Search returned ${sources.length} results (with page scraping) for: "${query.slice(0, 60)}"`);
    return sources;
  } catch (err) {
    logger.error('Search failed:', err);
    return [];
  }
}

// ==================== CONTEXT FORMATTING ====================

/**
 * Format search results into context for the AI prompt
 */
export function formatSearchContext(sources: SearchSource[]): string {
  if (sources.length === 0) return '';

  let context = '\n\n---\n';
  context += '## 📌 DỮ LIỆU THỰC TẾ TỪ WEB (ĐÃ ĐƯỢC XÁC MINH)\n\n';
  context += '⚠️ QUY TẮC BẮT BUỘC:\n';
  context += '1. CHỈ sử dụng CON SỐ/DỮ LIỆU CHÍNH XÁC từ các nguồn dưới đây\n';
  context += '2. KHÔNG ĐƯỢC tự suy diễn, nội suy, hoặc bịa ra bất kỳ con số nào (điểm chuẩn, học phí, chỉ tiêu)\n';
  context += '3. Nếu một con số KHÔNG xuất hiện trực tiếp trong dữ liệu dưới, ghi "Chưa có dữ liệu" vào ô tương ứng\n';
  context += '4. Dùng bảng Markdown khi trình bày nhiều mục, chèn trích dẫn [1], [2],... sau mỗi con số\n';
  context += '5. Ưu tiên dữ liệu từ trang chính thức utt.edu.vn\n\n';

  sources.forEach((source, i) => {
    context += `### Nguồn [${i + 1}]: ${source.title}\n`;
    if (source.link) context += `URL: ${source.link}\n`;

    // If content is long (scraped page), format it specially
    if (source.snippet.length > 500) {
      context += `📄 Nội dung trang (dữ liệu đầy đủ):\n\`\`\`\n${source.snippet}\n\`\`\`\n\n`;
    } else {
      context += `Nội dung: ${source.snippet}\n\n`;
    }
  });
  context += '---\n';

  return context;
}
