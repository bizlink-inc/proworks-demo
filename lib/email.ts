/**
 * メール送信ユーティリティ（Amazon SES版）
 * 
 * - 開発環境: コンソールに出力
 * - 本番環境: Amazon SES を使用して実際にメールを送信
 * 
 * @see docs/02_インフラ・アーキテクチャ/AmazonSES_アーキテクチャ.md - アーキテクチャ詳細
 */
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// 環境判定（動的に評価するため関数化）
const isDevelopment = () => process.env.NODE_ENV === "development";

// SES クライアント（遅延初期化）
let sesClient: SESClient | null = null;

const getSESClient = (): SESClient | null => {
  if (isDevelopment()) {
    return null;
  }
  if (!sesClient) {
    sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || "ap-northeast-1",
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      } : undefined, // IAMロールを使用する場合はundefined
    });
  }
  return sesClient;
};

// 送信元メールアドレス
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
  const subject = "【PRO WORKS】ご登録ありがとうございます - メールアドレスの確認";

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

    <p style="margin-bottom: 20px; font-size: 18px; font-weight: bold; color: #1f3151;">
      ご登録ありがとうございます！
    </p>

    <p style="margin-bottom: 20px;">
      PRO WORKS へようこそ！<br>
      ご入力いただいたメールアドレス宛に確認メールを送信しました。
    </p>

    <p style="margin-bottom: 20px;">
      以下のボタンをクリックして、メールアドレスの確認を完了してください。
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}"
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        メールアドレスを確認する
      </a>
    </div>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #63b2cd;">
      <p style="margin: 0; font-weight: bold; color: #1f3151;">📝 次のステップ</p>
      <p style="margin: 10px 0 0 0; color: #686868;">
        メール確認後、マイページからプロフィールをご記入ください。<br>
        プロフィールを充実させることで、より良い案件とマッチングできます！
      </p>
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

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <p style="color: #686868; font-size: 12px; text-align: center;">
      PRO WORKS 運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ご登録ありがとうございます！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRO WORKS へようこそ！
ご入力いただいたメールアドレス宛に確認メールを送信しました。

以下のリンクをクリックして、メールアドレスの確認を完了してください。

▶ ${verificationUrl}

────────────────────────────────────
📝 次のステップ
────────────────────────────────────
メール確認後、マイページからプロフィールをご記入ください。
プロフィールを充実させることで、より良い案件とマッチングできます！

────────────────────────────────────
※ このリンクの有効期限は1時間です。
※ このメールに心当たりがない場合は、削除してください。

PRO WORKS 運営チーム/株式会社アルマ
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
 * 開発環境ではコンソール出力、本番環境では Amazon SES で送信
 */
type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const sendEmail = async ({ to, subject, html, text }: SendEmailParams): Promise<SendEmailResult> => {
  // 開発環境: コンソールに出力
  if (isDevelopment()) {
    console.log("\n" + "=".repeat(80));
    console.log(`📧 ${subject}`);
    console.log("=".repeat(80));
    console.log(`宛先: ${to}`);
    console.log("");
    console.log(text.trim());
    console.log("=".repeat(80) + "\n");
    return { success: true };
  }

  // 本番環境: Amazon SES で送信
  const client = getSESClient();
  if (!client) {
    console.error("❌ Amazon SES クライアントが初期化されていません");
    return { success: false, error: "メール送信サービスが設定されていません" };
  }

  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
          Text: {
            Data: text,
            Charset: "UTF-8",
          },
        },
      },
    });

    await client.send(command);

    console.log(`✅ メール送信成功: ${to} - ${subject}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ Amazon SES メール送信エラー:", error);
    
    // エラー詳細をログ出力
    if (error && typeof error === "object") {
      console.error("SES エラー詳細:", JSON.stringify(error, null, 2));
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : "メール送信に失敗しました" 
    };
  }
};

/**
 * お問い合わせ受付確認メールを送信
 */
export const sendContactConfirmationEmail = async (
  to: string,
  userName: string,
  inquiryContent: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】お問い合わせを受け付けました";

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

    <p style="margin-bottom: 20px;">${userName} 様</p>

    <p style="margin-bottom: 20px;">お問い合わせいただき、ありがとうございます。<br>内容を確認のうえ、担当より順次ご連絡させていただきます。</p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #1f3151;">▼お問い合わせ内容</p>
      <p style="margin: 0; white-space: pre-wrap;">${inquiryContent}</p>
    </div>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      【ご注意】<br>
      本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <p style="color: #686868; font-size: 12px; text-align: center;">
      PRO WORKS 運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName} 様

お問い合わせいただき、ありがとうございます。
内容を確認のうえ、担当より順次ご連絡させていただきます。

▼お問い合わせ内容
${inquiryContent}

————————————————————
【ご注意】
本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
————————————————————
PRO WORKS 運営チーム/株式会社アルマ
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * 退会完了メールを送信
 */
export const sendWithdrawalCompletionEmail = async (
  to: string,
  userName: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】退会手続き完了のお知らせ";

  const now = new Date();
  const withdrawalDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

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

    <p style="margin-bottom: 20px;">${userName} 様</p>

    <p style="margin-bottom: 20px;">このたびは、PRO WORKS サービスをご利用いただきありがとうございました。<br>以下の通り、退会手続きが完了いたしました。</p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>退会日時：</strong>${withdrawalDate}</p>
      <p style="margin: 0;"><strong>対象アカウント：</strong>${to}</p>
    </div>

    <p style="margin-bottom: 20px; color: #686868;">
      退会後は、アカウント情報・応募履歴などは削除され、復元することはできません。
    </p>

    <p style="margin-bottom: 20px;">
      これまでのご利用、誠にありがとうございました。<br>
      またのご利用を心よりお待ちしております。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      ※本メールは退会完了の確認のために送信しています。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <p style="color: #686868; font-size: 12px; text-align: center;">
      PRO WORKS 運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName} 様

このたびは、PRO WORKS サービスをご利用いただきありがとうございました。
以下の通り、退会手続きが完了いたしました。

————————————————————
退会日時：${withdrawalDate}
対象アカウント：${to}
————————————————————

退会後は、アカウント情報・応募履歴などは削除され、復元することはできません。

これまでのご利用、誠にありがとうございました。
またのご利用を心よりお待ちしております。

※本メールは退会完了の確認のために送信しています。

————————————————————
PRO WORKS 運営チーム/株式会社アルマ
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * 会員登録完了メールを送信（プロフィール完成時）
 */
export const sendRegistrationCompleteEmail = async (
  to: string,
  userName: string,
  baseUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】会員登録ありがとうございます";

  const myPageUrl = `${baseUrl}/me`;
  const helpfulInfoUrl = `${baseUrl}/media`;
  const contactUrl = `${baseUrl}/me?tab=contact`;
  const homeUrl = baseUrl;

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

    <p style="margin-bottom: 20px;">${userName} 様</p>

    <p style="margin-bottom: 20px;">
      この度は、【PRO WORKS】にご登録いただき、誠にありがとうございます。
    </p>

    <p style="margin-bottom: 20px;">
      ご自身のスキルやご経験をプロフィールに記載いただくことで、<br>
      案件応募や案件紹介、AIマッチング機能が利用できるようになります。
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #63b2cd;">
      <p style="margin: 0; font-weight: bold; color: #1f3151;">プロフィールを充実させましょう</p>
      <p style="margin: 10px 0 0 0; color: #686868; font-size: 14px;">
        以下の項目を追加すると、より良い案件とマッチングしやすくなります：
      </p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #686868; font-size: 14px;">
        <li>職務経歴・スキルシート</li>
        <li>保有資格・得意分野</li>
        <li>自己PR・ポートフォリオ</li>
      </ul>
    </div>

    <p style="margin-bottom: 20px;">以下のリンクより、プロフィールの充実をお願いいたします。</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${myPageUrl}"
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        マイページはこちら
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      【ご注意】<br>
      本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <div style="font-size: 12px; color: #686868;">
      <p style="margin: 5px 0;">▽お役立ち情報: <a href="${helpfulInfoUrl}" style="color: #63b2cd;">${helpfulInfoUrl}</a></p>
      <p style="margin: 5px 0;">▽お問い合わせ先: <a href="${contactUrl}" style="color: #63b2cd;">${contactUrl}</a></p>
      <p style="margin: 5px 0;">▽PRO WORKS: <a href="${homeUrl}" style="color: #63b2cd;">${homeUrl}</a></p>
    </div>

    <p style="color: #686868; font-size: 12px; text-align: center; margin-top: 20px;">
      PRO WORKS 運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName} 様

この度は、【PRO WORKS】にご登録いただき、誠にありがとうございます。

ご自身のスキルやご経験をプロフィールに記載いただくことで、
案件応募や案件紹介、AIマッチング機能が利用できるようになります。

────────────────────────────────────
■ プロフィールを充実させましょう
────────────────────────────────────
以下の項目を追加すると、より良い案件とマッチングしやすくなります：
・職務経歴・スキルシート
・保有資格・得意分野
・自己PR・ポートフォリオ

以下のリンクより、プロフィールの充実をお願いいたします。

▼マイページはこちら
${myPageUrl}

————————————————————
【ご注意】
本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
————————————————————

▽お役立ち情報
${helpfulInfoUrl}

▽お問い合わせ先
${contactUrl}

▽PRO WORKS
${homeUrl}

PRO WORKS 運営チーム/株式会社アルマ
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * 担当者おすすめ通知メールを送信
 */
export const sendStaffRecommendNotificationEmail = async (
  to: string,
  userName: string,
  jobTitle: string,
  jobUrl: string,
  baseUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】担当者からあなたにおすすめの案件があります";

  const myPageUrl = `${baseUrl}/me`;
  const contactUrl = `${baseUrl}/me?tab=contact`;
  const homeUrl = baseUrl;

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

    <p style="margin-bottom: 20px;">${userName} 様</p>

    <p style="margin-bottom: 20px;">
      担当者があなたのスキル・経験にマッチする案件をおすすめしています。
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #63b2cd;">
      <p style="margin: 0; font-weight: bold; color: #1f3151;">おすすめ案件</p>
      <p style="margin: 10px 0 0 0; color: #30373f; font-size: 16px;">
        ${jobTitle}
      </p>
    </div>

    <p style="margin-bottom: 20px;">以下のリンクより、案件の詳細をご確認ください。</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${jobUrl}"
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        案件詳細を見る
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      【ご注意】<br>
      本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <div style="font-size: 12px; color: #686868;">
      <p style="margin: 5px 0;">▽マイページ: <a href="${myPageUrl}" style="color: #63b2cd;">${myPageUrl}</a></p>
      <p style="margin: 5px 0;">▽お問い合わせ先: <a href="${contactUrl}" style="color: #63b2cd;">${contactUrl}</a></p>
      <p style="margin: 5px 0;">▽PRO WORKS: <a href="${homeUrl}" style="color: #63b2cd;">${homeUrl}</a></p>
    </div>

    <p style="color: #686868; font-size: 12px; text-align: center; margin-top: 20px;">
      PRO WORKS 運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName} 様

担当者があなたのスキル・経験にマッチする案件をおすすめしています。

────────────────────────────────────
■ おすすめ案件
────────────────────────────────────
${jobTitle}

▼案件詳細はこちら
${jobUrl}

————————————————————
【ご注意】
本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
————————————————————

▽マイページ
${myPageUrl}

▽お問い合わせ先
${contactUrl}

▽PRO WORKS
${homeUrl}

PRO WORKS 運営チーム/株式会社アルマ
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * パスワード変更完了通知メールを送信
 */
export const sendPasswordChangedNotificationEmail = async (
  to: string,
  userName: string,
  baseUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】パスワード変更のお知らせ";

  const loginUrl = `${baseUrl}/login`;
  const helpfulInfoUrl = `${baseUrl}/media`;
  const contactUrl = `${baseUrl}/me?tab=contact`;
  const homeUrl = baseUrl;

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

    <p style="margin-bottom: 20px;">${userName} 様</p>

    <p style="margin-bottom: 20px;">いつもPRO WORKSをご利用いただき、誠にありがとうございます。</p>

    <p style="margin-bottom: 20px;">
      パスワードの変更が正常に完了しました。<br>
      以下のリンクより、再度ログインをお願いいたします。
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}"
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ログインはこちら
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      【ご注意】<br>
      本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <div style="font-size: 12px; color: #686868;">
      <p style="margin: 5px 0;">▽お役立ち情報: <a href="${helpfulInfoUrl}" style="color: #63b2cd;">${helpfulInfoUrl}</a></p>
      <p style="margin: 5px 0;">▽お問い合わせ先: <a href="${contactUrl}" style="color: #63b2cd;">${contactUrl}</a></p>
      <p style="margin: 5px 0;">▽PRO WORKS: <a href="${homeUrl}" style="color: #63b2cd;">${homeUrl}</a></p>
    </div>

    <p style="color: #686868; font-size: 12px; text-align: center; margin-top: 20px;">
      PRO WORKS 運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName} 様

いつもPRO WORKSをご利用いただき、誠にありがとうございます。

パスワードの変更が正常に完了しました。
以下のリンクより、再度ログインをお願いいたします。

▼ログインはこちら
${loginUrl}

————————————————————
【ご注意】
本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
————————————————————

▽お役立ち情報
${helpfulInfoUrl}

▽お問い合わせ先
${contactUrl}

▽PRO WORKS
${homeUrl}

PRO WORKS 運営チーム/株式会社アルマ
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * 案件応募完了メールを送信
 */
export const sendApplicationCompleteEmail = async (
  to: string,
  userName: string,
  baseUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PROWORKS】案件応募が完了しました";

  const applicationsUrl = `${baseUrl}/applications`;
  const helpfulInfoUrl = `${baseUrl}/media`;
  const contactUrl = `${baseUrl}/me?tab=contact`;
  const homeUrl = baseUrl;

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

    <p style="margin-bottom: 20px;">${userName}様</p>

    <p style="margin-bottom: 20px;">いつもPRO WORKSをご利用いただき、誠にありがとうございます。</p>

    <p style="margin-bottom: 20px;">以下の案件への応募が完了しました。</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${applicationsUrl}"
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ▼応募済み案件を見る
      </a>
    </div>

    <p style="margin-bottom: 20px;">
      進捗状況は応募済み一覧のステータスよりご確認いただけます。<br>
      面談や連絡等がある場合は、別途ご連絡いたします。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      【ご注意】<br>
      本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。<br>
      ※募集が終了しますと、案件の詳細情報が閲覧できなくなります。何卒ご容赦ください。<br>
      ※複数の方からエントリーいただいた場合は当社にて選考させていただきます。ご了承ください。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <div style="font-size: 12px; color: #686868;">
      <p style="margin: 5px 0;">▽お役立ち情報: <a href="${helpfulInfoUrl}" style="color: #63b2cd;">${helpfulInfoUrl}</a></p>
      <p style="margin: 5px 0;">▽お問い合わせ先: <a href="${contactUrl}" style="color: #63b2cd;">${contactUrl}</a></p>
      <p style="margin: 5px 0;">▽PRO WORKS: <a href="${homeUrl}" style="color: #63b2cd;">${homeUrl}</a></p>
    </div>

    <p style="color: #686868; font-size: 12px; text-align: center; margin-top: 20px;">
      PRO WORKS運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName}様

いつもPRO WORKSをご利用いただき、誠にありがとうございます。

以下の案件への応募が完了しました。

▼応募済み案件を見る
${applicationsUrl}

進捗状況は応募済み一覧のステータスよりご確認いただけます。
面談や連絡等がある場合は、別途ご連絡いたします。

――――――――――――――――――
【ご注意】
本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
※募集が終了しますと、案件の詳細情報が閲覧できなくなります。何卒ご容赦ください。
※複数の方からエントリーいただいた場合は当社にて選考させていただきます。ご了承ください。
――――――――――――――――――

▽お役立ち情報
${helpfulInfoUrl}

▽お問い合わせ先
${contactUrl}

▽PRO WORKS
${homeUrl}

PRO WORKS運営チーム/株式会社アルマ
――――
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * AIマッチ通知メールを送信
 */
export const sendAIMatchNotificationEmail = async (
  to: string,
  userName: string,
  jobTitle: string,
  jobUrl: string,
  baseUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PRO WORKS】あなたのスキルにマッチする案件が見つかりました";

  const myPageUrl = `${baseUrl}/me`;
  const contactUrl = `${baseUrl}/me?tab=contact`;
  const homeUrl = baseUrl;

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

    <p style="margin-bottom: 20px;">${userName} 様</p>

    <p style="margin-bottom: 20px;">
      AIがあなたのスキル・経験を分析し、マッチする案件を見つけました。
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #63b2cd;">
      <p style="margin: 0; font-weight: bold; color: #1f3151;">AIマッチ案件</p>
      <p style="margin: 10px 0 0 0; color: #30373f; font-size: 16px;">
        ${jobTitle}
      </p>
    </div>

    <p style="margin-bottom: 20px;">以下のリンクより、案件の詳細をご確認ください。</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${jobUrl}"
         style="display: inline-block; background-color: #63b2cd; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        案件詳細を見る
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      【ご注意】<br>
      本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <div style="font-size: 12px; color: #686868;">
      <p style="margin: 5px 0;">▽マイページ: <a href="${myPageUrl}" style="color: #63b2cd;">${myPageUrl}</a></p>
      <p style="margin: 5px 0;">▽お問い合わせ先: <a href="${contactUrl}" style="color: #63b2cd;">${contactUrl}</a></p>
      <p style="margin: 5px 0;">▽PRO WORKS: <a href="${homeUrl}" style="color: #63b2cd;">${homeUrl}</a></p>
    </div>

    <p style="color: #686868; font-size: 12px; text-align: center; margin-top: 20px;">
      PRO WORKS 運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName} 様

AIがあなたのスキル・経験を分析し、マッチする案件を見つけました。

────────────────────────────────────
■ AIマッチ案件
────────────────────────────────────
${jobTitle}

▼案件詳細はこちら
${jobUrl}

————————————————————
【ご注意】
本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
————————————————————

▽マイページ
${myPageUrl}

▽お問い合わせ先
${contactUrl}

▽PRO WORKS
${homeUrl}

PRO WORKS 運営チーム/株式会社アルマ
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

/**
 * 面談予定確定メールを送信
 */
export const sendInterviewConfirmedEmail = async (
  to: string,
  userName: string,
  jobTitle: string,
  baseUrl: string
): Promise<SendEmailResult> => {
  const subject = "【PROWORKS】面談予定が確定しました";

  const applicationsUrl = `${baseUrl}/applications`;
  const helpfulInfoUrl = `${baseUrl}/media`;
  const contactUrl = `${baseUrl}/me?tab=contact`;
  const homeUrl = baseUrl;

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

    <p style="margin-bottom: 20px;">${userName}様</p>

    <p style="margin-bottom: 20px;">いつもPRO WORKSをご利用いただき、誠にありがとうございます。</p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #63b2cd;">
      <p style="margin: 0; font-weight: bold; color: #1f3151;">面談予定確定案件</p>
      <p style="margin: 10px 0 0 0; color: #30373f; font-size: 16px;">
        ${jobTitle}
      </p>
    </div>

    <p style="margin-bottom: 20px;">
      について、面談予定が確定しました。
    </p>

    <p style="margin-bottom: 20px;">
      PRO WORKS営業担当より、面談日程について別途ご連絡させていただきますのでご対応よろしくお願いいたします。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 30px 0;">

    <p style="color: #686868; font-size: 12px;">
      【ご注意】<br>
      本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。<br>
      ※ご連絡が取れない場合、面談を組むことができないため取消させていただくことがございます。ご了承ください。
    </p>

    <hr style="border: none; border-top: 1px solid #d5e5f0; margin: 20px 0;">

    <div style="font-size: 12px; color: #686868;">
      <p style="margin: 5px 0;">▽お役立ち情報: <a href="${helpfulInfoUrl}" style="color: #63b2cd;">${helpfulInfoUrl}</a></p>
      <p style="margin: 5px 0;">▽お問い合わせ先: <a href="${contactUrl}" style="color: #63b2cd;">${contactUrl}</a></p>
      <p style="margin: 5px 0;">▽PRO WORKS: <a href="${homeUrl}" style="color: #63b2cd;">${homeUrl}</a></p>
    </div>

    <p style="color: #686868; font-size: 12px; text-align: center; margin-top: 20px;">
      PRO WORKS運営チーム/株式会社アルマ
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
${userName}様

いつもPRO WORKSをご利用いただき、誠にありがとうございます。

${jobTitle}について、面談予定が確定しました。

PRO WORKS営業担当より、面談日程について別途ご連絡させていただきますのでご対応よろしくお願いいたします。

【ご注意】
本メールに身に覚えのない場合は、本メールを破棄していただきますようお願いいたします。
※ご連絡が取れない場合、面談を組むことができないため取消させていただくことがございます。ご了承ください。
――――――――――――――――――
▽お役立ち情報
${helpfulInfoUrl}
▽お問い合わせ先
${contactUrl}
▽PRO WORKS
${homeUrl}
PRO WORKS運営チーム/株式会社アルマ
――――――――――――――――――
  `;

  return sendEmail({ to, subject, html: htmlContent, text: textContent });
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
  const subjects: Record<typeof type, string> = {
    verification: "【PRO WORKS】ご登録ありがとうございます - メールアドレスの確認",
    reset: "【PRO WORKS】パスワードのリセット",
    "email-change": "【PRO WORKS】メールアドレス変更の確認",
  };

  const bodies: Record<typeof type, string> = {
    verification: `
ご登録ありがとうございます！

PRO WORKS へようこそ！
ご入力いただいたメールアドレス宛に確認メールを送信しました。

以下のリンクをクリックして、メールアドレスの確認を完了してください。

▶ ${url}

────────────────────────────────────
📝 次のステップ
────────────────────────────────────
メール確認後、マイページからプロフィールをご記入ください。
プロフィールを充実させることで、より良い案件とマッチングできます！

※ このリンクの有効期限は1時間です。`,
    reset: `
パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください。

▶ ${url}

※ このリンクの有効期限は1時間です。
※ このリクエストに心当たりがない場合は、このメールを無視してください。`,
    "email-change": `
メールアドレス変更のリクエストを受け付けました。

以下のリンクをクリックして、新しいメールアドレスを確認してください。

▶ ${url}

※ このリンクの有効期限は1時間です。
※ このリクエストに心当たりがない場合は、このメールを無視してください。`,
  };

  const icons: Record<typeof type, string> = {
    verification: "📧",
    reset: "🔑",
    "email-change": "📧",
  };

  console.log("\n" + "=".repeat(80));
  console.log(`${icons[type]} メール送信（開発環境）`);
  console.log("=".repeat(80));
  console.log("");
  console.log(`【宛先】 ${to}`);
  console.log("");
  console.log(`【件名】 ${subjects[type]}`);
  console.log("");
  console.log("【本文】");
  console.log("-".repeat(40));
  console.log(bodies[type].trim());
  console.log("-".repeat(40));
  console.log("=".repeat(80) + "\n");

  // E2Eテスト用: 認証リンクをファイルに書き出す
  if (process.env.E2E_TEST === "true" || process.env.NODE_ENV === "development") {
    try {
      const fs = require("fs");
      const path = require("path");
      const testDataDir = path.join(process.cwd(), ".e2e-test-data");

      // ディレクトリがなければ作成
      if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
      }

      // 認証リンクをファイルに保存
      const data = JSON.stringify({ type, to, url, timestamp: Date.now() });
      fs.writeFileSync(path.join(testDataDir, "last-email.json"), data);
      console.log(`📁 E2Eテスト用: 認証リンクを .e2e-test-data/last-email.json に保存しました`);
    } catch (error) {
      console.warn("⚠️ E2Eテストデータの保存に失敗:", error);
    }
  }
};
