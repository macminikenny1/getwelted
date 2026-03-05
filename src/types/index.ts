export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_moderator?: boolean;
  pinned_post_id?: string | null;
  payment_info?: {
    venmo?: string;
    cashapp?: string;
    paypal?: string;
  } | null;
  shipping_address?: ShippingAddress | null;
  created_at: string;
}

export interface Pair {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  leather_type: string | null;
  colorway: string | null;
  last_name: string | null;
  size_us: number | null;
  width: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  condition: number | null;
  status: 'active' | 'stored' | 'sold' | 'on_order';
  notes: string | null;
  image_urls: string[];
  is_roughout: boolean;
  is_public: boolean;
  wear_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  pair_id: string | null;
  caption: string | null;
  image_url: string;
  brand: string | null;
  model: string | null;
  leather_type: string | null;
  created_at: string;
  // Joined fields
  profiles?: Profile;
  like_count?: number;
  comment_count?: number;
  liked_by_user?: boolean;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}

export interface BSTListing {
  id: string;
  user_id: string;
  pair_id: string | null;
  brand: string;
  model: string;
  size_us: number | null;
  width: string | null;
  condition: number | null;
  asking_price: number | null;
  trade_interest: boolean;
  description: string | null;
  image_urls: string[];
  status: 'active' | 'sold' | 'pending_trade';
  buyer_id?: string | null;
  receipt_confirmed_at?: string | null;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface TradeOffer {
  id: string;
  conversation_id: string;
  listing_id: string;
  offered_pair_id: string;
  proposer_id: string;
  listing_owner_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'rescinded';
  proposer_confirmed: boolean;
  owner_confirmed: boolean;
  proposer_tracking_carrier?: string | null;
  proposer_tracking_number?: string | null;
  owner_tracking_carrier?: string | null;
  owner_tracking_number?: string | null;
  offered_pair?: Pair;
  created_at?: string;
}

export interface CareLogEntry {
  id: string;
  pair_id: string;
  user_id: string;
  event_type: 'conditioned' | 'polished' | 'resoled' | 'waterproofed' | 'other';
  notes: string | null;
  products_used: string | null;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ResoleLogEntry {
  id: string;
  pair_id: string;
  user_id: string;
  resole_date: string;
  cobbler: string;
  sole_type: string | null;
  notes: string | null;
  cost: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'comment' | 'like' | 'trade_offer' | 'trade_accepted' | 'message';
  actor_id: string | null;
  target_id: string | null;
  target_type: string | null;
  body: string;
  read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  type?: 'text' | 'trade_offer';
  message_type?: string;
  trade_offer_id?: string | null;
  trade_offer?: TradeOffer;
  created_at: string;
}

export interface Feedback {
  id: string;
  from_user_id: string;
  to_user_id: string;
  listing_id: string;
  rating: 'positive' | 'neutral' | 'negative';
  comment: string | null;
  role: 'buyer' | 'seller';
  created_at: string;
}

export interface WishItem {
  id: string;
  user_id?: string;
  brand: string | null;
  model: string | null;
  leather_type: string | null;
  colorway: string | null;
  size_us: number | null;
  notes: string | null;
  url: string | null;
  created_at: string;
}
