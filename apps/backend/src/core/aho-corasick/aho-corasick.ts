export class TrieNode {
    children: Map<string, TrieNode> = new Map();
    failure: TrieNode | null = null;
    output: string[] = []; // chứa ma SKU nếu đây là điểm kết thúc từ khóa
}
export class AhoCorasick {
    private root: TrieNode = new TrieNode();

    constructor(keywords: string[]) {
        this.buildTrie(keywords);
        this.buildFailureLinks();
    }
    //1.dựng cây Trie từ danh sách SKU
    private buildTrie(keywords: string[]) {
        for (const keyword of keywords) {
            if (!keyword) continue;
            const normalized = keyword.trim().toUpperCase();
            let node = this.root;

            for (const char of normalized) {
                if (!node.children.has(char)) {
                    node.children.set(char, new TrieNode());

                }
                node = node.children.get(char)!;
            }
            node.output.push(normalized);
        }
    }

    // 2. Dựng các Failure Links (liên kết khi không khớp ) bằng BFS
    private buildFailureLinks() {
        const queue: TrieNode[] = [];

        //Nút gốc (Root) có failure link trỏ về null, các con của Root có failure link trỏ về Root
        for (const [, child] of this.root.children) {
            child.failure = this.root;
            queue.push(child);

        }
        while (queue.length > 0) {
            const current = queue.shift()!;
            for (const [char, child] of current.children) {
                let fallback = current.failure;
                while (fallback !== null && !fallback.children.has(char)) {
                    fallback = fallback.failure;
                }
                child.failure = fallback ? fallback.children.get(char)! : this.root;
                child.output = [...child.output, ...child.failure.output];
                queue.push(child);
            }
        }
    }
    // 3. Tìm kiếm tất cả các SKU có trong Comment (<1ms)
    public search(text: string): string[] {
        if (!text) return [];
        const normalizedText = text.toUpperCase();
        let current = this.root;
        const results = new Set<string>();

        for (let i = 0; i < normalizedText.length; i++) {
            const char = normalizedText[i];

            // Nếu nút hiện tại không có đường đi theo ký tự char, nhảy qua failure link
            while (current !== this.root && !current.children.has(char)) {
                current = current.failure || this.root;
            }

            // Nếu tìm thấy nút con tương ứng với char, di chuyển sang nút đó
            if (current.children.has(char)) {
                current = current.children.get(char)!;
            }

            // Ghi nhận tất cả SKU khớp tại nút hiện tại
            for (const matchedSku of current.output) {
                results.add(matchedSku);
            }
        }
        return Array.from(results);
    }




}