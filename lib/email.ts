/**
 * メール送信ユーティリティ（SendGrid版）
 * 
 * - 開発環境: コンソールに出力
 * - 本番環境: SendGrid を使用して実際にメールを送信
 * 
 * @see docs/SENDGRID_ARCHITECTURE.md - アーキテクチャ詳細
 */
import sgMail from "@sendgrid/mail";

// 環境判定
const isDevelopment = process.env.NODE_ENV === "development";

// SendGrid クライアント初期化（本番環境のみ）
if (!isDevelopment && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// 送信元メールアドレス（SendGrid で認証済みのドメインのアドレス）
const FROM_EMAIL = process.env.EMAIL_FROM || "PRO WORKS <noreply@proworks.jp>";

// メール送信結果の型
type SendEmailResult = {
  success: boolean;
  error?: string;
};

/**
 * メールアドレス確認メールを送信
 */
export const sendVerificationEmail = async (
  to: string,
  verificationUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】メールアドレスの確認";
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #30373f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f3f9fd; padding: 30px; border-radius: 8px;">
    <h1 style="color: #1f3151; font-size: 24px; margin-bottom: 20px;">PRO WORKS</h1>
    
    <p style="margin-bottom: 20px;">PRO WORKS へのご登録ありがとうございます。</p>
    
    <p style="margin-bottom: 20px;">以下のボタンをクリックして、メールアドレスの確認を完了してください。</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        メールアドレスを確認する
      </a>
    </div>
    
    <p style="color: #686868; font-size: 14px; margin-bottom: 10px;">
      ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：
    </p>
    <p style="color: #63b2cd; font-size: 12px; word-break: break-all;">
      ${verificationUrl}
    </p>
    
    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">
    
    <p style="color: #686868; font-size: 12px;">
      ※ このリンクの有効期限は1時間です。<br>
      ※ このメールに心当たりがない場合は、削除してください。
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
PRO WORKS へのご登録ありがとうございます。

以下のリンクをクリックして、メールアドレスの確認を完了してください。

▶ ${verificationUrl}

※ このリンクの有効期限は1時間です。
※ このメールに心当たりがない場合は、削除してください。
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * パスワードリセットメールを送信
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】パスワードのリセット";
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #30373f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f3f9fd; padding: 30px; border-radius: 8px;">
    <h1 style="color: #1f3151; font-size: 24px; margin-bottom: 20px;">PRO WORKS</h1>
    
    <p style="margin-bottom: 20px;">パスワードリセットのリクエストを受け付けました。</p>
    
    <p style="margin-bottom: 20px;">以下のボタンをクリックして、新しいパスワードを設定してください。</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        パスワードをリセットする
      </a>
    </div>
    
    <p style="color: #686868; font-size: 14px; margin-bottom: 10px;">
      ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：
    </p>
    <p style="color: #63b2cd; font-size: 12px; word-break: break-all;">
      ${resetUrl}
    </p>
    
    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">
    
    <p style="color: #686868; font-size: 12px;">
      ※ このリンクの有効期限は1時間です。<br>
      ※ このリクエストに心当たりがない場合は、このメールを無視してください。パスワードは変更されません。
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください。

▶ ${resetUrl}

※ このリンクの有効期限は1時間です。
※ このリクエストに心当たりがない場合は、このメールを無視してください。パスワードは変更されません。
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * メールアドレス変更確認メールを送信
 */
export const sendEmailChangeVerificationEmail = async (
  to: string,
  verificationUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】メールアドレス変更の確認";
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #30373f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f3f9fd; padding: 30px; border-radius: 8px;">
    <h1 style="color: #1f3151; font-size: 24px; margin-bottom: 20px;">PRO WORKS</h1>
    
    <p style="margin-bottom: 20px;">メールアドレス変更のリクエストを受け付けました。</p>
    
    <p style="margin-bottom: 20px;">以下のボタンをクリックして、新しいメールアドレスを確認してください。</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        メールアドレスを確認する
      </a>
    </div>
    
    <p style="color: #686868; font-size: 14px; margin-bottom: 10px;">
      ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：
    </p>
    <p style="color: #63b2cd; font-size: 12px; word-break: break-all;">
      ${verificationUrl}
    </p>
    
    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">
    
    <p style="color: #686868; font-size: 12px;">
      ※ このリンクの有効期限は1時間です。<br>
      ※ このリクエストに心当たりがない場合は、このメールを無視してください。メールアドレスは変更されません。
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
メールアドレス変更のリクエストを受け付けました。

以下のリンクをクリックして、新しいメールアドレスを確認してください。

▶ ${verificationUrl}

※ このリンクの有効期限は1時間です。
※ このリクエストに心当たりがない場合は、このメールを無視してください。メールアドレスは変更されません。
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * 汎用メール送信関数
 * 開発環境ではコンソール出力、本番環境では SendGrid で送信
 */
type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const sendEmail = async ({ to, subject, html, text }: SendEmailParams): Promise<SendEmailResult> => {
  // 開発環境: コンソールに出力
  if (isDevelopment) {
    console.log("\n" + "=".repeat(80));
    console.log(`📧 ${subject}`);
    console.log("=".repeat(80));
    console.log(`宛先: ${to}`);
    console.log("");
    console.log(text.trim());
    console.log("=".repeat(80) + "\n");
    return { success: true };
  }

  // 本番環境: SendGrid で送信
  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ SendGrid API キーが設定されていません。SENDGRID_API_KEY を確認してください。");
    return { success: false, error: "メール送信サービスが設定されていません" };
  }

  try {
    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      text,
      html,
    };

    await sgMail.send(msg);

    console.log(`✅ メール送信成功: ${to} - ${subject}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ SendGrid メール送信エラー:", error);
    
    // SendGrid エラーの詳細をログ出力
    if (error && typeof error === "object" && "response" in error) {
      const sgError = error as { response?: { body?: unknown } };
      console.error("SendGrid エラー詳細:", sgError.response?.body);
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : "メール送信に失敗しました" 
    };
  }
};

/**
 * コンソール出力用のヘルパー関数（開発環境専用）
 * Better Auth のコールバックから呼び出される
 */
export const logEmailToConsole = (
  type: "verification" | "reset" | "email-change",
  to: string,
  url: string
): void => {
  const titles: Record<typeof type, string> = {
    verification: "📧 【PRO WORKS】メールアドレスの確認",
    reset: "🔑 【PRO WORKS】パスワードリセット",
    "email-change": "📧 【PRO WORKS】メールアドレス変更の確認",
  };

  console.log("\n" + "=".repeat(80));
  console.log(titles[type]);
  console.log("=".repeat(80));
  console.log(`宛先: ${to}`);
  console.log("");
  console.log("以下のリンクをクリックして、操作を完了してください。");
  console.log("");
  console.log(`▶ ${url}`);
  console.log("");
  console.log("※ このリンクの有効期限は1時間です。");
  console.log("=".repeat(80) + "\n");
};
