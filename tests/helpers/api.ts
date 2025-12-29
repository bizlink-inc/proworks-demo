import { NextRequest } from "next/server"

// APIリクエストを作成するヘルパー
export const createRequest = (
  url: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
): NextRequest => {
  const { method = "GET", body, headers = {}, cookies = {} } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  }

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body)
  }

  const request = new NextRequest(`http://localhost:3000${url}`, requestInit)

  // Cookieを設定
  Object.entries(cookies).forEach(([name, value]) => {
    request.cookies.set(name, value)
  })

  return request
}

// POSTリクエストを作成
export const createPostRequest = (
  url: string,
  body: Record<string, unknown>,
  options: {
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
) => createRequest(url, { method: "POST", body, ...options })

// PATCHリクエストを作成
export const createPatchRequest = (
  url: string,
  body: Record<string, unknown>,
  options: {
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
) => createRequest(url, { method: "PATCH", body, ...options })

// DELETEリクエストを作成
export const createDeleteRequest = (
  url: string,
  options: {
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
) => createRequest(url, { method: "DELETE", ...options })

// レスポンスをパースするヘルパー
export const parseResponse = async <T = Record<string, unknown>>(
  response: Response
): Promise<{ status: number; data: T }> => {
  const status = response.status
  let data: T

  try {
    data = await response.json()
  } catch {
    data = (await response.text()) as unknown as T
  }

  return { status, data }
}

// 認証済みリクエストを作成するヘルパー
export const createAuthenticatedRequest = (
  url: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    headers?: Record<string, string>
    sessionToken?: string
  } = {}
) => {
  const { sessionToken = "test-session-token", ...restOptions } = options

  return createRequest(url, {
    ...restOptions,
    cookies: {
      "better-auth.session_token": sessionToken,
    },
  })
}
