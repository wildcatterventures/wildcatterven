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


  // 1. AIIMS New Delhi
  "AIIMS-DEL": {
  shortCode: "AIIMS-DEL",
  established: 1956,
  type: "Institute of National Importance",
  status: "Autonomous Parliamentary Charter",
  affiliation: "Autonomous (Degrees granted under AIIMS Act, 1956)",
  campusFootprint: "115-acre main campus in Ansari Nagar + 300-acre NCI Jhajjar extension",
  locationContext: "Ansari Nagar, Ring Road, South Delhi",
  primaryFocus: "Undergraduate Medicine (MBBS), Postgraduate Surgical Specialties & Biomedical Research",
  officialWebsite: "https://www.aiims.edu",
  verifiedAccreditation: "Institute of National Importance • NIRF Medical Rank #1 (Consecutive 2018–2024)",
  distinctiveFeatures: [
    {
      title: "Jai Prakash Narayan Apex Trauma Centre (JPNATC)",
      description: "Dedicated level-1 trauma care facility featuring computerized surgical navigation and rapid emergency triage systems.",
      category: "facility",
      sourceName: "AIIMS Trauma Centre Directorate",
      sourceUrl: "https://www.aiims.edu",
    },
    {
      title: "Dr. B.R. Ambedkar Institute Rotary Cancer Hospital (IRCH)",
      description: "Comprehensive national cancer research and treatment centre with advanced radiation oncology and robotic surgical suites.",
      category: "research",
      sourceName: "IRCH AIIMS Annual Review",
      sourceUrl: "https://www.aiims.edu",
    },
    {
      title: "Autonomous Medical Residency & Research Program",
      description: "Pioneering clinical residency model integrating bedside diagnostic training with peer-reviewed laboratory investigations.",
      category: "academic",
      sourceName: "AIIMS Academic Section",
      sourceUrl: "https://www.aiims.edu",
    },
    {
      title: "National Cancer Institute (NCI), Jhajjar",
      description: "Apex 710-bed oncology facility dedicated to cancer epidemiology, tissue banking, and translational cancer medicine.",
      category: "initiative",
      sourceName: "Ministry of Health & Family Welfare",
      sourceUrl: "https://main.mohfw.gov.in",
    },
  ],
  placementSummary: {
    season: "2023–24 Residency & Fellowship Cycle",
    placementCellName: "Academic & Residency Directorate (AIIMS New Delhi)",
    reportUrl: "https://www.aiims.edu",
    overview: "Medical graduates complete mandatory rotating clinical internships with central government stipends, recording unmatched progression into INI-CET super-specialties, international fellowships, and premier academic hospital appointments.",
  },
},

// 2. CMC Vellore
  "CMC-VEL": {
  shortCode: "CMC-VEL",
  established: 1900,
  type: "Private Autonomous Medical College",
  status: "Non-Profit Charitable Trust",
  affiliation: "The Tamil Nadu Dr. M.G.R. Medical University, Chennai",
  campusFootprint: "200-acre residential Bagayam campus + 100-acre Ranipet campus + Town Hospital",
  locationContext: "Bagayam and Vellore city, Tamil Nadu",
  primaryFocus: "MBBS, Nursing, Allied Health Sciences, Public Health & Tropical Medicine",
  officialWebsite: "https://www.cmch-vellore.edu",
  verifiedAccreditation: "NIRF Medical Rank #3 • NABH & NABL Accredited Healthcare Network",
  distinctiveFeatures: [
    {
      title: "Community Health and Development (CHAD)",
      description: "Pioneering rural outreach program delivering primary and secondary healthcare across underserved rural tribal regions.",
      category: "initiative",
      sourceName: "CMC Vellore Community Health Section",
      sourceUrl: "https://www.cmch-vellore.edu",
    },
    {
      title: "Dr. Ida S. Scudder Heritage Memorial & Hospital Complex",
      description: "Historic quaternary hospital established in 1900 with over 3,000 beds, handling over 2 million outpatients annually.",
      category: "heritage",
      sourceName: "CMC Vellore Archives",
      sourceUrl: "https://www.cmch-vellore.edu",
    },
    {
      title: "Wellcome Trust Research Laboratory",
      description: "Leading research center for gastrointestinal sciences, virology, and maternal-infant epidemiological field trials.",
      category: "research",
      sourceName: "Wellcome Trust / CMC Research Board",
      sourceUrl: "https://www.cmch-vellore.edu",
    },
    {
      title: "Low Cost Effective Care Unit (LCECU)",
      description: "Urban health centre model delivering subsidized high-quality medical and surgical care for economically marginalized populations.",
      category: "facility",
      sourceName: "CMC Clinical Services Directorate",
      sourceUrl: "https://www.cmch-vellore.edu",
    },
  ],
  placementSummary: {
    season: "2023–24 Clinical Internship Batch",
    placementCellName: "Directorate & Medical Superintendent Office",
    reportUrl: "https://www.cmch-vellore.edu",
    overview: "Graduates undergo comprehensive rotational internships with mandatory community exposure, leading to distinguished positions in national residency entrance exams, global medical bodies, and service missions.",
  },
},

// 3. JIPMER Puducherry
  "JIPMER-PDY": {
  shortCode: "JIPMER-PDY",
  established: 1823,
  type: "Institute of National Importance",
  status: "Autonomous Parliamentary Charter (JIPMER Act 2008)",
  affiliation: "Autonomous (Degrees granted under JIPMER Act, 2008)",
  campusFootprint: "195-acre residential campus in Gorimedu + Karaikal campus",
  locationContext: "Gorimedu, Puducherry",
  primaryFocus: "Undergraduate Medicine (MBBS), Public Health, Medical Technology & Specialty Care",
  officialWebsite: "https://www.jipmer.edu.in",
  verifiedAccreditation: "Institute of National Importance • NIRF Medical Rank #4–#5",
  distinctiveFeatures: [
    {
      title: "Regional Cancer Centre & Super Specialty Block",
      description: "Tertiary oncology and advanced neurosurgery, cardiothoracic, and pediatric surgery facilities serving southern India.",
      category: "facility",
      sourceName: "JIPMER Medical Directorate",
      sourceUrl: "https://www.jipmer.edu.in",
    },
    {
      title: "Multi-Disciplinary Advanced Research Facility (MACRF)",
      description: "Centrally funded scientific infrastructure housing confocal microscopy, flow cytometry, genomics, and proteomics suites.",
      category: "research",
      sourceName: "JIPMER Research Advisory Board",
      sourceUrl: "https://www.jipmer.edu.in",
    },
    {
      title: "Historic French École de Médicine Heritage",
      description: "One of the oldest medical foundations in Asia, tracing operational roots to French colonial administration in 1823.",
      category: "heritage",
      sourceName: "Government of Puducherry Archives",
      sourceUrl: "https://www.jipmer.edu.in",
    },
    {
      title: "WHO Collaborating Centre for Health Research Training",
      description: "Designated international hub conducting advanced capacity training in epidemiology, biostatistics, and health systems.",
      category: "academic",
      sourceName: "WHO Regional Office for South-East Asia",
      sourceUrl: "https://www.who.int",
    },
  ],
  placementSummary: {
    season: "2023–24 Clinical Rotation & Internship Batch",
    placementCellName: "Academic Section (JIPMER Puducherry)",
    reportUrl: "https://www.jipmer.edu.in",
    overview: "Comprehensive mandatory rotating clinical internship across emergency, critical care, and primary medicine with central government compensation, showing outstanding INI-CET pass rates.",
  },
},

// 4. KMC Manipal
  "KMC-MAN": {
  shortCode: "KMC-MAN",
  established: 1953,
  type: "Deemed to be University Constituent",
  status: "Constituent Unit of Manipal Academy of Higher Education (MAHE) — Institution of Eminence",
  affiliation: "Manipal Academy of Higher Education (MAHE)",
  campusFootprint: "313-acre university town campus in Manipal",
  locationContext: "Manipal, Udupi district, coastal Karnataka",
  primaryFocus: "MBBS, Super-Specialty Medical Sciences & Biomedical Innovation",
  officialWebsite: "https://www.manipal.edu/kmc-manipal.html",
  verifiedAccreditation: "NIRF Medical Rank #9–#10 • NAAC Grade 'A++' (MAHE)",
  distinctiveFeatures: [
    {
      title: "Kasturba Hospital Quaternary Care Complex",
      description: "2,030-bed teaching hospital with dedicated cardiac, neuro, pediatric, and bone marrow transplant units.",
      category: "facility",
      sourceName: "Kasturba Hospital Manipal",
      sourceUrl: "https://www.manipal.edu/kmc-manipal.html",
    },
    {
      title: "MAHE Museum of Anatomy & Pathology (MAP)",
      description: "One of Asia's largest anatomical museums housing over 3,000 preserved anatomical, pathological, and forensic specimens.",
      category: "heritage",
      sourceName: "MAHE Department of Anatomy",
      sourceUrl: "https://manipal.edu",
    },
    {
      title: "Centre for Clinical and Experimental Research (CCER)",
      description: "Dedicated clinical trials and biomedical laboratory conducting translational research in pharmacology and infectious diseases.",
      category: "research",
      sourceName: "KMC Research Cell",
      sourceUrl: "https://www.manipal.edu/kmc-manipal.html",
    },
    {
      title: "Advanced Medical Simulation Centre",
      description: "High-fidelity computer-controlled mannequin simulators for emergency triage, laparoscopy, and intensive care training.",
      category: "academic",
      sourceName: "MAHE Clinical Skills Lab",
      sourceUrl: "https://manipal.edu",
    },
  ],
  placementSummary: {
    season: "2023–24 Clinical Internship Season",
    placementCellName: "MAHE Career Advisory & KMC Dean's Office",
    reportUrl: "https://www.manipal.edu/kmc-manipal.html",
    overview: "Interns rotate through Kasturba Hospital with high clinical caseloads, exhibiting strong NEET-PG qualifying percentages and global residency matches (USMLE / PLAB).",
  },
},

// 5. AFMC Pune
  "AFMC-PUN": {
  shortCode: "AFMC-PUN",
  established: 1948,
  type: "Government Military Medical College",
  status: "Armed Forces Medical Services (Ministry of Defence, Govt. of India)",
  affiliation: "Maharashtra University of Health Sciences (MUHS), Nashik",
  campusFootprint: "119-acre military campus in Wanowrie, Pune",
  locationContext: "Wanowrie, Pune, Maharashtra",
  primaryFocus: "Military Medicine, Combat Trauma, Disaster Healthcare & MBBS",
  officialWebsite: "https://afmc.nic.in",
  verifiedAccreditation: "NAAC Grade 'A' (CGPA 3.66) • NIRF Medical Rank #30",
  distinctiveFeatures: [
    {
      title: "Direct Commissioning into Armed Forces Medical Services (AFMS)",
      description: "Graduates are commissioned as officers into the Indian Army, Indian Navy, or Indian Air Force as military doctors.",
      category: "initiative",
      sourceName: "Directorate General Armed Forces Medical Services",
      sourceUrl: "https://afmc.nic.in",
    },
    {
      title: "Command Hospital (Southern Command) Clinical Base",
      description: "Premier 1,000+ bed military tertiary healthcare institution providing clinical training across combat medicine and specialties.",
      category: "facility",
      sourceName: "Command Hospital SC Pune",
      sourceUrl: "https://afmc.nic.in",
    },
    {
      title: "Combat Trauma & High Altitude Medicine Curriculum",
      description: "Specialized training modules covering aviation medicine, submarine medicine, frostbite management, and combat triage.",
      category: "academic",
      sourceName: "AFMC Academic Council",
      sourceUrl: "https://afmc.nic.in",
    },
    {
      title: "Armed Forces Medical Research Committee (AFMRC) Hub",
      description: "Defense ministry research forum funding clinical investigations focused on troop health, immunology, and trauma recovery.",
      category: "research",
      sourceName: "DGAFMS Research Directorate",
      sourceUrl: "https://afmc.nic.in",
    },
  ],
  placementSummary: {
    season: "2023–24 Officer Commissioning Batch",
    placementCellName: "DGAFMS Commissioning Board (Ministry of Defence)",
    reportUrl: "https://afmc.nic.in",
    overview: "100% of eligible cadets are commissioned directly as Lieutenants / Surgeon Sub-Lieutenants / Flying Officers into the Armed Forces Medical Services with permanent or short-service commissions.",
  },
},

// 1. IIM Ahmedabad
  "IIMA-AHM": {
  shortCode: "IIMA-AHM",
  established: 1961,
  type: "Institute of National Importance",
  status: "Autonomous Parliamentary Charter (IIM Act 2017)",
  affiliation: "Autonomous",
  campusFootprint: "102-acre red-brick heritage campus in Vastrapur",
  locationContext: "Vastrapur, Ahmedabad, Gujarat",
  primaryFocus: "Master of Business Administration (PGP/MBA), Executive PGP, Doctoral Programs",
  officialWebsite: "https://www.iima.ac.in",
  verifiedAccreditation: "NIRF Management Rank #1 • EQUIS Accredited • FT Global Top 50",
  distinctiveFeatures: [
    {
      title: "Louis Kahn Heritage Red-Brick Campus",
      description: "Architectural masterpiece by American architect Louis Kahn featuring striking monolithic geometric brick arches and open plazas.",
      category: "heritage",
      sourceName: "IIM Ahmedabad Campus Heritage Committee",
      sourceUrl: "https://www.iima.ac.in",
    },
    {
      title: "Pioneering Case Method Pedagogy",
      description: "First Indian business school to adopt Harvard Business School case method, grounding business education in real-world decisions.",
      category: "academic",
      sourceName: "IIMA Academic Section",
      sourceUrl: "https://www.iima.ac.in",
    },
    {
      title: "CIIE.CO Innovation & Startup Accelerator",
      description: "Country's top university startup incubator having supported over 1,500 ventures with venture funding and acceleration.",
      category: "research",
      sourceName: "CIIE.CO IIM Ahmedabad",
      sourceUrl: "https://ciie.co",
    },
    {
      title: "Vikram Sarabhai Library Research Hub",
      description: "World-class digital business research library housing over 200,000 management volumes and leading global financial terminals.",
      category: "facility",
      sourceName: "IIMA Library Board",
      sourceUrl: "https://library.iima.ac.in",
    },
  ],
  placementSummary: {
    season: "2023–24 PGP Final Placement Season",
    placementCellName: "Placement Committee (IIM Ahmedabad)",
    reportUrl: "https://www.iima.ac.in/placements",
    overview: "Universal placement audited under Indian Placement Reporting Standards (IPRS), led by top strategy consulting (McKinsey, BCG, Bain), investment banking, private equity, and enterprise tech roles.",
  },
},

// 2. IIM Bangalore
  "IIMB-BLR": {
  shortCode: "IIMB-BLR",
  established: 1973,
  type: "Institute of National Importance",
  status: "Autonomous Parliamentary Charter (IIM Act 2017)",
  affiliation: "Autonomous",
  campusFootprint: "100-acre stone pergola campus on Bannerghatta Road",
  locationContext: "Bannerghatta Road, South Bengaluru, Karnataka",
  primaryFocus: "PGP/MBA, Business Analytics, Public Policy & Executive Management",
  officialWebsite: "https://www.iimb.ac.in",
  verifiedAccreditation: "NIRF Management Rank #2 • EQUIS and AACSB Accredited",
  distinctiveFeatures: [
    {
      title: "B.V. Doshi Stone Pergola Architecture",
      description: "Iconic stone-and-greenery architecture designed by Pritzker laureate Balkrishna Doshi, integrating natural corridors and gardens.",
      category: "heritage",
      sourceName: "IIM Bangalore Architectural Archives",
      sourceUrl: "https://www.iimb.ac.in",
    },
    {
      title: "NSRCEL Entrepreneurship Ecosystem",
      description: "India's premier startup incubator supporting woman entrepreneurs, social startups, and deep-tech ventures in Bengaluru.",
      category: "initiative",
      sourceName: "NSRCEL IIM Bangalore",
      sourceUrl: "https://nsrcel.org",
    },
    {
      title: "Centre for Capital Markets and Risk Management (CCMRM)",
      description: "Financial research hub conducting algorithmic trading modeling, market microstructure, and macroeconomic risk analysis.",
      category: "research",
      sourceName: "CCMRM IIMB Research Section",
      sourceUrl: "https://www.iimb.ac.in",
    },
    {
      title: "Data Science & AI Management Specialization",
      description: "Integrated MBA in Business Analytics (PGP-BA) partnering with Bengaluru technology enterprises for machine learning applications.",
      category: "academic",
      sourceName: "IIMB Academic Council",
      sourceUrl: "https://www.iimb.ac.in",
    },
  ],
  placementSummary: {
    season: "2023–24 PGP Placement Season",
    placementCellName: "Career Development Services (CDS), IIM Bangalore",
    reportUrl: "https://www.iimb.ac.in",
    overview: "100% placement across global management consulting, corporate finance, private equity, fintech, and high-growth technology product management.",
  },
},

// 3. IIM Calcutta
  "IIMC-KOL": {
  shortCode: "IIMC-KOL",
  established: 1961,
  type: "Institute of National Importance",
  status: "Autonomous Parliamentary Charter (IIM Act 2017)",
  affiliation: "Autonomous (Co-founded with MIT Sloan School of Management)",
  campusFootprint: "135-acre 7-lakes natural campus in Joka",
  locationContext: "Diamond Harbour Road, Joka, Kolkata, West Bengal",
  primaryFocus: "PGP/MBA, Quantitative Finance, Financial Engineering & Analytics",
  officialWebsite: "https://www.iimcal.ac.in",
  verifiedAccreditation: "Triple Crown Accreditation (AACSB, AMBA, EQUIS) • NIRF Management Rank #6–#7",
  distinctiveFeatures: [
    {
      title: "Financial Research and Trading Laboratory (FRTL)",
      description: "State-of-the-art live trading lab with real-time Bloomberg terminals, Reuters data feeds, and high-frequency trading simulations.",
      category: "facility",
      sourceName: "FRTL IIM Calcutta",
      sourceUrl: "https://www.iimcal.ac.in",
    },
    {
      title: "Joka 7-Lakes Biodiversity Ecosystem",
      description: "Vast natural campus renowned for seven interconnected lakes supporting migratory avian wildlife and serene academic environs.",
      category: "heritage",
      sourceName: "IIM Calcutta Estate Directorate",
      sourceUrl: "https://www.iimcal.ac.in",
    },
    {
      title: "IIM Calcutta Innovation Park (IIMCIP)",
      description: "Regional startup incubation network fostering sustainable entrepreneurship across Eastern and Northeastern states.",
      category: "initiative",
      sourceName: "IIMCIP Official Portal",
      sourceUrl: "https://iimcip.org",
    },
    {
      title: "Pioneering Quantitative Finance Curriculum",
      description: "Nationally recognized authority in derivatives pricing, portfolio optimization, and stochastic mathematical finance.",
      category: "academic",
      sourceName: "IIMC Finance Department",
      sourceUrl: "https://www.iimcal.ac.in",
    },
  ],
  placementSummary: {
    season: "2023–24 PGP Final Placements",
    placementCellName: "Placement Office (IIM Calcutta)",
    reportUrl: "https://www.iimcal.ac.in",
    overview: "Industry-leading recruitment across international bulge-bracket investment banks, private equity funds, hedge funds, and strategic management consultancies.",
  },
},

// 4. XLRI Jamshedpur
  "XLRI-JAM": {
  shortCode: "XLRI-JAM",
  established: 1949,
  type: "Private Autonomous Business School",
  status: "Society of Jesus (Oldest Business School in India)",
  affiliation: "Autonomous (Approved by AICTE)",
  campusFootprint: "50-acre verdant campus on Marine Drive, Circuit House Area",
  locationContext: "Circuit House Area, Jamshedpur, Jharkhand",
  primaryFocus: "Human Resource Management (PGDM-HRM), Business Management (PGDM-BM)",
  officialWebsite: "https://www.xlri.ac.in",
  verifiedAccreditation: "AACSB and AMBA Accredited • NIRF Management Rank #9–#10",
  distinctiveFeatures: [
    {
      title: "Premier Human Resource Management (HRM) Institute in Asia",
      description: "Consistently ranked as the finest specialized HR management program in India and the Asia-Pacific region.",
      category: "academic",
      sourceName: "XLRI Academic Council",
      sourceUrl: "https://www.xlri.ac.in",
    },
    {
      title: "Father Arrupe Centre for Excellence in Ethics (FACE)",
      description: "Dedicated ethics and corporate governance research institute embedding sustainability and human rights into leadership.",
      category: "initiative",
      sourceName: "FACE XLRI Jamshedpur",
      sourceUrl: "https://www.xlri.ac.in",
    },
    {
      title: "Sir Jehangir Ghandy Library & Archives",
      description: "Extensive collections specializing in labor economics, industrial relations, behavioral science, and management strategy.",
      category: "facility",
      sourceName: "XLRI Library Division",
      sourceUrl: "https://www.xlri.ac.in",
    },
    {
      title: "Jesuit Heritage & Value-Driven Management",
      description: "Founded in 1949 by Jesuit fathers in steel town Jamshedpur, championing ethical labor relations and stakeholder equity.",
      category: "heritage",
      sourceName: "XLRI Institutional Archives",
      sourceUrl: "https://www.xlri.ac.in",
    },
  ],
  placementSummary: {
    season: "2023–24 PGDM Final Placements",
    placementCellName: "Placement Committee (XLRI Jamshedpur)",
    reportUrl: "https://www.xlri.ac.in/recruiters",
    overview: "100% placement with leading international consulting firms, FMCG conglomerates, Fortune 500 tech firms, and apex corporate HR leadership tracks.",
  },
},

// 5. FMS Delhi
  "FMS-DEL": {
  shortCode: "FMS-DEL",
  established: 1954,
  type: "Central University Management Faculty",
  status: "Constituent Department of University of Delhi",
  affiliation: "University of Delhi (Central University)",
  campusFootprint: "Urban campus in University of Delhi North Campus",
  locationContext: "North Campus, Chhatra Marg, Delhi",
  primaryFocus: "Full-Time MBA, Executive MBA & Management Research",
  officialWebsite: "https://fms.edu",
  verifiedAccreditation: "UGC Recognized • Consistently Top 5 India in Return on Investment (ROI)",
  distinctiveFeatures: [
    {
      title: "Legendary Placement-to-Fee Return on Investment (ROI)",
      description: "Subsidized central university tuition coupled with corporate salary outcomes on par with top Indian Institutes of Management.",
      category: "initiative",
      sourceName: "FMS Corporate Relations",
      sourceUrl: "https://fms.edu",
    },
    {
      title: "Delhi University North Campus Academic Heritage",
      description: "Historic legacy operating as one of India's earliest university business departments, founded under the University of Delhi in 1954.",
      category: "heritage",
      sourceName: "University of Delhi Archives",
      sourceUrl: "https://du.ac.in",
    },
    {
      title: "Student-Run Professional Societies",
      description: "Entire campus life and corporate relations driven autonomously by student bodies including Systems, Finance, and Marketing societies.",
      category: "academic",
      sourceName: "FMS Student Body Registry",
      sourceUrl: "https://fms.edu",
    },
    {
      title: "Central Reference Library & Management Commons",
      description: "Access to Delhi University's massive central library collection alongside specialized business research subscriptions.",
      category: "facility",
      sourceName: "FMS Library Division",
      sourceUrl: "https://fms.edu",
    },
  ],
  placementSummary: {
    season: "2023–24 MBA Final Placement Season",
    placementCellName: "Corporate Relations and Placements (FMS Delhi)",
    reportUrl: "https://fms.edu",
    overview: "100% placement across premier BFSI, consulting, FMCG, and technology companies with exceptionally low student debt burden.",
  },
},

// 1. Hindu College, Delhi
  "HINDU-DEL": {
  shortCode: "HINDU-DEL",
  established: 1899,
  type: "Central University Constituent College",
  status: "Constituent College of University of Delhi",
  affiliation: "University of Delhi",
  campusFootprint: "25-acre historic green campus in North Campus, Delhi",
  locationContext: "Sudhir Bose Marg, University Enclave, North Campus, Delhi",
  primaryFocus: "Humanities, Social Sciences, Pure Sciences, Economics & Commerce",
  officialWebsite: "https://www.hinducollege.ac.in",
  verifiedAccreditation: "NIRF College Rank #1 (2023 & 2024) • NAAC Grade 'A+' (CGPA 3.60)",
  distinctiveFeatures: [
    {
      title: "Nationalist Freedom Movement Intellectual Heritage",
      description: "Established in 1899 as an indigenous educational center, playing an active role during the Quit India Movement and freedom struggle.",
      category: "heritage",
      sourceName: "Hindu College Heritage Society",
      sourceUrl: "https://www.hinducollege.ac.in",
    },
    {
      title: "Hindu College Student Parliament",
      description: "India's oldest collegiate democratic student parliament with an elected Prime Minister and Cabinet, operating since 1935.",
      category: "academic",
      sourceName: "Hindu College Student Union Archives",
      sourceUrl: "https://www.hinducollege.ac.in",
    },
    {
      title: "Premier Debating and Literary Societies",
      description: "Home to landmark societies including The Hindu College Debating Society and Ibtida dramatics, nurturing prominent public intellectuals.",
      category: "initiative",
      sourceName: "Cultural Council Hindu College",
      sourceUrl: "https://www.hinducollege.ac.in",
    },
    {
      title: "Sushila Devi Advanced Humanities & Science Complex",
      description: "Modernized research and lecture complex providing specialized research laboratories, archival rooms, and multimedia seminar rooms.",
      category: "facility",
      sourceName: "Hindu College Administration",
      sourceUrl: "https://www.hinducollege.ac.in",
    },
  ],
  placementSummary: {
    season: "2023–24 Campus Recruitment Season",
    placementCellName: "Disha — Placement and Internship Cell",
    reportUrl: "https://www.hinducollege.ac.in",
    overview: "Robust placements across global consulting (Bain, McKinsey, BCG), economic research, public policy fellowships, and premier civil service entries.",
  },
},

// 2. Fergusson College, Pune
  "FC-PUN": {
  shortCode: "FC-PUN",
  established: 1885,
  type: "Autonomous Government-Aided College",
  status: "Deccan Education Society",
  affiliation: "Savitribai Phule Pune University (SPPU)",
  campusFootprint: "65-acre heritage campus at the foot of Fergusson Hill",
  locationContext: "Fergusson College Road, Shivajinagar, Pune, Maharashtra",
  primaryFocus: "Arts, Humanities, Social Sciences, Natural Sciences & Computer Science",
  officialWebsite: "https://www.fergusson.edu",
  verifiedAccreditation: "NAAC Grade 'A' (CGPA 3.62) • UGC College of Excellence",
  distinctiveFeatures: [
    {
      title: "Gothic Main Building & Historical Landmark",
      description: "Stately 1885 Gothic architectural landmark established by national leaders Lokmanya Tilak, Gopal Ganesh Agarkar, and Vishnushastri Chiplunkar.",
      category: "heritage",
      sourceName: "Deccan Education Society",
      sourceUrl: "https://www.fergusson.edu",
    },
    {
      title: "Bai Jerbai Wadia Central Library",
      description: "Historic 1929 library housing over 300,000 rare historical manuscripts, maps, and colonial administrative records.",
      category: "facility",
      sourceName: "Fergusson Library Division",
      sourceUrl: "https://www.fergusson.edu",
    },
    {
      title: "Renowned Departments of Economics & Psychology",
      description: "Nationally distinguished programs with extensive focus on behavioral psychology, economic policy, and sociolinguistics.",
      category: "academic",
      sourceName: "Academic Section FC Pune",
      sourceUrl: "https://www.fergusson.edu",
    },
    {
      title: "Social Responsibility & Hill Conservation Cell",
      description: "Active student environmental initiative dedicated to biodiversity conservation across the adjoining Fergusson Hill reserve.",
      category: "initiative",
      sourceName: "FC Green Club",
      sourceUrl: "https://www.fergusson.edu",
    },
  ],
  placementSummary: {
    season: "2023–24 Career and Placement Season",
    placementCellName: "Career Guidance and Placement Cell",
    reportUrl: "https://www.fergusson.edu",
    overview: "Active hiring in media houses, market research, content strategy, publishing, and exceptional progression to JNU, TISS, Oxford, and civil service academies.",
  },
},

// 3. St. Xavier's College, Mumbai
  "SXC-MUM": {
  shortCode: "SXC-MUM",
  established: 1869,
  type: "Autonomous Private-Aided Jesuit College",
  status: "Society of Jesus (Autonomous since 2010)",
  affiliation: "University of Mumbai",
  campusFootprint: "3-acre heritage Indo-Gothic urban campus in South Mumbai",
  locationContext: "5, Mahapalika Marg, Dhobi Talao, Fort, Mumbai, Maharashtra",
  primaryFocus: "Arts, Mass Media (BAMMC), Humanities, Psychology, Economics & Pure Sciences",
  officialWebsite: "https://xaviers.edu",
  verifiedAccreditation: "NAAC Grade 'A+' (CGPA 3.64) • NIRF College Rank #89",
  distinctiveFeatures: [
    {
      title: "Protected Indo-Gothic National Heritage Landmark",
      description: "Architectural masterpiece built in 1869 with dramatic stone arches, stained glass windows, and a central quadrangle.",
      category: "heritage",
      sourceName: "Mumbai Heritage Conservation Committee",
      sourceUrl: "https://xaviers.edu",
    },
    {
      title: "Malhar Inter-Collegiate Youth Festival",
      description: "One of Asia's oldest and largest student-managed collegiate cultural and literary festivals, founded in 1979.",
      category: "initiative",
      sourceName: "Malhar Organizing Committee",
      sourceUrl: "https://xaviers.edu",
    },
    {
      title: "Heras Institute of Indian History and Culture",
      description: "Internationally renowned post-graduate research institute housing ancient sculptures, inscriptions, and Jesuit historical archives.",
      category: "research",
      sourceName: "Heras Institute SXC Mumbai",
      sourceUrl: "https://xaviers.edu",
    },
    {
      title: "Pioneering Bachelor of Mass Media (BAMMC) Program",
      description: "India's landmark undergraduate curriculum for journalism, advertising, audio-visual production, and film studies.",
      category: "academic",
      sourceName: "SXC Mass Media Department",
      sourceUrl: "https://xaviers.edu",
    },
  ],
  placementSummary: {
    season: "2023–24 Placement Season",
    placementCellName: "Placement and Advisory Cell",
    reportUrl: "https://xaviers.edu",
    overview: "Recruiters span international advertising conglomerates, prominent media houses, financial research bureaus (Citi, KPMG), and prestigious global postgraduate scholarships.",
  },
},

// 4. Loyola College, Chennai
  "LOYOLA-CHE": {
  shortCode: "LOYOLA-CHE",
  established: 1925,
  type: "Autonomous Private-Aided Jesuit College",
  status: "Society of Jesus (Autonomous College of Excellence)",
  affiliation: "University of Madras",
  campusFootprint: "99-acre verdant central campus in Nungambakkam",
  locationContext: "Sterling Road, Nungambakkam, Chennai, Tamil Nadu",
  primaryFocus: "Arts, Visual Communication, Social Work, Economics & Commerce",
  officialWebsite: "https://www.loyolacollege.edu",
  verifiedAccreditation: "NIRF College Rank #8–#10 • NAAC Grade 'A++' (CGPA 3.55)",
  distinctiveFeatures: [
    {
      title: "Department of Visual Communication (VisCom)",
      description: "Pioneering visual media department with full television production studios, animation suites, and screening auditoriums.",
      category: "facility",
      sourceName: "Loyola VisCom Department",
      sourceUrl: "https://www.loyolacollege.edu",
    },
    {
      title: "Indo-Gothic Central Church Spire & Heritage Campus",
      description: "Historic 1925 central chapel and leafy pedestrian campus renowned for discipline, heritage, and collegiate sports culture.",
      category: "heritage",
      sourceName: "Loyola College Archives",
      sourceUrl: "https://www.loyolacollege.edu",
    },
    {
      title: "Loyola Institute of Social Science Training and Research (LISSTAR)",
      description: "Interdisciplinary research institute conducting empirical field surveys in human rights, labor economics, and rural development.",
      category: "research",
      sourceName: "LISSTAR Loyola Chennai",
      sourceUrl: "https://www.loyolacollege.edu",
    },
    {
      title: "Mandatory Student Rural Outreach Department",
      description: "Institutional requirement embedding social service and community immersion into all undergraduate degree qualifications.",
      category: "initiative",
      sourceName: "Loyola Outreach Section",
      sourceUrl: "https://www.loyolacollege.edu",
    },
  ],
  placementSummary: {
    season: "2023–24 Placement Cycle",
    placementCellName: "Loyola Training and Placement Cell",
    reportUrl: "https://www.loyolacollege.edu",
    overview: "Substantial recruitment into media broadcasting networks, digital production agencies, consulting, corporate banking, and public service pathways.",
  },
},

// 5. St. Xavier's College, Kolkata
  "SXC-KOL": {
  shortCode: "SXC-KOL",
  established: 1860,
  type: "Autonomous Private-Aided Jesuit College",
  status: "Society of Jesus (Autonomous College of Potential for Excellence)",
  affiliation: "University of Calcutta",
  campusFootprint: "Historic Park Street campus + Raghabpur rural extension + EM Bypass campus",
  locationContext: "30, Mother Teresa Sarani (Park Street), Kolkata, West Bengal",
  primaryFocus: "Arts, Humanities, English, Mass Communication, Political Science & Commerce",
  officialWebsite: "https://www.sxccal.edu",
  verifiedAccreditation: "NIRF College Rank #5–#7 • NAAC Grade 'A++' (CGPA 3.77)",
  distinctiveFeatures: [
    {
      title: "Tagore and Bose Historic Literary Heritage",
      description: "Distinguished historic campus where Nobel Laureate Rabindranath Tagore and scientist Jagadish Chandra Bose studied.",
      category: "heritage",
      sourceName: "St. Xavier's College Heritage Society",
      sourceUrl: "https://www.sxccal.edu",
    },
    {
      title: "Father Depelchin Astronomical Observatory",
      description: "Historic 19th-century astronomical observatory established on the main college terrace for astrophysics instruction.",
      category: "facility",
      sourceName: "SXC Department of Physics & Astronomy",
      sourceUrl: "https://www.sxccal.edu",
    },
    {
      title: "Department of Mass Communication and Videography (MCV)",
      description: "Premier media training center equipped with digital video editing labs, professional lighting studios, and screening theaters.",
      category: "academic",
      sourceName: "SXC MCV Department",
      sourceUrl: "https://www.sxccal.edu",
    },
    {
      title: "Xaviers Action Group (XAG) Social Commitment",
      description: "Student community welfare network organizing health camps, rural literacy drives, and disaster relief operations in Bengal.",
      category: "initiative",
      sourceName: "XAG Kolkata",
      sourceUrl: "https://www.sxccal.edu",
    },
  ],
  placementSummary: {
    season: "2023–24 Placement Season",
    placementCellName: "Central Placement Cell",
    reportUrl: "https://www.sxccal.edu",
    overview: "Over 100 enterprise recruiters including Big 4 audit and consulting firms, financial research houses, digital publishing firms, and media outlets.",
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
