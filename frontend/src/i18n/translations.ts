export type Language = 'en' | 'hi' | 'kn';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    overview: string;
    pos: string;
    products: string;
    transactions: string;
    customers: string;
    campaigns: string;
    campaignInsights: string;
    analytics: string;
    askMitra: string;
    settings: string;
  };
  header: {
    storeOpen: string;
    demoMode: string;
    notifications: string;
    soundboxActive: string;
    soundboxMuted: string;
  };
  overview: {
    title: string;
    subtitle: string;
    todaySales: string;
    yesterdaySales: string;
    ordersToday: string;
    avgBill: string;
    grossProfit: string;
    totalCustomers: string;
    lowStockCount: string;
    bestSeller: string;
    peakHour: string;
    dailyBrief: string;
    refreshBrief: string;
    hourlySalesChart: string;
    weeklyTrendChart: string;
    topProductsTitle: string;
    lowStockTitle: string;
    quickPOS: string;
  };
  pos: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allCategories: string;
    cartTitle: string;
    emptyCart: string;
    stock: string;
    outOfStock: string;
    subtotal: string;
    discount: string;
    applyDiscount: string;
    discountType: string;
    discountValue: string;
    finalAmount: string;
    generateQR: string;
    clearCart: string;
    selectCustomer: string;
    anonymousCustomer: string;
    demoQRTitle: string;
    demoQRDisclaimer: string;
    simulateSuccess: string;
    simulateFail: string;
    cancelPayment: string;
  };
  products: {
    title: string;
    subtitle: string;
    addProduct: string;
    adjustStock: string;
    sku: string;
    name: string;
    category: string;
    sellingPrice: string;
    costPrice: string;
    currentStock: string;
    status: string;
    daysCover: string;
    actions: string;
    healthy: string;
    low: string;
    critical: string;
  };
  campaigns: {
    title: string;
    subtitle: string;
    createCampaign: string;
    name: string;
    objective: string;
    targetAudience: string;
    discountType: string;
    discountValue: string;
    budget: string;
    holdoutNotice: string;
    treatmentGroup: string;
    holdoutGroup: string;
    approvalTitle: string;
    approvalReadback: string;
    approveBtn: string;
    rejectBtn: string;
    simulatedExecutionNotice: string;
    executeSimulation: string;
  };
  scorecard: {
    title: string;
    subtitle: string;
    fastForwardBtn: string;
    treatmentRevenue: string;
    holdoutRevenue: string;
    treatmentPerCust: string;
    holdoutPerCust: string;
    incrementalRevenue: string;
    campaignCost: string;
    revenueMultiple: string;
    profitROI: string;
    aiNotes: string;
    disclaimer: string;
  };
  assistant: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    send: string;
    suggestedQueries: string;
    clearChat: string;
    disclaimer: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "MerchantMitra",
    tagline: "Your AI-Powered Business Growth Partner",
    nav: {
      overview: "Overview",
      pos: "Point of Sale",
      products: "Products & Inventory",
      transactions: "Transactions",
      customers: "Customers",
      campaigns: "Campaigns",
      campaignInsights: "Campaign Insights",
      analytics: "Business Analytics",
      askMitra: "Ask Mitra",
      settings: "Settings",
    },
    header: {
      storeOpen: "Store Open",
      demoMode: "Demo Simulation Active",
      notifications: "Alerts",
      soundboxActive: "Soundbox Audio On",
      soundboxMuted: "Soundbox Muted",
    },
    overview: {
      title: "Business Overview",
      subtitle: "Live financial KPIs, sales velocity, and inventory pulse for Ramesh General Stores.",
      todaySales: "Today's Sales",
      yesterdaySales: "Yesterday's Sales",
      ordersToday: "Orders Today",
      avgBill: "Avg Bill Value",
      grossProfit: "Est. Gross Profit",
      totalCustomers: "Total Customers",
      lowStockCount: "Low Stock Items",
      bestSeller: "Top Product",
      peakHour: "Peak Business Hour",
      dailyBrief: "AI Daily Business Brief",
      refreshBrief: "Refresh Brief",
      hourlySalesChart: "Today's Hourly Sales Velocity",
      weeklyTrendChart: "7-Day Sales & Profit Performance",
      topProductsTitle: "Best-Selling Products",
      lowStockTitle: "Low Stock & Reorder Warnings",
      quickPOS: "Open Billing Counter",
    },
    pos: {
      title: "Point of Sale (POS)",
      subtitle: "Fast billing counter with decimal-safe pricing and simulated UPI QR code generation.",
      searchPlaceholder: "Search by product name or SKU (e.g., Parle-G, Milk)...",
      allCategories: "All Categories",
      cartTitle: "Current Bill",
      emptyCart: "Your cart is empty. Click on items to add them to the bill.",
      stock: "Stock",
      outOfStock: "Out of Stock",
      subtotal: "Subtotal",
      discount: "Discount",
      applyDiscount: "Apply Discount",
      discountType: "Discount Type",
      discountValue: "Value",
      finalAmount: "Final Payable Amount",
      generateQR: "Generate UPI QR",
      clearCart: "Clear Bill",
      selectCustomer: "Select Customer (Optional)",
      anonymousCustomer: "Walk-in Customer (Anonymous)",
      demoQRTitle: "Scan Demo UPI QR Code",
      demoQRDisclaimer: "DEMO PAYMENT — NO REAL MONEY WILL BE TRANSFERRED",
      simulateSuccess: "Simulate Successful Payment",
      simulateFail: "Simulate Failed Payment",
      cancelPayment: "Cancel Transaction",
    },
    products: {
      title: "Products & Inventory Management",
      subtitle: "Manage product catalogue, track real-time stock levels, and view days-of-stock cover.",
      addProduct: "Add New Product",
      adjustStock: "Adjust Stock",
      sku: "SKU",
      name: "Product Name",
      category: "Category",
      sellingPrice: "Selling Price",
      costPrice: "Cost Price",
      currentStock: "Current Stock",
      status: "Cover Status",
      daysCover: "Days of Cover",
      actions: "Actions",
      healthy: "Healthy",
      low: "Low Stock",
      critical: "Critical",
    },
    campaigns: {
      title: "AI Customer Campaigns & Experiments",
      subtitle: "Generate margin-safe marketing campaigns with strict 10% holdout group controls.",
      createCampaign: "Draft New Campaign",
      name: "Campaign Name",
      objective: "Campaign Objective",
      targetAudience: "Target Audience",
      discountType: "Discount Format",
      discountValue: "Discount Amount",
      budget: "Max Budget (₹)",
      holdoutNotice: "10% Holdout Control Group automatically isolated to measure true incremental uplift.",
      treatmentGroup: "Treatment Audience (Receives Offer)",
      holdoutGroup: "Holdout Audience (Strictly Excluded)",
      approvalTitle: "Merchant Campaign Approval Read-back",
      approvalReadback: "Before executing, please verify the audience split and estimated liabilities.",
      approveBtn: "Approve Campaign",
      rejectBtn: "Reject Campaign",
      simulatedExecutionNotice: "Simulated Campaign Execution — No actual SMS/WhatsApp messages are sent to real people.",
      executeSimulation: "Execute Simulated Campaign",
    },
    scorecard: {
      title: "Campaign Uplift Scorecard",
      subtitle: "Measure true campaign incrementality by comparing treated customers against the uncontacted holdout group.",
      fastForwardBtn: "FAST-FORWARD 7 DAYS",
      treatmentRevenue: "Treatment Group Revenue",
      holdoutRevenue: "Holdout Group Revenue",
      treatmentPerCust: "Treatment Rev / Customer",
      holdoutPerCust: "Holdout Rev / Customer",
      incrementalRevenue: "Est. Incremental Revenue",
      campaignCost: "Redeemed Campaign Cost",
      revenueMultiple: "Revenue-to-Cost Ratio",
      profitROI: "Est. Gross Profit ROI",
      aiNotes: "AI Uplift Interpretation",
      disclaimer: "SIMULATED EXPERIMENT RESULTS — ILLUSTRATIVE, NOT ACTUAL MEASURED RESULTS",
    },
    assistant: {
      title: "Ask Mitra — AI Merchant Business Copilot",
      subtitle: "Ask questions about your sales, stock, profit, and customers. Answers powered by direct database queries.",
      inputPlaceholder: "Ask Mitra a question (e.g., 'What is my Parle-G stock?' or 'How much did I sell today?')...",
      send: "Send",
      suggestedQueries: "Suggested Questions",
      clearChat: "Clear History",
      disclaimer: "Zero Hallucination Guarantee: Every number is derived from database queries and calculation logic.",
    },
  },
  hi: {
    appName: "मर्चेंट मित्रा",
    tagline: "आपका एआई-संचालित व्यापार विकास साथी",
    nav: {
      overview: "डैशबोर्ड",
      pos: "पीओएस बिलिंग",
      products: "उत्पाद एवं स्टॉक",
      transactions: "लेनदेन इतिहास",
      customers: "ग्राहक सूची",
      campaigns: "मार्केटिंग अभियान",
      campaignInsights: "अभियान रिपोर्ट",
      analytics: "व्यापार विश्लेषण",
      askMitra: "मित्रा से पूछें",
      settings: "सेटिंग्स",
    },
    header: {
      storeOpen: "दुकान खुली है",
      demoMode: "डेमो सिमुलेशन सक्रिय",
      notifications: "अलर्ट",
      soundboxActive: "साउंडबॉक्स चालू",
      soundboxMuted: "साउंडबॉक्स म्यूट",
    },
    overview: {
      title: "व्यापार सारांश",
      subtitle: "रमेश जनरल स्टोर्स की लाइव वित्तीय स्थिति, बिक्री और स्टॉक की जानकारी।",
      todaySales: "आज की कुल बिक्री",
      yesterdaySales: "कल की कुल बिक्री",
      ordersToday: "आज के कुल ऑर्डर",
      avgBill: "औसत बिल मूल्य",
      grossProfit: "अनुमानित सकल लाभ",
      totalCustomers: "कुल ग्राहक",
      lowStockCount: "कम स्टॉक वाले सामान",
      bestSeller: "शीर्ष उत्पाद",
      peakHour: "सबसे व्यस्त समय",
      dailyBrief: "एआई दैनिक व्यापार ब्रीफ",
      refreshBrief: "ताज़ा करें",
      hourlySalesChart: "आज की प्रति घंटा बिक्री",
      weeklyTrendChart: "पिछले 7 दिनों का प्रदर्शन",
      topProductsTitle: "सबसे अधिक बिकने वाले उत्पाद",
      lowStockTitle: "स्टॉक चेतावनी",
      quickPOS: "बिलिंग शुरू करें",
    },
    pos: {
      title: "पीओएस बिलिंग काउंटर",
      subtitle: "सटीक गणना और डेमो यूपीआई क्यूआर कोड के साथ त्वरित बिलिंग।",
      searchPlaceholder: "उत्पाद का नाम या SKU खोजें (उदा. Parle-G, Milk)...",
      allCategories: "सभी श्रेणियां",
      cartTitle: "चालू बिल",
      emptyCart: "बिल खाली है। उत्पाद जोड़ने के लिए सूची से चुनें।",
      stock: "स्टॉक",
      outOfStock: "स्टॉक समाप्त",
      subtotal: "उप-योग",
      discount: "छूट",
      applyDiscount: "छूट लागू करें",
      discountType: "छूट का प्रकार",
      discountValue: "छूट मान",
      finalAmount: "कुल देय राशि",
      generateQR: "यूपीआई क्यूआर बनाएं",
      clearCart: "बिल साफ़ करें",
      selectCustomer: "ग्राहक चुनें (वैकल्पिक)",
      anonymousCustomer: "साधारण ग्राहक",
      demoQRTitle: "डेमो यूपीआई क्यूआर स्कैन करें",
      demoQRDisclaimer: "डेमो भुगतान — कोई वास्तविक धन हस्तांतरित नहीं होगा",
      simulateSuccess: "सफल भुगतान सिमुलेशन",
      simulateFail: "असफल भुगतान सिमुलेशन",
      cancelPayment: "रद्द करें",
    },
    products: {
      title: "उत्पाद एवं इन्वेंटरी प्रबंधन",
      subtitle: "उत्पादों की सूची, स्टॉक स्थिति और दिनों का स्टॉक कवर देखें।",
      addProduct: "नया उत्पाद जोड़ें",
      adjustStock: "स्टॉक समायोजित करें",
      sku: "एसकेयू",
      name: "उत्पाद का नाम",
      category: "श्रेणी",
      sellingPrice: "बिक्री मूल्य",
      costPrice: "लागत मूल्य",
      currentStock: "वर्तमान स्टॉक",
      status: "स्थिति",
      daysCover: "बचे हुए दिन",
      actions: "कार्रवाई",
      healthy: "सुरक्षित",
      low: "कम स्टॉक",
      critical: "गंभीर",
    },
    campaigns: {
      title: "एआई ग्राहक अभियान एवं प्रयोग",
      subtitle: "10% होल्डआउट नियंत्रण समूह के साथ वित्तीय रूप से सुरक्षित अभियान।",
      createCampaign: "नया अभियान बनाएं",
      name: "अभियान का नाम",
      objective: "उद्देश्य",
      targetAudience: "लक्षित ग्राहक",
      discountType: "छूट का प्रकार",
      discountValue: "छूट मान",
      budget: "अधिकतम बजट (₹)",
      holdoutNotice: "10% होल्डआउट नियंत्रण समूह को अभियान से अलग रखा गया है।",
      treatmentGroup: "ट्रीटमेंट समूह (ऑफ़र प्राप्तकर्ता)",
      holdoutGroup: "होल्डआउट समूह (छूट से अलग)",
      approvalTitle: "व्यापारी अभियान अनुमोदन",
      approvalReadback: "अभियान चलाने से पहले ग्राहक विभाजन और अनुमानित लागत की जांच करें।",
      approveBtn: "स्वीकृत करें",
      rejectBtn: "अस्वीकार करें",
      simulatedExecutionNotice: "सिम्युलेटेड अभियान — किसी वास्तविक ग्राहक को संदेश नहीं भेजा जाएगा।",
      executeSimulation: "अभियान सिमुलेशन चलाएं",
    },
    scorecard: {
      title: "अभियान परिणाम एवं स्कोरकार्ड",
      subtitle: "ट्रीटमेंट और होल्डआउट समूह की तुलना करके वास्तविक वृद्धिशील बिक्री मापें।",
      fastForwardBtn: "7 दिन आगे बढ़ाएं",
      treatmentRevenue: "ट्रीटमेंट समूह की बिक्री",
      holdoutRevenue: "होल्डआउट समूह की बिक्री",
      treatmentPerCust: "प्रति ग्राहक ट्रीटमेंट बिक्री",
      holdoutPerCust: "प्रति ग्राहक होल्डआउट बिक्री",
      incrementalRevenue: "अतिरिक्त वृद्धिशील बिक्री",
      campaignCost: "अभियान लागत",
      revenueMultiple: "राजस्व-लागत अनुपात",
      profitROI: "अनुमानित लाभ आरओआई",
      aiNotes: "एआई विश्लेषण व्याख्या",
      disclaimer: "सिम्युलेटेड प्रयोग परिणाम — केवल उदाहरणात्मक, वास्तविक माप नहीं",
    },
    assistant: {
      title: "मित्रा से पूछें — एआई व्यापार सहायक",
      subtitle: "अपनी बिक्री, स्टॉक और ग्राहकों के बारे में प्रश्न पूछें। सीधे डेटाबेस से सत्यापित उत्तर।",
      inputPlaceholder: "मित्रा से प्रश्न पूछें (उदा. 'Parle-G का कितना स्टॉक है?')...",
      send: "भेजें",
      suggestedQueries: "सुझाए गए प्रश्न",
      clearChat: "इतिहास साफ़ करें",
      disclaimer: "शून्य भ्रम गारंटी: प्रत्येक संख्या डेटाबेस से सीधे प्राप्त होती है।",
    },
  },
  kn: {
    appName: "ಮರ್ಚೆಂಟ್ ಮಿತ್ರ",
    tagline: "ನಿಮ್ಮ ಎಐ-ಚಾಲಿತ ವ್ಯಾಪಾರ ಅಭಿವೃದ್ಧಿ ಪಾಲುದಾರ",
    nav: {
      overview: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      pos: "ಪಿಒಎಸ್ ಬಿಲ್ಲಿಂಗ್",
      products: "ಸರಕು ಮತ್ತು ದಾಸ್ತಾನು",
      transactions: "ವಹಿವಾಟುಗಳು",
      customers: "ಗ್ರಾಹಕರು",
      campaigns: "ಪ್ರಚಾರ ಅಭಿಯಾನಗಳು",
      campaignInsights: "ಅಭಿಯಾನ ವರದಿ",
      analytics: "ವ್ಯಾಪಾರ ವಿಶ್ಲೇಷಣೆ",
      askMitra: "ಮಿತ್ರನನ್ನು ಕೇಳಿ",
      settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    },
    header: {
      storeOpen: "ಅಂಗಡಿ ತೆರೆದಿದೆ",
      demoMode: "ಡೆಮೊ ಸಿಮ್ಯುಲೇಶನ್ ಸಕ್ರಿಯ",
      notifications: "ಎಚ್ಚರಿಕೆಗಳು",
      soundboxActive: "ಸೌಂಡ್‌ಬಾಕ್ಸ್ ಸಕ್ರಿಯ",
      soundboxMuted: "ಸೌಂಡ್‌ಬಾಕ್ಸ್ ಮ್ಯೂಟ್",
    },
    overview: {
      title: "ವ್ಯಾಪಾರದ ಅವಲೋಕನ",
      subtitle: "ರಮೇಶ್ ಜನರಲ್ ಸ್ಟೋರ್ಸ್‌ನ ಲೈವ್ ಆರ್ಥಿಕ ಅಂಕಿಅಂಶಗಳು, ಮಾರಾಟ ಮತ್ತು ದಾಸ್ತಾನು ವಿವರಗಳು.",
      todaySales: "ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ",
      yesterdaySales: "ನಿನ್ನೆಯ ಒಟ್ಟು ಮಾರಾಟ",
      ordersToday: "ಇಂದಿನ ಆರ್ಡರ್‌ಗಳು",
      avgBill: "ಸರಾಸರಿ ಬಿಲ್ ಮೌಲ್ಯ",
      grossProfit: "ಅಂದಾಜು ಒಟ್ಟು ಲಾಭ",
      totalCustomers: "ಒಟ್ಟು ಗ್ರಾಹಕರು",
      lowStockCount: "ಕಡಿಮೆ ದಾಸ್ತಾನು ಸರಕುಗಳು",
      bestSeller: "ಹೆಚ್ಚು ಮಾರಾಟವಾದ ಸರಕು",
      peakHour: "ಹೆಚ್ಚು ವ್ಯಾಪಾರದ ಸಮಯ",
      dailyBrief: "ಎಐ ದಿನನಿತ್ಯದ ವ್ಯಾಪಾರ ಬ್ರೀಫ್",
      refreshBrief: "ತಾಜಾಗೊಳಿಸಿ",
      hourlySalesChart: "ಇಂದಿನ ಗಂಟೆಯ ಮಾರಾಟ",
      weeklyTrendChart: "ಕಳೆದ 7 ದಿನಗಳ ಕಾರ್ಯಕ್ಷಮತೆ",
      topProductsTitle: "ಹೆಚ್ಚು ಮಾರಾಟವಾದ ಸರಕುಗಳು",
      lowStockTitle: "ದಾಸ್ತಾನು ಎಚ್ಚರಿಕೆಗಳು",
      quickPOS: "ಬಿಲ್ಲಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ",
    },
    pos: {
      title: "ಪಿಒಎಸ್ ಬಿಲ್ಲಿಂಗ್ ಕೌಂಟರ್",
      subtitle: "ನಿಖರವಾದ ಲೆಕ್ಕಾಚಾರ ಮತ್ತು ಡೆಮೊ ಯುಪಿಐ ಕ್ಯೂಆರ್ ಕೋಡ್‌ನೊಂದಿಗೆ ವೇಗದ ಬಿಲ್ಲಿಂಗ್.",
      searchPlaceholder: "ಸರಕಿನ ಹೆಸರು ಅಥವಾ SKU ಹುಡುಕಿ (ಉದಾ. Parle-G, Milk)...",
      allCategories: "ಎಲ್ಲಾ ವಿಭಾಗಗಳು",
      cartTitle: "ಪ್ರಸ್ತುತ ಬಿಲ್",
      emptyCart: "ಬಿಲ್ ಖಾಲಿಯಾಗಿದೆ. ಸರಕುಗಳನ್ನು ಸೇರಿಸಲು ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ.",
      stock: "ದಾಸ್ತಾನು",
      outOfStock: "ದಾಸ್ತಾನು ಮುಗಿದಿದೆ",
      subtotal: "ಉಪಮೊತ್ತ",
      discount: "ರಿಯಾಯಿತಿ",
      applyDiscount: "ರಿಯಾಯಿತಿ ಅನ್ವಯಿಸಿ",
      discountType: "ರಿಯಾಯಿತಿ ವಿಧ",
      discountValue: "ಮೌಲ್ಯ",
      finalAmount: "ಪಾವತಿಸಬೇಕಾದ ಅಂತಿಮ ಮೊತ್ತ",
      generateQR: "ಯುಪಿಐ ಕ್ಯೂಆರ್ ರಚಿಸಿ",
      clearCart: "ಬಿಲ್ ತೆರವುಗೊಳಿಸಿ",
      selectCustomer: "ಗ್ರಾಹಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ (ಐಚ್ಛಿಕ)",
      anonymousCustomer: "ಸಾಮಾನ್ಯ ಗ್ರಾಹಕ",
      demoQRTitle: "ಡೆಮೊ ಯುಪಿಐ ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
      demoQRDisclaimer: "ಡೆಮೊ ಪಾವತಿ — ಯಾವುದೇ ನೈಜ ಹಣ ವರ್ಗಾವಣೆಯಾಗುವುದಿಲ್ಲ",
      simulateSuccess: "ಯಶಸ್ವಿ ಪಾವತಿ ಸಿಮ್ಯುಲೇಶನ್",
      simulateFail: "ವಿಫಲ ಪಾವತಿ ಸಿಮ್ಯುಲೇಶನ್",
      cancelPayment: "ರದ್ದುಮಾಡಿ",
    },
    products: {
      title: "ಸರಕು ಮತ್ತು ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ",
      subtitle: "ಸರಕುಗಳ ಪಟ್ಟಿ, ದಾಸ್ತಾನು ಮಟ್ಟ ಮತ್ತು ಎಷ್ಟು ದಿನಗಳ ದಾಸ್ತಾನು ಉಳಿದಿದೆ ಎಂದು ನೋಡಿ.",
      addProduct: "ಹೊಸ ಸರಕು ಸೇರಿಸಿ",
      adjustStock: "ದಾಸ್ತಾನು ಸರಿಹೊಂದಿಸಿ",
      sku: "ಎಸ್‌ಕೆಯು",
      name: "ಸರಕಿನ ಹೆಸರು",
      category: "ವಿಭಾಗ",
      sellingPrice: "ಮಾರಾಟ ಬೆಲೆ",
      costPrice: "ಖರೀದಿ ಬೆಲೆ",
      currentStock: "ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು",
      status: "ಸ್ಥಿತಿ",
      daysCover: "ಉಳಿದಿರುವ ದಿನಗಳು",
      actions: "ಕ್ರಿಯೆಗಳು",
      healthy: "ಆರೋಗ್ಯಕರ",
      low: "ಕಡಿಮೆ ದಾಸ್ತಾನು",
      critical: "ನಿರ್ಣಾಯಕ",
    },
    campaigns: {
      title: "ಎಐ ಗ್ರಾಹಕ ಪ್ರಚಾರ ಅಭಿಯಾನಗಳು",
      subtitle: "10% ಹೋಲ್ಡ್‌ಔಟ್ ನಿಯಂತ್ರಣ ಗುಂಪಿನೊಂದಿಗೆ ಸುರಕ್ಷಿತ ಮಾರ್ಕೆಟಿಂಗ್ ಅಭಿಯಾನಗಳು.",
      createCampaign: "ಹೊಸ ಅಭಿಯಾನ ಸಿದ್ಧಪಡಿಸಿ",
      name: "ಅಭಿಯಾನದ ಹೆಸರು",
      objective: "ಉದ್ದೇಶ",
      targetAudience: "ಗುರಿ ಗ್ರಾಹಕರು",
      discountType: "ರಿಯಾಯಿತಿ ರೂಪ",
      discountValue: "ರಿಯಾಯಿತಿ ಮೊತ್ತ",
      budget: "ಗರಿಷ್ಠ ಬಜೆಟ್ (₹)",
      holdoutNotice: "10% ಹೋಲ್ಡ್‌ಔಟ್ ನಿಯಂತ್ರಣ ಗುಂಪನ್ನು ಪ್ರತ್ಯೇಕಿಸಲಾಗಿದೆ.",
      treatmentGroup: "ಪ್ರಚಾರ ಪಡೆಯುವ ಗುಂಪು",
      holdoutGroup: "ಹೋಲ್ಡ್‌ಔಟ್ ಗುಂಪು (ಸಂದೇಶವಿಲ್ಲ)",
      approvalTitle: "ವ್ಯಾಪಾರಿ ಅನುಮೋದನೆ",
      approvalReadback: "ಅಭಿಯಾನವನ್ನು ಅನುಮೋದಿಸುವ ಮೊದಲು ಗ್ರಾಹಕರ ವಿವರ ಮತ್ತು ವೆಚ್ಚವನ್ನು ಪರಿಶೀಲಿಸಿ.",
      approveBtn: "ಅಭಿಯಾನ ಅನುಮೋದಿಸಿ",
      rejectBtn: "ತಿರಸ್ಕರಿಸಿ",
      simulatedExecutionNotice: "ಸಿಮ್ಯುಲೇಟೆಡ್ ಅಭಿಯಾನ — ಯಾವುದೇ ನೈಜ ಗ್ರಾಹಕರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
      executeSimulation: "ಸಿಮ್ಯುಲೇಶನ್ ಚಲಾಯಿಸಿ",
    },
    scorecard: {
      title: "ಅಭಿಯಾನದ ಫಲಿತಾಂಶ ಸ್ಕೋರ್‌ಕಾರ್ಡ್",
      subtitle: "ಹೋಲ್ಡ್‌ಔಟ್ ಗುಂಪಿನೊಂದಿಗೆ ಹೋಲಿಸಿ ನಿಜವಾದ ಹೆಚ್ಚುವರಿ ಮಾರಾಟವನ್ನು ಅಳೆಯಿರಿ.",
      fastForwardBtn: "7 ದಿನ ಮುನ್ನಡೆಯಿರಿ",
      treatmentRevenue: "ಪ್ರಚಾರ ಗುಂಪಿನ ಮಾರಾಟ",
      holdoutRevenue: "ಹೋಲ್ಡ್‌ಔಟ್ ಗುಂಪಿನ ಮಾರಾಟ",
      treatmentPerCust: "ಪ್ರತಿ ಗ್ರಾಹಕನ ಪ್ರಚಾರ ಮಾರಾಟ",
      holdoutPerCust: "ಪ್ರತಿ ಗ್ರಾಹಕನ ಹೋಲ್ಡ್‌ಔಟ್ ಮಾರಾಟ",
      incrementalRevenue: "ಹೆಚ್ಚುವರಿ ಮಾರಾಟ",
      campaignCost: "ಅಭಿಯಾನದ ವೆಚ್ಚ",
      revenueMultiple: "ಆದಾಯ-ವೆಚ್ಚದ ಅನುಪಾತ",
      profitROI: "ಅಂದಾಜು ಲಾಭ ಆರ್‌ಒಐ",
      aiNotes: "ಎಐ ವಿಶ್ಲೇಷಣೆ ವಿವರಣೆ",
      disclaimer: "ಸಿಮ್ಯುಲೇಟೆಡ್ ಫಲಿತಾಂಶಗಳು — ಕೇವಲ ವಿವರಣೆಗಾಗಿ ಮಾತ್ರ",
    },
    assistant: {
      title: "ಮಿತ್ರನನ್ನು ಕೇಳಿ — ಎಐ ವ್ಯಾಪಾರ ಸಹಾಯಕ",
      subtitle: "ನಿಮ್ಮ ಮಾರಾಟ, ದಾಸ್ತಾನು ಮತ್ತು ಗ್ರಾಹಕರ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ. ಡೇಟಾಬೇಸ್‌ನಿಂದ ನೇರ ಉತ್ತರಗಳು.",
      inputPlaceholder: "ಮಿತ್ರನಿಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ (ಉದಾ. 'Parle-G ದಾಸ್ತಾನು ಎಷ್ಟಿದೆ?')...",
      send: "ಕಳುಹಿಸಿ",
      suggestedQueries: "ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು",
      clearChat: "ಚಾಟ್ ತೆರವುಗೊಳಿಸಿ",
      disclaimer: "ಶೂನ್ಯ ಕಲ್ಪನೆ ಭರವಸೆ: ಪ್ರತಿಯೊಂದು ಸಂಖ್ಯೆಯೂ ಡೇಟಾಬೇಸ್ ಲೆಕ್ಕಾಚಾರದಿಂದ ಬರುತ್ತದೆ.",
    },
  },
};
