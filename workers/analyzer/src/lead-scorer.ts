import pino from "pino";

const logger = pino({ name: "lead-scorer" });

export type LeadPriority = "HOT" | "WARM" | "COLD";

export interface BusinessData {
  website: string | null;
  googleRating: number | null;
  reviewCount: number;
  socialLinks: Record<string, string> | null;
  phone: string | null;
  email: string | null;
}

export interface WebsiteAnalysisData {
  overallScore: number;
  hasCta: boolean;
  hasBookingSystem: boolean;
  mobileResponsive: boolean;
  hasSsl: boolean;
  hasAnalytics: boolean;
  technologies: string[];
  issues: string[];
}

export interface ScoreBreakdown {
  total: number;
  noWebsite: number;
  lowWebsiteScore: number;
  lowGoogleRating: number;
  fewReviews: number;
  missingSocialLinks: number;
  missingCta: number;
  noBookingSystem: number;
}

export interface ServiceRecommendation {
  service: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

/**
 * Calculate a lead score from 0-100 based on business data and website analysis.
 * Higher score = more opportunity = better lead.
 */
export function calculateLeadScore(
  business: BusinessData,
  websiteAnalysis?: WebsiteAnalysisData | null
): ScoreBreakdown {
  let total = 0;
  const breakdown: ScoreBreakdown = {
    total: 0,
    noWebsite: 0,
    lowWebsiteScore: 0,
    lowGoogleRating: 0,
    fewReviews: 0,
    missingSocialLinks: 0,
    missingCta: 0,
    noBookingSystem: 0,
  };

  // No website = huge opportunity (30 points)
  if (!business.website) {
    breakdown.noWebsite = 30;
    total += 30;
  } else if (websiteAnalysis) {
    // Low website score = opportunity for redesign (up to 20 points)
    if (websiteAnalysis.overallScore < 30) {
      breakdown.lowWebsiteScore = 20;
      total += 20;
    } else if (websiteAnalysis.overallScore < 50) {
      breakdown.lowWebsiteScore = 15;
      total += 15;
    } else if (websiteAnalysis.overallScore < 70) {
      breakdown.lowWebsiteScore = 10;
      total += 10;
    }
  }

  // Low Google rating = opportunity to improve online reputation (up to 10 points)
  if (business.googleRating !== null) {
    if (business.googleRating < 3.0) {
      breakdown.lowGoogleRating = 10;
      total += 10;
    } else if (business.googleRating < 3.5) {
      breakdown.lowGoogleRating = 7;
      total += 7;
    } else if (business.googleRating < 4.0) {
      breakdown.lowGoogleRating = 4;
      total += 4;
    }
  }

  // Few reviews = opportunity (up to 10 points)
  if (business.reviewCount < 5) {
    breakdown.fewReviews = 10;
    total += 10;
  } else if (business.reviewCount < 20) {
    breakdown.fewReviews = 7;
    total += 7;
  } else if (business.reviewCount < 50) {
    breakdown.fewReviews = 4;
    total += 4;
  }

  // Missing social links = opportunity (up to 10 points)
  const socialPlatforms = business.socialLinks
    ? Object.keys(business.socialLinks).length
    : 0;
  if (socialPlatforms === 0) {
    breakdown.missingSocialLinks = 10;
    total += 10;
  } else if (socialPlatforms < 3) {
    breakdown.missingSocialLinks = 5;
    total += 5;
  }

  // Missing CTA on website (10 points)
  if (websiteAnalysis && !websiteAnalysis.hasCta) {
    breakdown.missingCta = 10;
    total += 10;
  } else if (!business.website) {
    // No website means no CTA by definition
    breakdown.missingCta = 10;
    total += 10;
  }

  // No booking system (10 points)
  if (websiteAnalysis && !websiteAnalysis.hasBookingSystem) {
    breakdown.noBookingSystem = 10;
    total += 10;
  } else if (!business.website) {
    breakdown.noBookingSystem = 10;
    total += 10;
  }

  breakdown.total = Math.min(100, total);

  logger.debug({ breakdown }, "Calculated lead score");
  return breakdown;
}

/**
 * Determine lead priority based on score.
 */
export function getPriority(score: number): LeadPriority {
  if (score >= 70) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

/**
 * Generate service recommendations based on business data and analysis.
 */
export function getRecommendations(
  business: BusinessData,
  analysis?: WebsiteAnalysisData | null
): ServiceRecommendation[] {
  const recommendations: ServiceRecommendation[] = [];

  // Website recommendations
  if (!business.website) {
    recommendations.push({
      service: "Website Design & Development",
      reason:
        "Business has no website. A professional website would significantly improve their online presence and ability to attract customers.",
      priority: "high",
    });
  } else if (analysis) {
    if (analysis.overallScore < 40) {
      recommendations.push({
        service: "Website Redesign",
        reason: `Current website scores ${analysis.overallScore}/100. A complete redesign would improve user experience, SEO, and conversions.`,
        priority: "high",
      });
    }

    if (!analysis.mobileResponsive) {
      recommendations.push({
        service: "Mobile Optimization",
        reason:
          "Website is not mobile-responsive. Over 60% of web traffic comes from mobile devices.",
        priority: "high",
      });
    }

    if (!analysis.hasSsl) {
      recommendations.push({
        service: "SSL Certificate & Security",
        reason:
          "Website lacks SSL. Search engines penalize non-HTTPS sites and visitors see security warnings.",
        priority: "high",
      });
    }

    if (!analysis.hasAnalytics) {
      recommendations.push({
        service: "Analytics Setup",
        reason:
          "No analytics detected. Without tracking, the business cannot measure website performance or ROI.",
        priority: "medium",
      });
    }

    if (!analysis.hasCta) {
      recommendations.push({
        service: "Conversion Optimization",
        reason:
          "Website lacks clear calls-to-action. Adding CTAs can significantly increase lead generation.",
        priority: "medium",
      });
    }

    if (!analysis.hasBookingSystem) {
      recommendations.push({
        service: "Online Booking System",
        reason:
          "No booking/scheduling system detected. An online booking option can increase appointments by 30-50%.",
        priority: "medium",
      });
    }

    if (analysis.issues.length > 5) {
      recommendations.push({
        service: "SEO Optimization",
        reason: `${analysis.issues.length} technical SEO issues found. Fixing these would improve search engine rankings and organic traffic.`,
        priority: "medium",
      });
    }
  }

  // Social media recommendations
  const socialCount = business.socialLinks
    ? Object.keys(business.socialLinks).length
    : 0;
  if (socialCount === 0) {
    recommendations.push({
      service: "Social Media Setup & Management",
      reason:
        "Business has no social media presence. Social profiles help build trust, engage customers, and drive traffic.",
      priority: "medium",
    });
  } else if (socialCount < 3) {
    recommendations.push({
      service: "Social Media Expansion",
      reason: `Business only has ${socialCount} social platform(s). Expanding to more platforms increases reach and brand awareness.`,
      priority: "low",
    });
  }

  // Google reputation
  if (business.googleRating !== null && business.googleRating < 4.0) {
    recommendations.push({
      service: "Reputation Management",
      reason: `Google rating is ${business.googleRating}/5. A reputation management strategy can help improve ratings and attract more customers.`,
      priority: business.googleRating < 3.0 ? "high" : "medium",
    });
  }

  if (business.reviewCount < 20) {
    recommendations.push({
      service: "Review Generation Campaign",
      reason: `Only ${business.reviewCount} Google reviews. Increasing review count builds social proof and improves local SEO rankings.`,
      priority: "low",
    });
  }

  return recommendations;
}

/**
 * Determine which boolean need flags to set on the Lead record.
 */
export function getNeedFlags(
  business: BusinessData,
  analysis?: WebsiteAnalysisData | null
): Record<string, boolean> {
  return {
    needsRedesign:
      !business.website ||
      (analysis !== null &&
        analysis !== undefined &&
        analysis.overallScore < 50),
    needsSEO: analysis
      ? analysis.issues.length > 3
      : !business.website,
    needsBranding:
      (business.socialLinks
        ? Object.keys(business.socialLinks).length
        : 0) < 2,
    needsAds: !business.website || (business.reviewCount < 10),
    needsEcommerce: false, // Cannot determine from scraping alone
    needsAutomation: analysis
      ? !analysis.hasBookingSystem
      : true,
  };
}
