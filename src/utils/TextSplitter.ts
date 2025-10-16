/**
 * 文本拆分器
 */

export interface TextSegment {
  /** 段落索引，从0开始 */
  index: number;
  /** 此段的文本内容 */
  content: string;
  /** 文本长度（字符数） */
  length: number;
  /** 是否已加载对应音频 */
  isLoaded: boolean;
  /** 音频文件路径（预加载后可用） */
  audioPath?: string;
}

export class TextSplitter {
  private maxChars: number;

  constructor(maxChars: number = 300) {
    this.maxChars = maxChars;
  }

  /**
   * 分割文本为段落
   * @param content 原始文本内容
   * @returns 分割后的段落数组
   */
  split(content: string): TextSegment[] {
    // 1. 统一标点符号（中文转英文）
    const normalizedText = this.normalizePunctuation(content);

    // 2. 按句子结束符分割
    const sentences = this.splitBySentenceEndings(normalizedText);

    // 3. 过滤无意义内容
    const filteredSentences = this.filterMeaningless(sentences);

    // 4. 根据最大字符数合并
    const paragraphs = this.groupByMaxChars(filteredSentences);

    // 5. 转换为 TextSegment 格式
    return paragraphs.map((content, index) => ({
      index,
      content,
      length: content.length,
      isLoaded: false
    }));
  }

  /**
   * 将中文标点符号转换为英文标点符号
   */
  private normalizePunctuation(text: string): string {
    const punctuationMap: { [key: string]: string } = {
      '。': '.',
      '！': '!',
      '？': '?',
      '，': ',',
      '、': ',',
      '；': ';',
      '：': ':',
      '\u201C': '"',  // "
      '\u201D': '"',  // "
      '\u2018': "'",  // '
      '\u2019': "'",  // '
      '（': '(',
      '）': ')',
      '《': '<',
      '》': '>',
      '【': '[',
      '】': ']',
      '…': '...',
      '—': '-',
      '～': '~'
    };

    let result = text;
    for (const [chinese, english] of Object.entries(punctuationMap)) {
      result = result.split(chinese).join(english);
    }

    return result;
  }

  /**
   * 根据句子结束标点符号分割文本
   */
  private splitBySentenceEndings(text: string): string[] {
    // 句子结束标记正则表达式
    const sentenceEndings = /([.!?;]+)/g;

    // 分割并保留标点符号
    const parts = text.split(sentenceEndings);
    const sentences: string[] = [];

    for (let i = 0; i < parts.length; i += 2) {
      const content = parts[i];
      const punctuation = parts[i + 1] || '';

      if (content.trim()) {
        sentences.push((content + punctuation).trim());
      }
    }

    return sentences;
  }

  /**
   * 过滤无意义的内容
   */
  private filterMeaningless(sentences: string[]): string[] {
    return sentences.filter(sentence => {
      // 移除空字符串
      if (!sentence.trim()) {
        return false;
      }

      // 移除只包含标点符号的句子
      if (/^[.,!?;:\s\-]+$/.test(sentence)) {
        return false;
      }

      // 移除长度太短的句子（小于3个字符）
      if (sentence.trim().length < 3) {
        return false;
      }

      return true;
    });
  }

  /**
   * 根据最大字符数合并句子
   */
  private groupByMaxChars(sentences: string[]): string[] {
    const paragraphs: string[] = [];
    let currentParagraph = '';

    for (const sentence of sentences) {
      // 如果单个句子就超过最大长度，单独成段
      if (sentence.length > this.maxChars) {
        if (currentParagraph) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
        paragraphs.push(sentence.trim());
        continue;
      }

      // 如果添加当前句子不会超过最大长度，则添加
      if (currentParagraph.length + sentence.length <= this.maxChars) {
        currentParagraph += sentence;
      } else {
        // 否则，保存当前段落，开始新段落
        if (currentParagraph) {
          paragraphs.push(currentParagraph.trim());
        }
        currentParagraph = sentence;
      }
    }

    // 添加最后一个段落
    if (currentParagraph) {
      paragraphs.push(currentParagraph.trim());
    }

    return paragraphs;
  }

  /**
   * 设置最大字符数
   */
  setMaxChars(maxChars: number): void {
    this.maxChars = maxChars;
  }

  /**
   * 获取当前最大字符数
   */
  getMaxChars(): number {
    return this.maxChars;
  }
}

