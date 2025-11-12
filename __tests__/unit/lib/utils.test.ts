import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn - Tailwind CSS class name utility', () => {
    it('複数のクラス名を結合できる', () => {
      const result = cn('px-2', 'py-1')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
    })

    it('条件付きでクラス名を追加できる', () => {
      const result = cn('px-2', true && 'py-1', false && 'hidden')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).not.toContain('hidden')
    })

    it('Tailwind CSSの競合するクラスをマージ', () => {
      const result = cn('px-2 px-4', 'py-1')
      // px-4がpx-2より優先される
      expect(result).toContain('px-4')
    })

    it('配列でクラス名を指定できる', () => {
      const result = cn(['px-2', 'py-1'])
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
    })

    it('オブジェクトで条件付きクラスを指定できる', () => {
      const result = cn({
        'px-2': true,
        'py-1': false,
      })
      expect(result).toContain('px-2')
      expect(result).not.toContain('py-1')
    })
  })
})

