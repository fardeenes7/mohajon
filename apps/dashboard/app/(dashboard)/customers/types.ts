export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | string;

export type CustomerSearchResult = {
    user_id: string;
    phone: string;
    is_verified: boolean;
    trust_score: number;
};

export type CustomerProfile = {
    basic_info: {
        id: string;
        created_at: string;
        primary_phone: string | null;
        facebook_linked: boolean;
    };
    addresses: Array<{
        id: string;
        contact_name: string;
        contact_phone: string;
        street: string;
        city: string;
        postal_code: string;
    }>;
    order_stats: {
        total: number;
        delivered: number;
        cancelled: number;
    };
    fraud_info: {
        user_score: number;
        user_risk_level: RiskLevel;
        phone_score: number;
        phone_risk_level: RiskLevel;
        trust_score: number;
        is_verified: boolean;
    };
    recent_fraud_events: Array<{
        id: string;
        event_type: string;
        score_impact: number;
        confidence_level: string;
        source_type: string;
        created_at: string;
    }>;
};

export function riskBadgeVariant(
    level: RiskLevel
): "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning" {
    switch (level) {
        case "HIGH":
            return "destructive";
        case "MEDIUM":
            return "warning";
        case "LOW":
            return "success";
        default:
            return "outline";
    }
}
