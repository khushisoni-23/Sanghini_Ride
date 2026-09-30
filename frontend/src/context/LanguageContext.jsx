import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  'hi-en': {
    // Navigation & Layout
    portalTitle: 'Passenger Portal',
    overview: 'Overview',
    bookRide: 'Book a Ride',
    myRides: 'My Rides',
    safetyHub: 'Safety Hub',
    profile: 'Profile',
    settings: 'Settings',
    sosHub: 'Emergency SOS Hub',
    cityLabel: 'City: Udaipur, Rajasthan',
    safeZone: 'Safe Zone',
    safeZoneDesc: '24/7 Safety Command Center active across Udaipur, Rajasthan.',
    backToWebsite: 'Back to Website',
    menu: 'Menu',

    // Overview Page
    welcomeBack: 'Welcome back',
    whereToTravel: 'Where in Udaipur would you like to travel safely today?',
    verifiedPassenger: 'Verified Passenger',
    cityRidesTag: 'Udaipur City Rides',
    heroTitle: 'Travel with confidence. Verified women drivers across Udaipur.',
    heroSubtitle: 'Every ride is protected by 4-digit start OTPs, live GPS telemetry, instant trusted contacts sharing, and 24/7 emergency Udaipur desk response.',
    bookInstantRide: 'Book Instant Ride',
    hundredPercentWomen: '100% Women Fleet',
    savedLocations: 'Saved Locations in Udaipur',
    managePlaces: 'Manage Places',
    bookToHere: 'Book to here',
    popularHubs: 'Popular Udaipur Pickup Points',
    tapToSelect: 'Tap to select',
    safetyArchitecture: 'Safety Architecture',
    viewSafetyHub: 'View Safety Hub',
    emergencyActive: 'Emergency Protection Active',
    helplineLinked: 'Udaipur Operations Helpline Linked',
    trustedContacts: 'Trusted Contacts',
    contactsConfigured: 'Configured',
    startOtpEnforced: 'Start Ride PIN (OTP)',
    enforced: 'Enforced',
    driverVerification: 'Driver Verification',
    manageContactsBtn: 'Manage Emergency Contacts',
    policeEmergency: 'Udaipur Police Emergency',
    directDial: 'Direct dial from anywhere',
    recentActivity: 'Recent Ride Activity',
    viewAllRides: 'View All Rides',
    noActiveRides: 'No active rides right now',
    noRidesDesc: 'Your upcoming, in-progress, and past trips across Udaipur will appear here once booked.',
    bookFirstRide: 'Book Your First Ride',
    rideDetails: 'Ride Details',

    // Settings Page
    settingsTitle: 'Settings & Preferences',
    settingsSubtitle: 'Configure notifications, languages, and app preferences for your Udaipur account.',
    languagePreference: 'Language Preference',
    notificationPreference: 'Notification Preferences',
    tripAlerts: 'Trip & Driver Arrival Alerts',
    safetyAlerts: 'Safety & SOS Broadcast Updates',
    savePreferences: 'Save Preferences',
    preferencesSaved: 'Language & preferences saved successfully!',
  },
  'hi': {
    // Navigation & Layout
    portalTitle: 'यात्री पोर्टल',
    overview: 'अवलोकन (Overview)',
    bookRide: 'सवारी बुक करें',
    myRides: 'मेरी यात्राएं',
    safetyHub: 'सुरक्षा केंद्र',
    profile: 'मेरी प्रोफ़ाइल',
    settings: 'सेटिंग्स व प्राथमिकताएं',
    sosHub: 'आपातकालीन SOS केंद्र',
    cityLabel: 'शहर: उदयपुर, राजस्थान',
    safeZone: 'सुरक्षित क्षेत्र',
    safeZoneDesc: 'उदयपुर, राजस्थान में 24/7 सुरक्षा कमान केंद्र सक्रिय है।',
    backToWebsite: 'वेबसाइट पर वापस जाएं',
    menu: 'मेनू',

    // Overview Page
    welcomeBack: 'पुनः स्वागत है',
    whereToTravel: 'आज आप उदयपुर में सुरक्षित रूप से कहाँ जाना चाहती हैं?',
    verifiedPassenger: 'सत्यापित यात्री',
    cityRidesTag: 'उदयपुर सिटी राइड्स',
    heroTitle: 'आत्मविश्वास के साथ यात्रा करें। उदयपुर भर में सत्यापित महिला चालक।',
    heroSubtitle: 'हर यात्रा 4-अंकीय ओटीपी, लाइव जीपीएस ट्रैकिंग, विश्वसनीय संपर्कों के साथ लाइव शेयरिंग और 24/7 उदयपुर हेल्पलाइन द्वारा सुरक्षित है।',
    bookInstantRide: 'तुरंत सवारी बुक करें',
    hundredPercentWomen: '100% महिला चालक',
    savedLocations: 'उदयपुर में सुरक्षित स्थान',
    managePlaces: 'स्थान प्रबंधित करें',
    bookToHere: 'यहाँ के लिए बुक करें',
    popularHubs: 'प्रमुख उदयपुर पिकअप पॉइंट्स',
    tapToSelect: 'चुनने के लिए दबाएं',
    safetyArchitecture: 'सुरक्षा व्यवस्था',
    viewSafetyHub: 'सुरक्षा केंद्र देखें',
    emergencyActive: 'आपातकालीन सुरक्षा सक्रिय',
    helplineLinked: 'उदयपुर हेल्पलाइन लिंक है',
    trustedContacts: 'विश्वसनीय संपर्क',
    contactsConfigured: 'सक्रिय हैं',
    startOtpEnforced: 'राइड शुरू करने का पिन (OTP)',
    enforced: 'अनिवार्य है',
    driverVerification: 'चालक सत्यापन',
    manageContactsBtn: 'आपातकालीन संपर्क प्रबंधित करें',
    policeEmergency: 'उदयपुर पुलिस आपातकालीन',
    directDial: 'सीधा कॉल करें',
    recentActivity: 'हालिया यात्राएं',
    viewAllRides: 'सभी यात्राएं देखें',
    noActiveRides: 'वर्तमान में कोई सक्रिय यात्रा नहीं है',
    noRidesDesc: 'आपकी आगामी और पिछली यात्राएं यहाँ दिखाई देंगी।',
    bookFirstRide: 'अपनी पहली यात्रा बुक करें',
    rideDetails: 'यात्रा विवरण',

    // Settings Page
    settingsTitle: 'सेटिंग्स व प्राथमिकताएं',
    settingsSubtitle: 'अपने उदयपुर खाते के लिए भाषा, सूचनाएं और ऐप प्राथमिकताएं सेट करें।',
    languagePreference: 'भाषा प्राथमिकता (Language)',
    notificationPreference: 'सूचना प्राथमिकताएं',
    tripAlerts: 'यात्रा और चालक आगमन अलर्ट',
    safetyAlerts: 'सुरक्षा और SOS आपातकालीन अपडेट',
    savePreferences: 'प्राथमिकताएं सहेजें',
    preferencesSaved: 'भाषा और प्राथमिकताएं सफलतापूर्वक सहेजी गईं!',
  },
  'raj': {
    // Navigation & Layout (Mewari / Rajasthani)
    portalTitle: 'सवार पोर्टल (मेवाड़ी)',
    overview: 'मुख्य पनो (Overview)',
    bookRide: 'गाड़ी बुक करो',
    myRides: 'म्हारी यात्रावां',
    safetyHub: 'सुरक्षा केंद्र',
    profile: 'म्हारी प्रोफ़ाइल',
    settings: 'सेटिंग्स व पसंद',
    sosHub: 'आपातकाल SOS केंद्र',
    cityLabel: 'शहर: उदयपुर, राजस्थान',
    safeZone: 'सुरक्षित इलाको',
    safeZoneDesc: 'उदयपुर में 24/7 सुरक्षा कमान केंद्र चालू है।',
    backToWebsite: 'पाछा वेबसाइट पर जाओ',
    menu: 'मेनू',

    // Overview Page
    welcomeBack: 'पधारो सा',
    whereToTravel: 'आज उदयपुर में कठे पधारनो है सा?',
    verifiedPassenger: 'जांच-परख सवारी',
    cityRidesTag: 'उदयपुर शहर री राइड्स',
    heroTitle: 'बिना चिंता सफर करो। पुरा उदयपुर में जांची-परखी बाईजी ड्राइवर्स।',
    heroSubtitle: 'हरेक राइड 4-अंक रा ओटीपी, लाइव जीपीएस, घरवाळा ने लाइव लोकेशन और 24/7 हेल्पलाइन सू सुरक्षित है।',
    bookInstantRide: 'झटपट गाड़ी बुक करो',
    hundredPercentWomen: '100% महिला चालक',
    savedLocations: 'उदयपुर रा बचाया जगां',
    managePlaces: 'जगां सम्हालो',
    bookToHere: 'अठे खातिर बुक करो',
    popularHubs: 'उदयपुर रा खास पिकअप पॉइंट्स',
    tapToSelect: 'दबा र चुणो',
    safetyArchitecture: 'सुरक्षा रो प्रबंध',
    viewSafetyHub: 'सुरक्षा केंद्र देखो',
    emergencyActive: 'आपातकालीन सुरक्षा चालू है',
    helplineLinked: 'उदयपुर हेल्पलाइन जुड़ी है',
    trustedContacts: 'भरोसेमंद संपर्क',
    contactsConfigured: 'जुड़ेड़ा है',
    startOtpEnforced: 'राइड शुरू रो पिन (OTP)',
    enforced: 'जरूरी है',
    driverVerification: 'चालक री जांच',
    manageContactsBtn: 'आपातकालीन नंबर सम्हालो',
    policeEmergency: 'उदयपुर पुलिस आपातकालीन',
    directDial: 'सीधो फोन लगाओ',
    recentActivity: 'हाल री यात्रावां',
    viewAllRides: 'सगळी यात्रावां देखो',
    noActiveRides: 'अबे कोई चालू राइड कोनी',
    noRidesDesc: 'थारी आवे वाळी और पुरानी यात्रावां अठे दीखेगी।',
    bookFirstRide: 'म्हारी पहली राइड बुक करो',
    rideDetails: 'यात्रा रो विवरण',

    // Settings Page
    settingsTitle: 'सेटिंग्स व पसंद',
    settingsSubtitle: 'आपरे उदयपुर खाते खातिर भाषा और सूचनावां तय करो।',
    languagePreference: 'भाषा री पसंद (Language)',
    notificationPreference: 'सूचनावां री पसंद',
    tripAlerts: 'यात्रा और ड्राइवर आवण रा अलर्ट',
    safetyAlerts: 'सुरक्षा और आपातकालीन SOS अलर्ट',
    savePreferences: 'पसंद सहेजो',
    preferencesSaved: 'भाषा और पसंद सफलतापूर्वक सहेजी गई!',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('sanghini_language') || 'hi-en';
  });

  const setLanguage = (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('sanghini_language', newLang);
  };

  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['hi-en'];
    return langDict[key] || TRANSLATIONS['hi-en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
