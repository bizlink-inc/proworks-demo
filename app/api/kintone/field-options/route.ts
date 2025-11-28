import { NextResponse } from 'next/server';
import { DROPDOWN_OPTIONS } from '@/lib/kintone/fieldMapping';

export const GET = async () => {
  try {
    return NextResponse.json({
      desiredWorkDays: DROPDOWN_OPTIONS.DESIRED_WORK_DAYS,
      desiredCommute: DROPDOWN_OPTIONS.DESIRED_COMMUTE,
      emailDeliveryStatus: DROPDOWN_OPTIONS.EMAIL_DELIVERY_STATUS,
      termsAgreed: DROPDOWN_OPTIONS.TERMS_AGREED,
    });
  } catch (error) {
    console.error('フィールド選択肢取得エラー:', error);
    return NextResponse.json(
      { error: 'フィールド選択肢の取得に失敗しました' },
      { status: 500 }
    );
  }
};

