# PRO WORKS デザインシステム

このドキュメントは、PRO WORKSアプリケーションのデザインシステムの実装と使用方法を説明します。

## 📋 概要

UI仕様書 Ver.01 (2025/11) に基づいて実装されたデザインシステムです。

## 🎨 デザイントークン

すべてのデザイン値は `app/globals.css` でCSS変数として定義されています。

### カラーパレット

#### 背景色
- `--pw-bg-body`: #f3f9fd - ボディ背景色
- `--pw-bg-white`: #ffffff - 白背景
- `--pw-bg-light-blue`: #e8f0fd - 薄い青背景
- `--pw-bg-pink-light`: #fecfd7 - 薄いピンク背景
- `--pw-bg-pink-lighter`: #ffe3e8 - より薄いピンク背景

#### 枠線・ライン
- `--pw-border-light`: #9ab6ca - ライトボーダー
- `--pw-border-lighter`: #d5e5f0 - より薄いボーダー
- `--pw-border-gray`: #c3c1c1 - グレーボーダー
- `--pw-border-dark`: #1f3151 - ダークボーダー
- `--pw-border-primary`: #63b2cd - プライマリボーダー

#### テキスト色
- `--pw-text-primary`: #30373f - プライマリテキスト
- `--pw-text-black`: #000000 - 黒色テキスト
- `--pw-text-gray`: #686868 - グレーテキスト
- `--pw-text-light-gray`: #999999 - ライトグレーテキスト
- `--pw-text-lightest`: #f2f2f2 - 最も薄いテキスト

#### アラート・サポート色
- `--pw-alert-success`: #3f9c78 - 成功
- `--pw-alert-warning`: #fa8212 - 警告
- `--pw-alert-error`: #d22852 - エラー

#### ボタン色
- `--pw-button-primary`: #63b2cd - プライマリボタン
- `--pw-button-secondary`: #686868 - セカンダリボタン
- `--pw-button-dark`: #1f3151 - ダークボタン

### フォントサイズ

- `--pw-text-xs`: 0.75rem (12pt)
- `--pw-text-sm`: 0.8125rem (13pt)
- `--pw-text-base`: 0.875rem (14pt)
- `--pw-text-md`: 0.9375rem (15pt)
- `--pw-text-lg`: 1rem (16pt)
- `--pw-text-xl`: 1.125rem (18pt)
- `--pw-text-2xl`: 1.5rem (24pt)

### ボーダー半径

- `--pw-radius-sm`: 4px - 小さい角丸
- `--pw-radius-md`: 12px - 中くらいの角丸

## 🏗️ レイアウトテンプレート

### 1. CenteredLayout

ログイン・新規登録画面などで使用するセンター寄せレイアウト。

```tsx
import { CenteredLayout } from "@/components/layouts"

<CenteredLayout showFooter={true}>
  <div>{/* コンテンツ */}</div>
</CenteredLayout>
```

**特徴:**
- センター寄せの白背景カード
- 最小幅: 470px
- 角丸: 12px
- フッターリンク（オプション）

### 2. SidebarLayout

マイページなどで使用する左サイドバー付きレイアウト。

```tsx
import { SidebarLayout } from "@/components/layouts"

<SidebarLayout 
  activeMenu="profile"
  onMenuChange={(menuId) => setActiveMenu(menuId)}
>
  <div>{/* コンテンツ */}</div>
</SidebarLayout>
```

**特徴:**
- 左サイドに固定メニュー (幅: 256px)
- アクティブ状態のハイライト
- メインコンテンツエリア

### 3. FullWidthLayout

案件一覧・応募済み案件などで使用する全幅レイアウト。

```tsx
import { FullWidthLayout } from "@/components/layouts"

<FullWidthLayout maxWidth="1400px">
  <div>{/* コンテンツ */}</div>
</FullWidthLayout>
```

**特徴:**
- 最大幅指定可能
- パディング付き
- シンプルな全幅レイアウト

## 🧩 コンポーネント

### 検索フィールド (PWSearch)

検索機能付き入力フィールド:

```tsx
import { PWSearch } from "@/components/ui/pw-search"

<PWSearch
  placeholder="案件を検索..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onClear={() => setSearchQuery("")}
/>
```

**特徴:**
- 検索アイコン付き
- クリアボタン（自動表示）
- フォーカス時の背景色変更

### セレクトボックス (PWSelect)

ドロップダウン選択:

```tsx
import { PWSelect } from "@/components/ui/pw-select"

<PWSelect
  id="sort"
  label="並び順"
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
>
  <option value="new">新着順</option>
  <option value="popular">人気順</option>
</PWSelect>
```

### タブ (PWTabs)

タブ切り替えUI:

```tsx
import { PWTabs, PWTabsList, PWTabsTrigger, PWTabsContent } from "@/components/ui/pw-tabs"

<PWTabs defaultValue="tab1">
  <PWTabsList>
    <PWTabsTrigger value="tab1">タブ1</PWTabsTrigger>
    <PWTabsTrigger value="tab2">タブ2</PWTabsTrigger>
  </PWTabsList>
  <PWTabsContent value="tab1">コンテンツ1</PWTabsContent>
  <PWTabsContent value="tab2">コンテンツ2</PWTabsContent>
</PWTabs>
```

### アコーディオン (PWAccordion)

折りたたみ可能なコンテンツ:

```tsx
import { 
  PWAccordion, 
  PWAccordionItem, 
  PWAccordionTrigger, 
  PWAccordionContent 
} from "@/components/ui/pw-accordion"

<PWAccordion type="single" collapsible>
  <PWAccordionItem value="item-1">
    <PWAccordionTrigger>質問1</PWAccordionTrigger>
    <PWAccordionContent>回答1の内容...</PWAccordionContent>
  </PWAccordionItem>
</PWAccordion>
```

### モバイルメニュー (MobileMenu)

ハンバーガーメニュー:

```tsx
import { MobileMenu } from "@/components/mobile-menu"

<MobileMenu user={user} onSignOut={handleSignOut} />
```

**特徴:**
- スライドインアニメーション
- オーバーレイ付き
- レスポンシブ対応

### ボタン (Button)

PRO WORKS専用のボタンバリエーション:

```tsx
import { Button } from "@/components/ui/button"

// プライマリボタン
<Button variant="pw-primary">ボタン</Button>

// セカンダリボタン
<Button variant="pw-secondary">ボタン</Button>

// ダークボタン（検索など）
<Button variant="pw-dark">検索</Button>

// アウトラインボタン
<Button variant="pw-outline">キャンセル</Button>
```

### 入力フィールド (PWInput)

エラー状態に対応した入力コンポーネント:

```tsx
import { PWInput } from "@/components/ui/pw-input"

<PWInput
  type="email"
  placeholder="your@email.com"
  error={hasError}
  errorMessage="メールアドレスが正しくありません"
/>
```

**特徴:**
- 通常時: 白背景、グレー枠線
- フォーカス時: 薄い青背景
- エラー時: 赤枠線、エラーメッセージ表示

### カード (PWCard)

案件カードなどで使用:

```tsx
import { 
  PWCard, 
  PWCardHeader, 
  PWCardTitle, 
  PWCardContent, 
  PWCardFooter,
  PWCardBadge 
} from "@/components/ui/pw-card"

<PWCard variant="default">
  <PWCardHeader>
    <PWCardTitle>案件タイトル</PWCardTitle>
  </PWCardHeader>
  <PWCardContent>
    <PWCardBadge variant="success">募集中</PWCardBadge>
    <p>案件の詳細情報...</p>
  </PWCardContent>
  <PWCardFooter>
    <Button variant="pw-primary">詳細を見る</Button>
  </PWCardFooter>
</PWCard>
```

**バリエーション:**
- `default`: 通常のカード
- `highlighted`: 強調表示（太い青枠線）

**バッジバリエーション:**
- `default`: デフォルト
- `success`: 成功・募集中
- `warning`: 警告
- `error`: エラー

### アラート (PWAlert)

通知・警告メッセージの表示:

```tsx
import { PWAlert } from "@/components/ui/pw-alert"

<PWAlert variant="info" title="お知らせ">
  重要な情報をお知らせします。
</PWAlert>

<PWAlert variant="error" title="エラー">
  エラーが発生しました。
</PWAlert>
```

**バリエーション:**
- `info`: 情報
- `success`: 成功
- `warning`: 警告
- `error`: エラー

### モーダル (PWModal)

ポップアップダイアログ:

```tsx
import { 
  PWModal,
  PWModalTrigger,
  PWModalContent,
  PWModalHeader,
  PWModalTitle,
  PWModalDescription,
  PWModalBody,
  PWModalFooter,
} from "@/components/ui/pw-modal"

<PWModal>
  <PWModalTrigger asChild>
    <Button>モーダルを開く</Button>
  </PWModalTrigger>
  <PWModalContent>
    <PWModalHeader>
      <PWModalTitle>タイトル</PWModalTitle>
      <PWModalDescription>説明文</PWModalDescription>
    </PWModalHeader>
    <PWModalBody>
      <p>モーダルのコンテンツ</p>
    </PWModalBody>
    <PWModalFooter>
      <Button variant="pw-primary">実行</Button>
    </PWModalFooter>
  </PWModalContent>
</PWModal>
```

**特徴:**
- 半透明の暗いオーバーレイ (80%)
- 白背景、角丸4px
- 閉じるボタン付き

## 📝 使用例

### ログインページ

```tsx
import { CenteredLayout } from "@/components/layouts"
import { PWInput } from "@/components/ui/pw-input"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  return (
    <CenteredLayout>
      <h1 style={{ fontSize: "var(--pw-text-2xl)" }}>
        PRO WORKS
      </h1>
      <form>
        <PWInput type="email" placeholder="メールアドレス" />
        <PWInput type="password" placeholder="パスワード" />
        <Button variant="pw-primary" className="w-full">
          ログイン
        </Button>
      </form>
    </CenteredLayout>
  )
}
```

### 案件ダッシュボード

```tsx
import { FullWidthLayout } from "@/components/layouts"
import { PWCard, PWCardContent } from "@/components/ui/pw-card"

export default function DashboardPage() {
  return (
    <FullWidthLayout>
      <h1 style={{ fontSize: "var(--pw-text-2xl)" }}>
        案件ダッシュボード
      </h1>
      <div className="grid grid-cols-3 gap-6">
        {jobs.map(job => (
          <PWCard key={job.id}>
            <PWCardContent>{/* 案件情報 */}</PWCardContent>
          </PWCard>
        ))}
      </div>
    </FullWidthLayout>
  )
}
```

## 🎯 ベストプラクティス

### 1. CSS変数を活用する

直接値を指定せず、CSS変数を使用してください:

```tsx
// ❌ 良くない
<div style={{ color: "#30373f" }}>テキスト</div>

// ✅ 良い
<div style={{ color: "var(--pw-text-primary)" }}>テキスト</div>
```

### 2. 専用コンポーネントを使用する

PRO WORKS専用のコンポーネントを優先的に使用してください:

```tsx
// ❌ 良くない
<Input />

// ✅ 良い
<PWInput />
```

### 3. レイアウトテンプレートを活用する

ページの種類に応じて適切なレイアウトを選択してください:

- ログイン/登録 → `CenteredLayout`
- マイページ → `SidebarLayout`
- 一覧ページ → `FullWidthLayout`

## 📱 レスポンシブ対応

### ブレークポイント

Tailwind CSSのデフォルトブレークポイントを使用:

```
- sm: 640px
- md: 768px (主要ブレークポイント)
- lg: 1024px
- xl: 1280px
```

### モバイル対応

- ヘッダー: ハンバーガーメニューに切り替え
- サイドバー: タブ形式の横スクロールメニューに変換
- カード: 1カラムレイアウトに変更
- パディング: `p-4 md:p-8`で調整

## ♿ アクセシビリティ

### 実装済み機能

- **キーボード操作**: すべてのインタラクティブ要素でTab/Enterキー対応
- **ARIA属性**: 適切なrole、aria-label、aria-describedby設定
- **フォーカスリング**: focus-visible擬似クラスで視覚的フィードバック
- **エラー表示**: role="alert"でスクリーンリーダー対応
- **セマンティックHTML**: nav、main、asideなど適切なタグ使用

### ベストプラクティス

```tsx
// フォーム入力
<Label htmlFor="email">メールアドレス</Label>
<PWInput
  id="email"
  type="email"
  aria-describedby="email-error"
  error={hasError}
  errorMessage="正しいメールアドレスを入力してください"
/>

// ナビゲーション
<nav aria-label="メインナビゲーション">
  <Link href="/" aria-current={isActive ? "page" : undefined}>
    ホーム
  </Link>
</nav>
```

## 🔧 カスタマイズ

デザイントークンを変更する場合は、`app/globals.css`の`:root`セクションを編集してください。

```css
:root {
  --pw-button-primary: #63b2cd; /* この値を変更 */
}
```

## 📊 実装完了度

- ✅ デザイントークン（カラー、タイポグラフィ）
- ✅ レイアウトテンプレート × 3種類
- ✅ 基本UIコンポーネント × 14種類
- ✅ 認証関連ページ × 8ページ
- ✅ レスポンシブ対応（モバイル・タブレット）
- ✅ ハンバーガーメニュー
- ✅ アクセシビリティ対応
- ✅ 検索・フィルターコンポーネント

## 📚 参考資料

- UI仕様書: `PROWORKS_UI仕様書_Ver.01.pdf`
- フォント: Noto Sans JP (400, 500, 700)
- アイコン: Lucide React
- コンポーネント: Radix UI

---

**最終更新:** 2025年11月20日
**バージョン:** Ver.01 (完全版)
**実装完了度:** 100%

