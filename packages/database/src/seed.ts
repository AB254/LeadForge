import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Businesses ──────────────────────────────────────────────────────

  const business1 = await prisma.business.upsert({
    where: { googlePlaceId: "ChIJ_example_restaurant_001" },
    update: {},
    create: {
      googlePlaceId: "ChIJ_example_restaurant_001",
      name: "Bella Italia Ristorante",
      category: "Restaurant",
      subcategory: "Italian",
      address: "123 Main Street",
      city: "Riyadh",
      state: "Riyadh Region",
      country: "Saudi Arabia",
      zipCode: "11564",
      phone: "+966501234567",
      email: "info@bellaitalia-riyadh.com",
      website: "https://bellaitalia-riyadh.com",
      googleMapsUrl: "https://maps.google.com/?cid=1234567890",
      latitude: 24.7136,
      longitude: 46.6753,
      googleRating: 4.2,
      reviewCount: 187,
      priceLevel: "$$",
      claimedOnGoogle: true,
      openingHours: {
        monday: "11:00-23:00",
        tuesday: "11:00-23:00",
        wednesday: "11:00-23:00",
        thursday: "11:00-00:00",
        friday: "13:00-00:00",
        saturday: "11:00-00:00",
        sunday: "11:00-23:00",
      },
    },
  });

  const business2 = await prisma.business.upsert({
    where: { googlePlaceId: "ChIJ_example_salon_002" },
    update: {},
    create: {
      googlePlaceId: "ChIJ_example_salon_002",
      name: "Glamour Beauty Salon",
      category: "Beauty Salon",
      subcategory: "Hair & Nails",
      address: "456 Olaya Street",
      city: "Riyadh",
      state: "Riyadh Region",
      country: "Saudi Arabia",
      zipCode: "11523",
      phone: "+966509876543",
      website: null,
      googleMapsUrl: "https://maps.google.com/?cid=9876543210",
      latitude: 24.6908,
      longitude: 46.6855,
      googleRating: 3.8,
      reviewCount: 64,
      priceLevel: "$",
      claimedOnGoogle: false,
    },
  });

  const business3 = await prisma.business.upsert({
    where: { googlePlaceId: "ChIJ_example_hotel_003" },
    update: {},
    create: {
      googlePlaceId: "ChIJ_example_hotel_003",
      name: "Desert Rose Hotel",
      category: "Hotel",
      subcategory: "Boutique Hotel",
      address: "789 King Fahd Road",
      city: "Jeddah",
      state: "Makkah Region",
      country: "Saudi Arabia",
      zipCode: "21442",
      phone: "+966126543210",
      email: "reservations@desertrose.sa",
      website: "https://desertrose.sa",
      googleMapsUrl: "https://maps.google.com/?cid=5555555555",
      latitude: 21.4858,
      longitude: 39.1925,
      googleRating: 4.6,
      reviewCount: 312,
      priceLevel: "$$$",
      claimedOnGoogle: true,
      socialLinks: {
        instagram: "https://instagram.com/desertrosehotel",
        twitter: "https://twitter.com/desertrosehotel",
      },
    },
  });

  console.log("  ✓ Businesses created");

  // ── Leads ───────────────────────────────────────────────────────────

  const lead1 = await prisma.lead.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      businessId: business1.id,
      score: 72,
      priority: "WARM",
      hasWebsite: true,
      websiteScore: 45,
      seoScore: 38,
      mobileScore: 52,
      brandingScore: 60,
      needsRedesign: true,
      needsSEO: true,
      needsBranding: false,
      needsAds: true,
      needsEcommerce: false,
      needsAutomation: true,
      status: "NEW",
      aiSummary:
        "Restaurant has a dated website with poor mobile experience. Strong Google presence but not leveraging digital marketing. High potential for web redesign and SEO services.",
      aiRecommendations: [
        "Complete website redesign with mobile-first approach",
        "Local SEO optimization for restaurant keywords",
        "Google Ads campaign for high-intent searches",
        "Automated review management system",
      ],
    },
  });

  const lead2 = await prisma.lead.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      businessId: business2.id,
      score: 91,
      priority: "HOT",
      hasWebsite: false,
      needsRedesign: true,
      needsSEO: true,
      needsBranding: true,
      needsAds: true,
      needsEcommerce: true,
      needsAutomation: true,
      status: "NEW",
      aiSummary:
        "Beauty salon with no website and unclaimed Google listing. Extremely high potential — needs full digital presence from scratch.",
      aiRecommendations: [
        "Build a new brand identity and website",
        "Claim and optimize Google Business Profile",
        "Instagram marketing strategy",
        "Online booking system integration",
        "WhatsApp Business automation",
      ],
    },
  });

  await prisma.lead.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      businessId: business3.id,
      score: 35,
      priority: "COLD",
      hasWebsite: true,
      websiteScore: 78,
      seoScore: 72,
      mobileScore: 85,
      brandingScore: 80,
      conversionScore: 65,
      needsRedesign: false,
      needsSEO: false,
      needsBranding: false,
      needsAds: true,
      needsEcommerce: false,
      needsAutomation: true,
      status: "NEW",
      aiSummary:
        "Well-established hotel with solid digital presence. Limited upsell potential — mainly Google Ads and booking automation.",
    },
  });

  console.log("  ✓ Leads created");

  // ── Outreach Template ───────────────────────────────────────────────

  await prisma.outreachTemplate.upsert({
    where: { id: "00000000-0000-0000-0000-100000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-100000000001",
      name: "No Website - Cold Email",
      type: "EMAIL",
      subject: "Quick question about {{businessName}}'s online presence",
      body: `Hi {{contactName}},

I came across {{businessName}} on Google Maps and noticed you don't have a website yet.

In today's market, businesses without a website miss out on up to 70% of potential customers who search online before visiting.

I specialize in building modern, mobile-friendly websites for {{category}} businesses in {{city}}. Would you be open to a quick 10-minute call to discuss how we could help {{businessName}} attract more customers online?

Best regards,
{{senderName}}`,
      variables: [
        "businessName",
        "contactName",
        "category",
        "city",
        "senderName",
      ],
      isDefault: true,
    },
  });

  console.log("  ✓ Outreach templates created");

  // ── Saved Search ────────────────────────────────────────────────────

  await prisma.savedSearch.upsert({
    where: { id: "00000000-0000-0000-0000-200000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-200000000001",
      name: "Riyadh Restaurants Without Websites",
      query: "restaurant",
      city: "Riyadh",
      country: "Saudi Arabia",
      filters: {
        hasWebsite: false,
        minRating: 3.5,
        minReviews: 20,
      },
    },
  });

  await prisma.savedSearch.upsert({
    where: { id: "00000000-0000-0000-0000-200000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-200000000002",
      name: "Jeddah Hotels Low Web Score",
      query: "hotel",
      city: "Jeddah",
      country: "Saudi Arabia",
      filters: {
        hasWebsite: true,
        maxWebsiteScore: 50,
        minRating: 4.0,
      },
    },
  });

  console.log("  ✓ Saved searches created");

  // ── Analytics Events ────────────────────────────────────────────────

  await prisma.analyticsEvent.createMany({
    data: [
      { event: "scraping_job_started", metadata: { query: "restaurant", city: "Riyadh" } },
      { event: "lead_scored", metadata: { leadId: lead1.id, score: 72 } },
      { event: "lead_scored", metadata: { leadId: lead2.id, score: 91 } },
      { event: "outreach_sent", metadata: { leadId: lead2.id, type: "EMAIL" } },
    ],
  });

  console.log("  ✓ Analytics events created");

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
