
import PocketBase from 'pocketbase';
import { normalizeTitle } from '@/lib/utils/file-cleanup';
import { normalizeISBN } from '@/lib/utils/isbn';

// Use same client instance logic or new one. 
// Ideally reuse from lib/pocketbase.ts if possible, but let's follow user snippet pattern or adapt it.
// The user snippet used `new PocketBase(...)`. Let's use our singleton `pb` from `@/lib/pocketbase` to share config.
import pb from '@/lib/pocketbase';

export type DuplicateStatus = 'none' | 'duplicate_file' | 'duplicate_isbn' | 'suspected_title';

export async function checkBookDuplicate(fileHash: string, filename: string, rawIsbn?: string): Promise<DuplicateStatus> {
    const cleanTitle = normalizeTitle(filename);
    const normalizedIsbn = rawIsbn ? normalizeISBN(rawIsbn) : null;

    // 构造查询：查找哈希匹配 OR ISBN 匹配 OR 标题模糊匹配
    const safeTitle = cleanTitle.replace(/"/g, '\\"');

    // Build filter parts
    const parts = [
        `file_hash = "${fileHash}"`,
        `title ~ "${safeTitle}"`
    ];

    if (normalizedIsbn) {
        parts.push(`isbn = "${normalizedIsbn}"`);
        // We might also want to check if the DB has the raw ISBN just in case normalization failed or differed
        if (normalizedIsbn !== rawIsbn) {
            parts.push(`isbn = "${rawIsbn}"`);
        }
    }

    const filter = parts.join(' || ');

    try {
        const result = await pb.collection('books').getList(1, 1, {
            filter: filter,
            fields: 'id,slug, title, file_hash, isbn',
            requestKey: null
        });

        if (result.items.length === 0) return 'none';

        const match = result.items[0];

        // 优先级 1: 哈希完全一样 -> 绝对是重复文件
        if (match.file_hash === fileHash) {
            return 'duplicate_file';
        }

        // 优先级 2: ISBN 一样 -> 绝对是同一本书 (虽然文件可能不同)
        if (normalizedIsbn && match.isbn === normalizedIsbn) {
            return 'duplicate_isbn';
        }

        // 优先级 3: 标题类似 -> 疑似同名
        return 'suspected_title';

    } catch (err) {
        console.error("Duplicate check failed:", err);
        return 'none'; // 报错就当没重复，不阻拦用户
    }
}
