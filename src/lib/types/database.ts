// Hand-written types matching schema/001-004.sql.
// Once the schema stabilizes, you can replace this file by running:
//   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/types/database.ts
// which auto-generates from the live database. For now, this covers
// everything Phase 1-4 pages need.

export type Database = {
  public: {
    Tables: {
      cafes: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          timezone: string;
          whatsapp_business_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string | null;
          timezone?: string;
          whatsapp_business_number?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cafes"]["Insert"]>;
        Relationships: [];
      };
      stations: {
        Row: {
          id: string;
          cafe_id: string;
          label: string;
          tier: "standard" | "premium" | "rtx4090" | "console";
          base_hourly_rate: number;
          gpu_model: string | null;
          status: "available" | "occupied" | "maintenance";
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          label: string;
          tier?: "standard" | "premium" | "rtx4090" | "console";
          base_hourly_rate: number;
          gpu_model?: string | null;
          status?: "available" | "occupied" | "maintenance";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stations"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          cafe_id: string;
          phone: string;
          name: string | null;
          date_of_birth: string | null;
          favorite_game: string | null;
          referred_by: string | null;
          squad_id: string | null;
          clv_tier: string;
          clv_score: number | null;
          churn_risk_score: number | null;
          cafe_coins: number;
          comp_tier: string;
          referral_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          phone: string;
          name?: string | null;
          date_of_birth?: string | null;
          favorite_game?: string | null;
          referred_by?: string | null;
          squad_id?: string | null;
          clv_tier?: string;
          clv_score?: number | null;
          churn_risk_score?: number | null;
          cafe_coins?: number;
          created_at?: string;
          comp_tier?: string;
          referral_code?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          cafe_id: string;
          station_id: string;
          customer_id: string | null;
          squad_id: string | null;
          game_played: string | null;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
          rate_applied: number;
          rate_reason: string | null;
          ended_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          station_id: string;
          customer_id?: string | null;
          squad_id?: string | null;
          game_played?: string | null;
          started_at?: string;
          ended_at?: string | null;
          rate_applied: number;
          rate_reason?: string | null;
          ended_reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          cafe_id: string;
          customer_id: string | null;
          session_id: string | null;
          item_type: string;
          item_name: string | null;
          quantity: number;
          unit_price: number;
          total_amount: number;
          payment_method: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          customer_id?: string | null;
          session_id?: string | null;
          item_type: string;
          item_name?: string | null;
          quantity?: number;
          unit_price: number;
          total_amount: number;
          payment_method?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      customer_events: {
        Row: {
          id: string;
          cafe_id: string;
          customer_id: string | null;
          event_type: string;
          event_payload: Record<string, unknown> | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          customer_id?: string | null;
          event_type: string;
          event_payload?: Record<string, unknown> | null;
          occurred_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_events"]["Insert"]>;
        Relationships: [];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          cafe_id: string;
          customer_id: string | null;
          campaign_type: string;
          variant: string | null;
          message_text: string;
          sent_at: string;
          responded_at: string | null;
          led_to_visit: boolean | null;
          led_to_visit_session_id: string | null;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          customer_id?: string | null;
          campaign_type: string;
          variant?: string | null;
          message_text: string;
          sent_at?: string;
          responded_at?: string | null;
          led_to_visit?: boolean | null;
          led_to_visit_session_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_messages"]["Insert"]>;
        Relationships: [];
      };
      squads: {
        Row: {
          id: string;
          cafe_id: string;
          squad_type: "squad" | "family" | "college_gang" | "corporate";
          name: string;
          leader_customer_id: string | null;
          plan_tier: string | null;
          monthly_fee: number | null;
          shared_hours_pool: number;
          hours_used_this_cycle: number;
          cycle_starts_at: string | null;
          cycle_ends_at: string | null;
          streak_weeks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          squad_type?: "squad" | "family" | "college_gang" | "corporate";
          name: string;
          leader_customer_id?: string | null;
          plan_tier?: string | null;
          monthly_fee?: number | null;
          shared_hours_pool: number;
          hours_used_this_cycle?: number;
          cycle_starts_at?: string | null;
          cycle_ends_at?: string | null;
          streak_weeks?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["squads"]["Insert"]>;
        Relationships: [];
      };
      cafe_staff: {
        Row: {
          id: string;
          cafe_id: string;
          user_id: string;
          role: "owner" | "manager" | "staff";
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          user_id: string;
          role?: "owner" | "manager" | "staff";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cafe_staff"]["Insert"]>;
        Relationships: [];
      };
      pricing_rules: {
        Row: {
          id: string;
          cafe_id: string;
          rule_name: string;
          station_tier: string | null;
          day_of_week: number[] | null;
          start_time: string | null;
          end_time: string | null;
          price_multiplier: number;
          min_occupancy_pct: number | null;
          max_occupancy_pct: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          rule_name: string;
          station_tier?: string | null;
          day_of_week?: number[] | null;
          start_time?: string | null;
          end_time?: string | null;
          price_multiplier?: number;
          min_occupancy_pct?: number | null;
          max_occupancy_pct?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_rules"]["Insert"]>;
        Relationships: [];
      };
      pricing_rule_applications: {
        Row: {
          id: string;
          session_id: string | null;
          pricing_rule_id: string | null;
          occupancy_pct_at_time: number | null;
          applied_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          pricing_rule_id?: string | null;
          occupancy_pct_at_time?: number | null;
          applied_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_rule_applications"]["Insert"]>;
        Relationships: [];
      };
      coaches: {
        Row: {
          id: string;
          cafe_id: string;
          customer_id: string | null;
          display_name: string;
          game_specialty: string;
          hourly_rate: number;
          bio: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          customer_id?: string | null;
          display_name: string;
          game_specialty: string;
          hourly_rate: number;
          bio?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coaches"]["Insert"]>;
        Relationships: [];
      };
      coaching_bookings: {
        Row: {
          id: string;
          cafe_id: string;
          coach_id: string | null;
          student_customer_id: string | null;
          scheduled_at: string;
          duration_hours: number;
          total_price: number;
          cafe_commission_pct: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          coach_id?: string | null;
          student_customer_id?: string | null;
          scheduled_at: string;
          duration_hours?: number;
          total_price: number;
          cafe_commission_pct?: number;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coaching_bookings"]["Insert"]>;
        Relationships: [];
      };
      customer_clv_snapshots: {
        Row: {
          id: string;
          customer_id: string | null;
          snapshot_date: string;
          recency_days: number | null;
          frequency_30d: number | null;
          monetary_30d: number | null;
          predicted_ltv: number | null;
          segment: string | null;
          computed_by: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          snapshot_date?: string;
          recency_days?: number | null;
          frequency_30d?: number | null;
          monetary_30d?: number | null;
          predicted_ltv?: number | null;
          segment?: string | null;
          computed_by?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_clv_snapshots"]["Insert"]>;
        Relationships: [];
      };
      next_best_actions: {
        Row: {
          id: string;
          cafe_id: string;
          customer_id: string | null;
          recommended_action: string;
          reasoning: Record<string, unknown> | null;
          expected_value: number | null;
          was_executed: boolean;
          executed_at: string | null;
          actual_outcome_value: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          customer_id?: string | null;
          recommended_action: string;
          reasoning?: Record<string, unknown> | null;
          expected_value?: number | null;
          was_executed?: boolean;
          executed_at?: string | null;
          actual_outcome_value?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["next_best_actions"]["Insert"]>;
        Relationships: [];
      };
      battle_pass_seasons: {
        Row: {
          id: string;
          cafe_id: string;
          season_name: string;
          starts_at: string;
          ends_at: string;
          premium_price: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          season_name: string;
          starts_at: string;
          ends_at: string;
          premium_price?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["battle_pass_seasons"]["Insert"]>;
        Relationships: [];
      };
      battle_pass_tiers: {
        Row: {
          id: string;
          season_id: string;
          tier_number: number;
          xp_required: number;
          free_reward: string | null;
          premium_reward: string | null;
        };
        Insert: {
          id?: string;
          season_id: string;
          tier_number: number;
          xp_required: number;
          free_reward?: string | null;
          premium_reward?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["battle_pass_tiers"]["Insert"]>;
        Relationships: [];
      };
      customer_battle_pass_progress: {
        Row: {
          id: string;
          customer_id: string;
          season_id: string;
          is_premium: boolean;
          current_xp: number;
          current_tier: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          season_id: string;
          is_premium?: boolean;
          current_xp?: number;
          current_tier?: number;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_battle_pass_progress"]["Insert"]
        >;
        Relationships: [];
      };
      achievement_definitions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          reward_description: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          reward_description?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["achievement_definitions"]["Insert"]>;
        Relationships: [];
      };
      customer_achievements: {
        Row: {
          id: string;
          customer_id: string;
          achievement_code: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          achievement_code: string;
          earned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_achievements"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      leaderboard_weekly: {
        Row: {
          cafe_id: string;
          customer_id: string;
          name: string | null;
          hours_played: number | null;
          total_spend: number | null;
          referrals_made: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      refresh_leaderboard_weekly: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row-level aliases used throughout the app
export type Cafe = Database["public"]["Tables"]["cafes"]["Row"];
export type Station = Database["public"]["Tables"]["stations"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Squad = Database["public"]["Tables"]["squads"]["Row"];
export type NextBestAction = Database["public"]["Tables"]["next_best_actions"]["Row"];
