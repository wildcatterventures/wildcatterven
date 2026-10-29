// ============================================================================
// CAMPUS UNCUT — INSTITUTIONAL DOSSIER & RECRUITER VERIFICATION REGISTRY
// ============================================================================
// Evidence-backed institutional facts, distinctive campus initiatives, and
// verified recruiter documentation traceable to official college reports.
// ============================================================================

export interface DistinctiveFeature {
  title: string;
  description: string;
  category: "research" | "facility" | "heritage" | "initiative" | "academic";
  sourceName: string;
  sourceUrl: string;
}

export interface PlacementSummary {
  season: string;
  placementCellName: string;
  reportUrl: string;
  overview: string;
}

export interface InstitutionalDossier {
  shortCode: string;
  established: number;
  type: string;
  status: string;
  affiliation: string;
  campusFootprint: string;
  locationContext: string;
  primaryFocus: string;
  officialWebsite: string;
  verifiedAccreditation?: string;
  distinctiveFeatures: DistinctiveFeature[];
  placementSummary: PlacementSummary;
}

export interface RecruiterCompany {
  name: string;
  sector: string;
  season: string;
  evidenceType: string;
  sourceLabel: string;
  sourceUrl: string;
  logoSvg?: string;
}

// ----------------------------------------------------------------------------
// 1. INSTITUTIONAL DOSSIERS (Verified Facts & Distinctive Initiatives)
// ----------------------------------------------------------------------------
export const INSTITUTIONAL_DOSSIERS: Record<string, InstitutionalDossier> = {
  IITB: {
    shortCode: "IITB",
    established: 1958,
    type: "Institute of National Importance",
    status: "Autonomous Parliamentary Charter",
    affiliation: "Council of IITs",
    campusFootprint: "550-acre lakeside campus in Powai",
    locationContext: "Nestled between Powai Lake and Sanjay Gandhi National Park, Mumbai",
    primaryFocus: "Engineering, Computing, Deep-Tech Sciences, Design & Management",
    officialWebsite: "https://www.iitb.ac.in",
    verifiedAccreditation: "Institute of National Importance • NIRF #3 (National 2023)",
    distinctiveFeatures: [
      {
        title: "Society for Innovation and Entrepreneurship (SINE)",
        description: "Dedicated on-campus deep-tech business incubator operational since 2004, having nurtured over 200 science and engineering startups with extensive prototyping laboratories.",
        category: "research",
        sourceName: "SINE IIT Bombay Official Portal",
        sourceUrl: "https://www.sineiitb.org",
      },
      {
        title: "National Centre for Aerospace Innovation & Research (NCAIR)",
        description: "Joint research consortium established with the Department of Science & Technology (DST) and international aerospace leaders for high-precision manufacturing and composites research.",
        category: "facility",
        sourceName: "NCAIR IITB Research Cell",
        sourceUrl: "https://www.aero.iitb.ac.in",
      },
      {
        title: "Pratham Student Satellite Programme",
        description: "Student-engineered space mission designed and built entirely by multidisciplinary undergraduate teams, successfully launched into polar sun-synchronous orbit by ISRO's PSLV-C35.",
        category: "initiative",
        sourceName: "ISRO PSLV-C35 Mission Archives",
        sourceUrl: "https://www.isro.gov.in/PRATHAM.html",
      },
      {
        title: "Centre for Machine Intelligence and Data Science (C-MInDS)",
        description: "Advanced cross-departmental hub conducting fundamental artificial intelligence research, high-performance computing, and natural language processing applications.",
        category: "academic",
        sourceName: "IITB Academic Council",
        sourceUrl: "https://www.minds.iitb.ac.in",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Placement Office (IIT Bombay)",
      reportUrl: "https://campus.placements.iitb.ac.in",
      overview: "Campus recruitment coordinates two phases across technology, quantitative finance, semiconductor hardware, and strategic consulting firms. Campus Uncut records confirmed recruiters verified in official seasonal summaries.",
    },
  },

  COEP: {
    shortCode: "COEP",
    established: 1854,
    type: "Unitary Maharashtra State University",
    status: "Unitary University (formerly Autonomous State Institute)",
    affiliation: "Established under Maharashtra Act No. XXXV of 2022",
    campusFootprint: "Historic riverside campus on the Mula river, Shivajinagar",
    locationContext: "Central Pune heritage quarter at the historic river confluence",
    primaryFocus: "Core Engineering Disciplines, Metallurgy, Civil & Computing",
    officialWebsite: "https://www.coeptech.ac.in",
    verifiedAccreditation: "NAAC A+ Grade • Historic Second Oldest Engineering School in India",
    distinctiveFeatures: [
      {
        title: "Pioneering Engineering Legacy & Sir MV Heritage",
        description: "Founded in 1854 as the Poona Engineering Class, it is the second-oldest technical school in India and the alma mater of Bharat Ratna Sir M. Visvesvaraya, in whose honour National Engineers' Day is celebrated.",
        category: "heritage",
        sourceName: "COEP Historical Archives",
        sourceUrl: "https://www.coeptech.ac.in/about-us/about-university/",
      },
      {
        title: "Bhau Institute of Innovation, Entrepreneurship & Leadership",
        description: "Independent 22,000 sq.ft incubation centre supported by the Rajiv Gandhi Science and Technology Commission, mentoring student-led grassroots technology startups.",
        category: "research",
        sourceName: "Bhau Institute Pune",
        sourceUrl: "https://bhau.org",
      },
      {
        title: "COEP Swayam Pico-Satellite Mission",
        description: "Student team conceptualized, engineered, and ground-tested Swayam, a 1-U pico-satellite launched into orbit by ISRO's PSLV-C34 to demonstrate point-to-point digital communication.",
        category: "initiative",
        sourceName: "COEP Satellite Team / ISRO",
        sourceUrl: "https://www.isro.gov.in/SWAYAM.html",
      },
      {
        title: "MindSpark Technical Symposium",
        description: "Western India's premier annual student technical colloquium hosting national engineering exhibitions, hackathons, and design challenges.",
        category: "academic",
        sourceName: "COEP Student Gymkhana",
        sourceUrl: "https://www.coeptech.ac.in",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Training & Placement Cell, COEP Technological University",
      reportUrl: "https://www.coeptech.ac.in/placement/",
      overview: "Hosts over 150 recruiters annually across automotive R&D, structural engineering, semiconductor design, and cloud software engineering.",
    },
  },

  VJTI: {
    shortCode: "VJTI",
    established: 1887,
    type: "State-Funded Autonomous Technical Institute",
    status: "Government-Aided Autonomous",
    affiliation: "Academically affiliated with University of Mumbai",
    campusFootprint: "16-acre heritage campus in Matunga, Mumbai",
    locationContext: "Educational hub of Central Mumbai near King's Circle",
    primaryFocus: "Mechanical, Electrical, Production, Civil & Computer Engineering",
    officialWebsite: "https://vjti.ac.in",
    verifiedAccreditation: "Autonomous Institute • NBA Accredited Programmes",
    distinctiveFeatures: [
      {
        title: "Century-Old Industrial & Municipal Foundation",
        description: "Founded in 1887 as Victoria Jubilee Technical Institute, VJTI was instrumental in establishing electrical infrastructure, railway benchmarks, and textile production standards in Maharashtra.",
        category: "heritage",
        sourceName: "VJTI Centenary Archives",
        sourceUrl: "https://vjti.ac.in",
      },
      {
        title: "VJTI Technology Business Incubator (TBI)",
        description: "DST-recognized incubation centre supporting innovation in IoT, renewable power systems, clean energy grids, and digital governance tools.",
        category: "research",
        sourceName: "VJTI TBI Official",
        sourceUrl: "https://vjti-tbi.in",
      },
      {
        title: "Centre of Excellence in Complex & Nonlinear Dynamical Systems",
        description: "World Bank TEQIP-funded research laboratory focusing on electrical smart-grid security, urban vibration control, and sensor networks.",
        category: "facility",
        sourceName: "TEQIP CoE Documentation",
        sourceUrl: "https://vjti.ac.in",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Training and Placement Office (TPO), VJTI Mumbai",
      reportUrl: "https://vjti.ac.in/training-and-placement-office/",
      overview: "Longstanding institutional recruiting relations across international investment banks, automotive consortia, and enterprise systems.",
    },
  },

  SPIT: {
    shortCode: "SPIT",
    established: 1962,
    type: "Private Autonomous Engineering Institute",
    status: "Autonomous Institute (Empowered Status)",
    affiliation: "Bharatiya Vidya Bhavan / University of Mumbai",
    campusFootprint: "47-acre lush educational campus in Andheri West",
    locationContext: "Munshi Nagar academic campus alongside SPJIMR in Suburban Mumbai",
    primaryFocus: "Computer Engineering, Information Technology, Electronics & Telecommunication",
    officialWebsite: "https://www.spit.ac.in",
    verifiedAccreditation: "NAAC A Grade • Autonomous Institution",
    distinctiveFeatures: [
      {
        title: "Bhavan's Research & Innovation Centre (BRIC)",
        description: "Dedicated pre-incubation facility enabling undergraduate researchers to file patents and prototype commercial software applications.",
        category: "research",
        sourceName: "SPIT Innovation Cell",
        sourceUrl: "https://www.spit.ac.in",
      },
      {
        title: "Centre for Neuromorphic Computing & IoT",
        description: "Specialized laboratory equipped for edge-AI processing, biometric algorithm testing, and ultra-low-power neuromorphic architecture studies.",
        category: "facility",
        sourceName: "SPIT R&D Council",
        sourceUrl: "https://www.spit.ac.in",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Training & Placement Cell, SPIT Mumbai",
      reportUrl: "https://www.spit.ac.in/placements/",
      overview: "Consistently recognized for top-tier software engineering, cloud computing, and financial technology campus placements in Mumbai.",
    },
  },

  PICT: {
    shortCode: "PICT",
    established: 1983,
    type: "Private Engineering Institute",
    status: "Affiliated Institute",
    affiliation: "Savitribai Phule Pune University (SPPU)",
    campusFootprint: "5-acre specialized computing campus in Dhankawadi, Pune",
    locationContext: "Southern Pune educational belt near Katraj",
    primaryFocus: "Computer Engineering, Information Technology & Electronics",
    officialWebsite: "https://pict.edu",
    verifiedAccreditation: "NAAC A+ Grade • NBA Accredited Computing Disciplines",
    distinctiveFeatures: [
      {
        title: "Specialized Computing & Algorithmic Heritage",
        description: "Founded by SCTR specifically for computing and communications, producing alumni who have spearheaded key technology ventures across Pune and Silicon Valley.",
        category: "academic",
        sourceName: "SCTR PICT Historical Overview",
        sourceUrl: "https://pict.edu",
      },
      {
        title: "Credenz & Impetus Technical Symposia",
        description: "Flagship national computing festivals hosted by IEEE and ACM student chapters, drawing thousands of student software architects across India.",
        category: "initiative",
        sourceName: "PICT Student Affairs",
        sourceUrl: "https://pict.edu",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Training & Placement Department, PICT",
      reportUrl: "https://pict.edu/placement/",
      overview: "Known across Maharashtra for dense recruitment by multinational cloud infrastructure, financial software, and algorithmic trading firms.",
    },
  },

  SFIT: {
    shortCode: "SFIT",
    established: 1999,
    type: "Private Minority Engineering College",
    status: "Affiliated Institute",
    affiliation: "University of Mumbai",
    campusFootprint: "5-acre scenic campus at Mount Poinsur, Borivali West",
    locationContext: "North Mumbai residential green belt near IC Colony",
    primaryFocus: "Computer Science, Information Technology, Electronics & Mechanical",
    officialWebsite: "https://www.sfit.ac.in",
    verifiedAccreditation: "NAAC A Grade • ISO 9001:2015 Certified",
    distinctiveFeatures: [
      {
        title: "Franciscan Value-Centric Education Tradition",
        description: "Administered by the Congregation of Franciscan Brothers, emphasizing inclusive engineering education, ethics, and community-driven technology solutions.",
        category: "heritage",
        sourceName: "SFIT Administration",
        sourceUrl: "https://www.sfit.ac.in",
      },
      {
        title: "Robotics & Embedded Automation Lab",
        description: "Dedicated student maker-space equipped for mechatronics prototypes, micro-controllers, and national robotics competition builds.",
        category: "facility",
        sourceName: "SFIT Academic Council",
        sourceUrl: "https://www.sfit.ac.in",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Training & Placement Cell, SFIT",
      reportUrl: "https://www.sfit.ac.in/Placement%20Summary.php",
      overview: "Active annual recruitment with enterprise IT consulting, financial services, and product development companies.",
    },
  },

  WCE: {
    shortCode: "WCE",
    established: 1947,
    type: "Government-Aided Autonomous Engineering College",
    status: "Government-Aided Autonomous",
    affiliation: "Shivaji University, Kolhapur",
    campusFootprint: "90-acre scenic campus in Vishrambag, Sangli",
    locationContext: "Western Maharashtra regional technical anchor",
    primaryFocus: "Civil, Mechanical, Electrical, Electronics & Computer Science",
    officialWebsite: "https://walchandsangli.ac.in/",
    verifiedAccreditation: "Autonomous College • NAAC A Grade",
    distinctiveFeatures: [
      {
        title: "Seth Walchand Hirachand Industrialist Vision",
        description: "Named after pioneering Indian industrialist Seth Walchand Hirachand, reflecting a continuous 75-year tradition of core industrial nation-building.",
        category: "heritage",
        sourceName: "WCE Administrative Board",
        sourceUrl: "https://walchandsangli.ac.in/",
      },
      {
        title: "Southern Maharashtra Regional Technology Anchor",
        description: "The 90-acre residential campus houses extensive heavy engineering workshops, fluid mechanics flumes, and regional material testing laboratories.",
        category: "facility",
        sourceName: "WCE Campus Profile",
        sourceUrl: "https://walchandsangli.ac.in/",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Department of Training & Placement, WCE Sangli",
      reportUrl: "https://walchandsangli.ac.in/student-careers/career-development-cell/placement-in-wce/",
      overview: "Anchors recruitment in Western Maharashtra with heavy machinery, automotive manufacturers, and digital engineering enterprises.",
    },
  },

  "VIT-MUM": {
    shortCode: "VIT-MUM",
    established: 1999,
    type: "Private Autonomous Engineering & Management Institute",
    status: "Autonomous Institute",
    affiliation: "University of Mumbai",
    campusFootprint: "Modern high-tech urban vertical campus in Wadala East",
    locationContext: "Central Mumbai transit-accessible educational cluster",
    primaryFocus: "Information Technology, Artificial Intelligence, Electronics & Management",
    officialWebsite: "https://vit.edu.in",
    verifiedAccreditation: "NAAC A+ Grade • Autonomous Institution",
    distinctiveFeatures: [
      {
        title: "Design Award-Winning Modern Campus Architecture",
        description: "Internationally lauded progressive urban campus design with open-plan collaborative study pods, digital amphitheatres, and high-density labs.",
        category: "facility",
        sourceName: "VIT Institutional Profile",
        sourceUrl: "https://vit.edu.in",
      },
      {
        title: "Vidyalankar Innovation & Research Council (VIRC)",
        description: "Active incubation and patent support cell helping students convert capstone academic projects into registered intellectual property.",
        category: "research",
        sourceName: "VIT R&D Cell",
        sourceUrl: "https://vit.edu.in",
      },
    ],
    placementSummary: {
      season: "2023–24 Placement Season",
      placementCellName: "Placement Cell, Vidyalankar Institute of Technology",
      reportUrl: "https://vit.edu.in/placement/",
      overview: "Broad recruiter participation across digital product firms, analytics consultancies, and financial technology services.",
    },
  },
};

// ----------------------------------------------------------------------------
// 2. VERIFIED RECRUITER COMPANIES REGISTRY
// Authentic placement recruiters documented in official reports with 2023-24 seasons
// ----------------------------------------------------------------------------
export const COLLEGE_RECRUITERS: Record<string, RecruiterCompany[]> = {
  IITB: [
    {
      name: "Google",
      sector: "Cloud Infrastructure & Software",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Microsoft",
      sector: "Enterprise Software & AI",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Apple",
      sector: "Hardware Architecture & Systems",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Qualcomm",
      sector: "Semiconductors & Wireless",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Texas Instruments",
      sector: "Analog & Digital VLSI",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Goldman Sachs",
      sector: "Quantitative Finance & Engineering",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Morgan Stanley",
      sector: "Investment Banking Technology",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "McKinsey & Company",
      sector: "Management Consulting",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Boston Consulting Group (BCG)",
      sector: "Strategic Advisory",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
    {
      name: "Larsen & Toubro",
      sector: "Engineering & Heavy Infrastructure",
      season: "2023–24 Season",
      evidenceType: "Placement Office Official Report",
      sourceLabel: "IITB Placements Summary",
      sourceUrl: "https://campus.placements.iitb.ac.in",
    },
  ],

  COEP: [
    {
      name: "Tata Motors",
      sector: "Automotive R&D & Mobility",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
    {
      name: "Bajaj Auto",
      sector: "Two-Wheeler Engineering & R&D",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
    {
      name: "Microsoft",
      sector: "Cloud & Software Systems",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
    {
      name: "Siemens",
      sector: "Industrial Automation & Power",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
    {
      name: "Mastercard",
      sector: "Payment Security & Fintech",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
    {
      name: "Deutsche Bank",
      sector: "Global Financial Technologies",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
    {
      name: "Texas Instruments",
      sector: "Semiconductor Hardware",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
    {
      name: "Cummins India",
      sector: "Power Generation & Mechanical",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Report",
      sourceLabel: "COEP Placement Records",
      sourceUrl: "https://www.coeptech.ac.in/placement/",
    },
  ],

  VJTI: [
    {
      name: "Morgan Stanley",
      sector: "Financial Systems Engineering",
      season: "2023–24 Season",
      evidenceType: "TPO Annual Placement Report",
      sourceLabel: "VJTI Training & Placement Office",
      sourceUrl: "https://vjti.ac.in/training-and-placement-office/",
    },
    {
      name: "Citi India",
      sector: "Banking Technology & Analytics",
      season: "2023–24 Season",
      evidenceType: "TPO Annual Placement Report",
      sourceLabel: "VJTI Training & Placement Office",
      sourceUrl: "https://vjti.ac.in/training-and-placement-office/",
    },
    {
      name: "Bank of America",
      sector: "Global Quantitative Technologies",
      season: "2023–24 Season",
      evidenceType: "TPO Annual Placement Report",
      sourceLabel: "VJTI Training & Placement Office",
      sourceUrl: "https://vjti.ac.in/training-and-placement-office/",
    },
    {
      name: "Samsung R&D",
      sector: "Mobile & Telecommunications R&D",
      season: "2023–24 Season",
      evidenceType: "TPO Annual Placement Report",
      sourceLabel: "VJTI Training & Placement Office",
      sourceUrl: "https://vjti.ac.in/training-and-placement-office/",
    },
    {
      name: "Texas Instruments",
      sector: "VLSI Circuit Design",
      season: "2023–24 Season",
      evidenceType: "TPO Annual Placement Report",
      sourceLabel: "VJTI Training & Placement Office",
      sourceUrl: "https://vjti.ac.in/training-and-placement-office/",
    },
    {
      name: "Larsen & Toubro",
      sector: "Heavy Civil & Construction",
      season: "2023–24 Season",
      evidenceType: "TPO Annual Placement Report",
      sourceLabel: "VJTI Training & Placement Office",
      sourceUrl: "https://vjti.ac.in/training-and-placement-office/",
    },
    {
      name: "Rakuten",
      sector: "E-Commerce & Distributed Cloud",
      season: "2023–24 Season",
      evidenceType: "TPO Annual Placement Report",
      sourceLabel: "VJTI Training & Placement Office",
      sourceUrl: "https://vjti.ac.in/training-and-placement-office/",
    },
  ],

  SPIT: [
    {
      name: "Microsoft",
      sector: "Core Software Engineering",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Summary",
      sourceLabel: "SPIT Placement Report",
      sourceUrl: "https://www.spit.ac.in/placements/",
    },
    {
      name: "J.P. Morgan Chase",
      sector: "Commercial & Investment Banking Tech",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Summary",
      sourceLabel: "SPIT Placement Report",
      sourceUrl: "https://www.spit.ac.in/placements/",
    },
    {
      name: "Oracle",
      sector: "Cloud Applications & Database",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Summary",
      sourceLabel: "SPIT Placement Report",
      sourceUrl: "https://www.spit.ac.in/placements/",
    },
    {
      name: "PhonePe",
      sector: "Fintech & UPI Infrastructure",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Summary",
      sourceLabel: "SPIT Placement Report",
      sourceUrl: "https://www.spit.ac.in/placements/",
    },
    {
      name: "Barclays",
      sector: "Global Markets & Banking Tech",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Summary",
      sourceLabel: "SPIT Placement Report",
      sourceUrl: "https://www.spit.ac.in/placements/",
    },
    {
      name: "WorkIndia",
      sector: "Product Platform Engineering",
      season: "2023–24 Season",
      evidenceType: "Training & Placement Cell Summary",
      sourceLabel: "SPIT Placement Report",
      sourceUrl: "https://www.spit.ac.in/placements/",
    },
  ],

  PICT: [
    {
      name: "Bloomberg",
      sector: "Financial Data & Analytics Systems",
      season: "2023–24 Season",
      evidenceType: "T&P Published Recruiter Statistics",
      sourceLabel: "PICT Placement Cell",
      sourceUrl: "https://pict.edu/placement/",
    },
    {
      name: "Amazon",
      sector: "Cloud Computing & E-Commerce",
      season: "2023–24 Season",
      evidenceType: "T&P Published Recruiter Statistics",
      sourceLabel: "PICT Placement Cell",
      sourceUrl: "https://pict.edu/placement/",
    },
    {
      name: "Veritas",
      sector: "Multi-Cloud Data Management",
      season: "2023–24 Season",
      evidenceType: "T&P Published Recruiter Statistics",
      sourceLabel: "PICT Placement Cell",
      sourceUrl: "https://pict.edu/placement/",
    },
    {
      name: "Mastercard",
      sector: "Transaction Switching & Cyber Security",
      season: "2023–24 Season",
      evidenceType: "T&P Published Recruiter Statistics",
      sourceLabel: "PICT Placement Cell",
      sourceUrl: "https://pict.edu/placement/",
    },
    {
      name: "PhonePe",
      sector: "Distributed High-Volume Systems",
      season: "2023–24 Season",
      evidenceType: "T&P Published Recruiter Statistics",
      sourceLabel: "PICT Placement Cell",
      sourceUrl: "https://pict.edu/placement/",
    },
    {
      name: "Arcesium",
      sector: "Post-Trade Investment Technology",
      season: "2023–24 Season",
      evidenceType: "T&P Published Recruiter Statistics",
      sourceLabel: "PICT Placement Cell",
      sourceUrl: "https://pict.edu/placement/",
    },
  ],

  SFIT: [
    {
      name: "Tata Consultancy Services (TCS)",
      sector: "Global Enterprise IT & Cloud",
      season: "2023–24 Season",
      evidenceType: "Placement Cell Records",
      sourceLabel: "SFIT Placement Cell",
      sourceUrl: "https://www.sfit.ac.in/Placement%20Summary.php",
    },
    {
      name: "LTI-Mindtree",
      sector: "Digital Transformation & Consulting",
      season: "2023–24 Season",
      evidenceType: "Placement Cell Records",
      sourceLabel: "SFIT Placement Cell",
      sourceUrl: "https://www.sfit.ac.in/Placement%20Summary.php",
    },
    {
      name: "Capgemini",
      sector: "Software Engineering & Cloud",
      season: "2023–24 Season",
      evidenceType: "Placement Cell Records",
      sourceLabel: "SFIT Placement Cell",
      sourceUrl: "https://www.sfit.ac.in/Placement%20Summary.php",
    },
    {
      name: "Hexaware",
      sector: "Automation & Cloud Infrastructure",
      season: "2023–24 Season",
      evidenceType: "Placement Cell Records",
      sourceLabel: "SFIT Placement Cell",
      sourceUrl: "https://www.sfit.ac.in/Placement%20Summary.php",
    },
    {
      name: "Zeus Learning",
      sector: "Educational Software Architecture",
      season: "2023–24 Season",
      evidenceType: "Placement Cell Records",
      sourceLabel: "SFIT Placement Cell",
      sourceUrl: "https://www.sfit.ac.in/Placement%20Summary.php",
    },
  ],

  WCE: [
    {
      name: "Siemens",
      sector: "Industrial Automation & Drives",
      season: "2023–24 Season",
      evidenceType: "T&P Department Annual Report",
      sourceLabel: "WCE Training & Placement",
      sourceUrl: "https://walchandsangli.ac.in/student-careers/career-development-cell/placement-in-wce/",
    },
    {
      name: "John Deere",
      sector: "Heavy Machinery & Agro-Tech",
      season: "2023–24 Season",
      evidenceType: "T&P Department Annual Report",
      sourceLabel: "WCE Training & Placement",
      sourceUrl: "https://walchandsangli.ac.in/student-careers/career-development-cell/placement-in-wce/",
    },
    {
      name: "Eaton",
      sector: "Electrical Power Management",
      season: "2023–24 Season",
      evidenceType: "T&P Department Annual Report",
      sourceLabel: "WCE Training & Placement",
      sourceUrl: "https://walchandsangli.ac.in/student-careers/career-development-cell/placement-in-wce/",
    },
    {
      name: "Mercedes-Benz R&D",
      sector: "Automotive Software & Telematics",
      season: "2023–24 Season",
      evidenceType: "T&P Department Annual Report",
      sourceLabel: "WCE Training & Placement",
      sourceUrl: "https://walchandsangli.ac.in/student-careers/career-development-cell/placement-in-wce/",
    },
    {
      name: "Atlas Copco",
      sector: "Compressor & Vacuum Engineering",
      season: "2023–24 Season",
      evidenceType: "T&P Department Annual Report",
      sourceLabel: "WCE Training & Placement",
      sourceUrl: "https://walchandsangli.ac.in/student-careers/career-development-cell/placement-in-wce/",
    },
  ],

  "VIT-MUM": [
    {
      name: "Reliance Jio",
      sector: "Telecommunications & 5G Solutions",
      season: "2023–24 Season",
      evidenceType: "Placement Overview Documentation",
      sourceLabel: "VIT Placement Cell",
      sourceUrl: "https://vit.edu.in/placement/",
    },
    {
      name: "Ugam Solutions",
      sector: "Analytics & Quantitative Consumer Intelligence",
      season: "2023–24 Season",
      evidenceType: "Placement Overview Documentation",
      sourceLabel: "VIT Placement Cell",
      sourceUrl: "https://vit.edu.in/placement/",
    },
    {
      name: "Capgemini",
      sector: "Technology Consulting & Digital Systems",
      season: "2023–24 Season",
      evidenceType: "Placement Overview Documentation",
      sourceLabel: "VIT Placement Cell",
      sourceUrl: "https://vit.edu.in/placement/",
    },
    {
      name: "Nomura",
      sector: "Global Investment Banking Technology",
      season: "2023–24 Season",
      evidenceType: "Placement Overview Documentation",
      sourceLabel: "VIT Placement Cell",
      sourceUrl: "https://vit.edu.in/placement/",
    },
    {
      name: "LTI-Mindtree",
      sector: "Software Solutions & Integration",
      season: "2023–24 Season",
      evidenceType: "Placement Overview Documentation",
      sourceLabel: "VIT Placement Cell",
      sourceUrl: "https://vit.edu.in/placement/",
    },
  ],
};

// Helper to look up dossier by code or name
export function getCollegeDossier(college: { short_code?: string; name: string }): InstitutionalDossier | null {
  const code = (college.short_code || "").toUpperCase();
  if (INSTITUTIONAL_DOSSIERS[code]) {
    return INSTITUTIONAL_DOSSIERS[code];
  }
  const name = (college.name || "").toLowerCase();
  for (const [k, d] of Object.entries(INSTITUTIONAL_DOSSIERS)) {
    if (name.includes(k.toLowerCase())) return d;
  }
  return null;
}

export function getCollegeRecruiters(college: { short_code?: string; name: string }): RecruiterCompany[] {
  const code = (college.short_code || "").toUpperCase();
  if (COLLEGE_RECRUITERS[code]) {
    return COLLEGE_RECRUITERS[code];
  }
  const name = (college.name || "").toLowerCase();
  for (const [k, list] of Object.entries(COLLEGE_RECRUITERS)) {
    if (name.includes(k.toLowerCase())) return list;
  }
  return [];
}
