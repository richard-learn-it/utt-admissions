/**
 * Memory Service - Manages short-term and long-term memory for the chatbot
 * 
 * SHORT-TERM MEMORY (STM):
 * - Current conversation context & recent topic tracking
 * - Auto-summarized when conversation grows long
 * - Lives only during active conversation session
 * 
 * LONG-TERM MEMORY (LTM):
 * - Persistent user facts extracted from conversations
 * - User preferences, interests, academic info
 * - Stored in localStorage, survives across sessions
 */

// ==================== TYPES ====================

export interface MemoryFact {
  id: string;
  category: 'personal' | 'academic' | 'interest' | 'location' | 'preference';
  key: string;        // e.g. "name", "interested_major", "exam_score"
  value: string;       // e.g. "Nguyễn Văn A", "Công nghệ thông tin", "28.5"
  confidence: number;  // 0-1, higher = more certain
  createdAt: number;
  updatedAt: number;
  sourceConversationId?: string;
}

export interface UserProfile {
  facts: MemoryFact[];
  conversationSummaries: ConversationSummary[];
  lastInteraction: number;
  totalConversations: number;
}

export interface ConversationSummary {
  conversationId: string;
  summary: string;       // Key topics discussed
  topics: string[];      // Tags: ["điểm chuẩn", "CNTT", "học phí"]
  createdAt: number;
}

export interface MemoryContext {
  userProfile: string;           // Natural language summary of known user facts
  recentTopics: string[];        // Topics from recent conversations
  conversationHistory: string;   // Summary of past conversations
}

// ==================== CONSTANTS ====================

const LTM_STORAGE_KEY = 'utt-chatbot-ltm';
const MAX_FACTS = 50;
const MAX_CONVERSATION_SUMMARIES = 20;
const FACT_CONFIDENCE_THRESHOLD = 0.6;

// ==================== EXTRACTION PATTERNS ====================

interface ExtractionPattern {
  pattern: RegExp;
  category: MemoryFact['category'];
  key: string;
  extractValue: (match: RegExpMatchArray) => string;
  confidence: number;
}

const EXTRACTION_PATTERNS: ExtractionPattern[] = [
  // Name extraction
  {
    pattern: /(?:tên\s+(?:tôi|em|mình|tao)\s+là|tôi\s+là|em\s+là|mình\s+là|tên\s+là)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)/i,
    category: 'personal',
    key: 'name',
    extractValue: (m) => m[1].trim(),
    confidence: 0.95,
  },
  // Province/City
  {
    pattern: /(?:ở|sống tại|đến từ|quê|nhà ở)\s+(?:tỉnh|thành phố|tp\.?)?\s*([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)/i,
    category: 'location',
    key: 'location',
    extractValue: (m) => m[1].trim(),
    confidence: 0.85,
  },
  // High school
  {
    pattern: /(?:trường|học tại|đang học)\s+(?:THPT|cấp 3|trung học)?\s*([A-ZÀ-Ỹ][\wà-ỹ]+(?:\s+[\wÀ-Ỹà-ỹ]+)*)/i,
    category: 'academic',
    key: 'high_school',
    extractValue: (m) => m[1].trim(),
    confidence: 0.8,
  },
  // Interested major
  {
    pattern: /(?:thích|quan tâm|muốn học|muốn vào|đăng ký)\s+(?:ngành|chuyên ngành|khoa)?\s*(công nghệ thông tin|cntt|cơ khí|ô tô|xây dựng|kế toán|quản trị|logistics|điện|điện tử|tự động hóa|môi trường|kinh tế)/i,
    category: 'interest',
    key: 'interested_major',
    extractValue: (m) => m[1].trim(),
    confidence: 0.85,
  },
  // Exam scores
  {
    pattern: /(?:điểm|tổng điểm|được)\s*(?:thi|tốt nghiệp|thpt)?\s*(?:là|được|:)?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:điểm)?/i,
    category: 'academic',
    key: 'exam_score',
    extractValue: (m) => m[1].replace(',', '.'),
    confidence: 0.75,
  },
  // Subject combination
  {
    pattern: /(?:tổ hợp|khối)\s*(A0{0,1}[01]?|B0{0,1}[0-9]|C0{0,1}[0-9]|D0{0,1}[0-9]|[A-D]\d{2})/i,
    category: 'academic',
    key: 'subject_combination',
    extractValue: (m) => m[1].toUpperCase().trim(),
    confidence: 0.9,
  },
  // Year of birth / age
  {
    pattern: /(?:sinh năm|năm sinh|tuổi)\s*(?:là|:)?\s*(\d{4}|\d{1,2})/i,
    category: 'personal',
    key: 'birth_year',
    extractValue: (m) => {
      const val = parseInt(m[1]);
      return val > 100 ? m[1] : `${new Date().getFullYear() - val}`; // Convert age to birth year
    },
    confidence: 0.85,
  },
  // Gender
  {
    pattern: /(?:tôi|em|mình)\s+là\s+(nam|nữ|con trai|con gái)/i,
    category: 'personal',
    key: 'gender',
    extractValue: (m) => m[1].toLowerCase().includes('nữ') || m[1].toLowerCase().includes('gái') ? 'Nữ' : 'Nam',
    confidence: 0.9,
  },
];

// Topic extraction keywords
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'điểm chuẩn': ['điểm chuẩn', 'điểm trúng', 'điểm đầu vào'],
  'ngành đào tạo': ['ngành', 'chuyên ngành', 'ngành học'],
  'học phí': ['học phí', 'chi phí', 'tiền học'],
  'xét tuyển': ['xét tuyển', 'phương thức', 'đăng ký'],
  'tổ hợp môn': ['tổ hợp', 'khối', 'tổ hợp môn'],
  'ký túc xá': ['ký túc', 'ktx', 'chỗ ở', 'nội trú'],
  'học bổng': ['học bổng', 'miễn giảm', 'hỗ trợ'],
  'cơ sở': ['cơ sở', 'campus', 'địa chỉ'],
  'hồ sơ': ['hồ sơ', 'nhập học', 'giấy tờ'],
  'thời gian': ['thời gian', 'deadline', 'mốc', 'lịch'],
  'việc làm': ['việc làm', 'nghề nghiệp', 'cơ hội', 'ra trường'],
};

// ==================== STORAGE ====================

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(LTM_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    facts: [],
    conversationSummaries: [],
    lastInteraction: Date.now(),
    totalConversations: 0,
  };
}

function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(LTM_STORAGE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==================== FACT MANAGEMENT ====================

/**
 * Add or update a fact in the user profile
 * If a fact with the same key exists, update it if the new confidence is higher
 */
export function upsertFact(
  category: MemoryFact['category'],
  key: string,
  value: string,
  confidence: number,
  conversationId?: string
): void {
  const profile = loadProfile();
  const existing = profile.facts.find(f => f.key === key && f.category === category);

  if (existing) {
    // Update if new value is different and confidence is higher
    if (existing.value !== value && confidence >= existing.confidence) {
      existing.value = value;
      existing.confidence = confidence;
      existing.updatedAt = Date.now();
      existing.sourceConversationId = conversationId;
    }
  } else {
    // Add new fact
    profile.facts.push({
      id: generateId(),
      category,
      key,
      value,
      confidence,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceConversationId: conversationId,
    });

    // Trim to max facts
    if (profile.facts.length > MAX_FACTS) {
      profile.facts.sort((a, b) => b.updatedAt - a.updatedAt);
      profile.facts = profile.facts.slice(0, MAX_FACTS);
    }
  }

  saveProfile(profile);
}

/**
 * Extract facts from a user message using pattern matching
 */
export function extractFactsFromMessage(
  message: string,
  conversationId?: string
): MemoryFact[] {
  const extracted: MemoryFact[] = [];

  for (const pattern of EXTRACTION_PATTERNS) {
    const match = message.match(pattern.pattern);
    if (match) {
      const value = pattern.extractValue(match);
      if (value && value.length > 1 && value.length < 100) {
        upsertFact(pattern.category, pattern.key, value, pattern.confidence, conversationId);
        extracted.push({
          id: generateId(),
          category: pattern.category,
          key: pattern.key,
          value,
          confidence: pattern.confidence,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sourceConversationId: conversationId,
        });
      }
    }
  }

  return extracted;
}

/**
 * Extract topics from a message
 */
export function extractTopics(message: string): string[] {
  const msg = message.toLowerCase();
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => msg.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics;
}

// ==================== CONVERSATION SUMMARIES ====================

/**
 * Add a conversation summary to long-term memory
 */
export function addConversationSummary(
  conversationId: string,
  messages: Array<{ role: string; content: string }>
): void {
  const profile = loadProfile();

  // Don't duplicate
  if (profile.conversationSummaries.some(s => s.conversationId === conversationId)) return;

  // Build summary from messages
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const allTopics = new Set<string>();
  userMessages.forEach(msg => {
    extractTopics(msg).forEach(t => allTopics.add(t));
  });

  // Create a brief summary
  const topicsList = Array.from(allTopics);
  const firstQuestion = userMessages[0]?.slice(0, 80) || '';
  const summary = `Hỏi về: ${firstQuestion}${userMessages.length > 1 ? ` (${userMessages.length} câu hỏi)` : ''}`;

  profile.conversationSummaries.push({
    conversationId,
    summary,
    topics: topicsList,
    createdAt: Date.now(),
  });

  // Trim old summaries
  if (profile.conversationSummaries.length > MAX_CONVERSATION_SUMMARIES) {
    profile.conversationSummaries = profile.conversationSummaries.slice(-MAX_CONVERSATION_SUMMARIES);
  }

  profile.totalConversations++;
  profile.lastInteraction = Date.now();
  saveProfile(profile);
}

// ==================== MEMORY CONTEXT BUILDER ====================

/**
 * Build a natural language memory context to inject into the system prompt
 */
export function buildMemoryContext(): MemoryContext {
  const profile = loadProfile();

  // Build user profile summary
  const profileParts: string[] = [];
  const factsByCategory = groupBy(profile.facts.filter(f => f.confidence >= FACT_CONFIDENCE_THRESHOLD), 'category');

  if (factsByCategory.personal?.length) {
    const personal = factsByCategory.personal;
    const name = personal.find(f => f.key === 'name')?.value;
    const gender = personal.find(f => f.key === 'gender')?.value;
    const birthYear = personal.find(f => f.key === 'birth_year')?.value;
    
    let info = '';
    if (name) info += `Tên: ${name}. `;
    if (gender) info += `Giới tính: ${gender}. `;
    if (birthYear) info += `Sinh năm: ${birthYear}. `;
    if (info) profileParts.push(`👤 Thông tin cá nhân: ${info}`);
  }

  if (factsByCategory.location?.length) {
    const loc = factsByCategory.location.find(f => f.key === 'location')?.value;
    if (loc) profileParts.push(`📍 Nơi ở: ${loc}`);
  }

  if (factsByCategory.academic?.length) {
    const academic = factsByCategory.academic;
    const school = academic.find(f => f.key === 'high_school')?.value;
    const score = academic.find(f => f.key === 'exam_score')?.value;
    const combo = academic.find(f => f.key === 'subject_combination')?.value;

    let info = '';
    if (school) info += `Trường: ${school}. `;
    if (score) info += `Điểm thi: ${score}. `;
    if (combo) info += `Tổ hợp: ${combo}. `;
    if (info) profileParts.push(`🎓 Học vấn: ${info}`);
  }

  if (factsByCategory.interest?.length) {
    const interests = factsByCategory.interest
      .filter(f => f.key === 'interested_major')
      .map(f => f.value);
    if (interests.length) {
      profileParts.push(`💡 Ngành quan tâm: ${interests.join(', ')}`);
    }
  }

  // Recent topics from conversation summaries
  const recentSummaries = profile.conversationSummaries.slice(-5);
  const recentTopics = [...new Set(recentSummaries.flatMap(s => s.topics))];

  // Conversation history summary
  let historyContext = '';
  if (recentSummaries.length > 0) {
    historyContext = recentSummaries
      .map(s => `- ${s.summary} [${s.topics.join(', ')}]`)
      .join('\n');
  }

  return {
    userProfile: profileParts.length > 0
      ? profileParts.join('\n')
      : '',
    recentTopics,
    conversationHistory: historyContext,
  };
}

/**
 * Format memory context into a string for the system prompt
 */
export function formatMemoryForPrompt(): string {
  const ctx = buildMemoryContext();

  if (!ctx.userProfile && !ctx.conversationHistory && ctx.recentTopics.length === 0) {
    return '';
  }

  let memory = '\n\n## 🧠 BỘ NHỚ NGƯỜI DÙNG (Thông tin đã biết về người này)\n\n';

  if (ctx.userProfile) {
    memory += '### Hồ sơ người dùng:\n';
    memory += ctx.userProfile + '\n\n';
    memory += '➡️ Hãy sử dụng thông tin này để CÁ NHÂN HÓA câu trả lời (ví dụ: gọi tên, gợi ý ngành phù hợp với điểm, v.v.)\n\n';
  }

  if (ctx.recentTopics.length > 0) {
    memory += `### Chủ đề đã hỏi gần đây: ${ctx.recentTopics.join(', ')}\n`;
    memory += '➡️ Tránh lặp lại thông tin đã cung cấp trước đó nếu không cần thiết.\n\n';
  }

  if (ctx.conversationHistory) {
    memory += '### Lịch sử tóm tắt:\n';
    memory += ctx.conversationHistory + '\n\n';
  }

  return memory;
}

// ==================== PUBLIC API ====================

/**
 * Get all stored facts
 */
export function getAllFacts(): MemoryFact[] {
  return loadProfile().facts;
}

/**
 * Delete a specific fact
 */
export function deleteFact(factId: string): void {
  const profile = loadProfile();
  profile.facts = profile.facts.filter(f => f.id !== factId);
  saveProfile(profile);
}

/**
 * Clear all memory
 */
export function clearAllMemory(): void {
  localStorage.removeItem(LTM_STORAGE_KEY);
}

/**
 * Get memory stats for display
 */
export function getMemoryStats(): {
  totalFacts: number;
  totalConversations: number;
  lastInteraction: number;
  categories: Record<string, number>;
} {
  const profile = loadProfile();
  const categories: Record<string, number> = {};
  profile.facts.forEach(f => {
    categories[f.category] = (categories[f.category] || 0) + 1;
  });

  return {
    totalFacts: profile.facts.length,
    totalConversations: profile.totalConversations,
    lastInteraction: profile.lastInteraction,
    categories,
  };
}

// ==================== UTILS ====================

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
