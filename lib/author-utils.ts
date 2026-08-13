/**
 * 从书籍对象中提取作者名称
 * @param book 书籍对象
 * @param separator 多个作者之间的分隔符，默认为 ", "
 * @returns 作者名称字符串
 */
export function getAuthorName(book: any, separator: string = ', '): string {
    if (!book) return 'Unknown Author';

    // 优先使用新填充的文本字段
    if (book.authors && typeof book.authors === 'string') {
        return book.authors;
    }

    // 后备方案：兼容旧的数据结构
    if (book.expand?.author) {
        const expandedAuthors = Array.isArray(book.expand.author) ? book.expand.author : [book.expand.author];
        if (expandedAuthors.length > 0) {
            return expandedAuthors
                .map((author: any) => author.name || 'Unknown')
                .filter(Boolean)
                .join(separator);
        }
    }

    if (typeof book.author === 'string' && book.author && !isPbId(book.author)) {
        return book.author;
    }

    return 'Unknown Author';
}

function isPbId(str: any) {
    return typeof str === 'string' && str.length === 15 && /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * 获取第一个作者的名称
 * @param book 书籍对象
 * @returns 第一个作者的名称
 */
export function getFirstAuthorName(book: any): string {
    if (!book) return 'Unknown Author';

    if (book.authors && typeof book.authors === 'string') {
        return book.authors.split(',')[0].trim();
    }

    if (book.expand?.author) {
        const expandedAuthors = Array.isArray(book.expand.author) ? book.expand.author : [book.expand.author];
        if (expandedAuthors.length > 0) {
            return expandedAuthors[0].name || 'Unknown Author';
        }
    }

    if (typeof book.author === 'string' && book.author && !isPbId(book.author)) {
        return book.author.split(',')[0].trim();
    }

    return 'Unknown Author';
}
