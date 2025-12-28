'use client'

import { useState, useCallback } from 'react'

type Address = {
  prefecture: string  // 都道府県
  city: string        // 市区町村
  town: string        // 町域
  fullAddress: string // 結合した住所
}

type UsePostalCodeResult = {
  fetchAddress: (postalCode: string) => Promise<Address | null>
  isLoading: boolean
  error: string | null
}

export const usePostalCode = (): UsePostalCodeResult => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAddress = useCallback(async (postalCode: string): Promise<Address | null> => {
    // ハイフンを除去し、7桁かどうかチェック
    const cleanCode = postalCode.replace(/-/g, '')
    if (cleanCode.length !== 7 || !/^\d+$/.test(cleanCode)) {
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanCode}`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        return {
          prefecture: result.address1,
          city: result.address2,
          town: result.address3,
          fullAddress: `${result.address1}${result.address2}${result.address3}`
        }
      } else {
        setError('住所が見つかりませんでした')
        return null
      }
    } catch {
      setError('住所の取得に失敗しました')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { fetchAddress, isLoading, error }
}
