/**
 * 字符串池 - 用于去重字符串，减少内存占用
 *
 * 对于大量重复的字符串（如节点名称、时间戳等），
 * 使用字符串池可以确保相同的字符串只在内存中存储一次
 */
export class StringPool {
  private pool = new Map<string, string>()

  /**
   * 字符串驻留 - 返回池中的字符串引用
   * 如果字符串不存在，则添加到池中
   */
  intern(str: string | undefined | null): string {
    if (str === undefined || str === null) {
      return ''
    }

    if (!this.pool.has(str)) {
      this.pool.set(str, str)
    }
    return this.pool.get(str)!
  }

  /**
   * 清空字符串池
   */
  clear(): void {
    this.pool.clear()
  }

  /**
   * 获取池中字符串数量
   */
  size(): number {
    return this.pool.size
  }
}
