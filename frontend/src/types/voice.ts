export type VoiceAssistantStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'executing'
  | 'speaking'
  | 'error';

export type VoiceLanguage = 'en-IN' | 'hi-IN' | 'kn-IN';

export interface VoiceActionResult {
  type:
    | 'SEARCH_PRODUCT'
    | 'ADD_TO_CART'
    | 'CART_SUMMARY'
    | 'CLEAR_CART'
    | 'APPLY_DISCOUNT'
    | 'GENERATE_QR'
    | 'CHECK_STOCK'
    | 'CHECK_SALES'
    | 'CHECK_CATEGORY'
    | 'OUT_OF_SCOPE'
    | 'GENERAL_QUERY';
  success: boolean;
  message: string;
  speechReply: string;
  payload?: any;
}

export interface VoicePosEventDetail {
  action: 'ADD_ITEM' | 'CLEAR_CART' | 'APPLY_DISCOUNT' | 'GENERATE_QR';
  productId?: number;
  productName?: string;
  quantity?: number;
  discountType?: 'NONE' | 'FIXED' | 'PERCENT';
  discountValue?: number;
}
