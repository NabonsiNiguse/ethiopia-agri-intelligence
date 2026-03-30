import { Router, type IRouter } from "express";

const router: IRouter = Router();

const USSD_MENU = {
  "": `CON Welcome to AgrEthiopia *844#\nእንኳን ደህና መጡ\nBaga nagaan dhuftan\n\n1. AI Farming Advisor\n2. Market Prices\n3. Weather Advisory\n4. Crop Disease Help\n5. Register as Farmer`,
  "1": `CON AI Farming Advisor\nየእርሻ ምክር\n\n1. Coffee Advisory\n2. Teff Advisory\n3. Sesame Advisory\n4. General Question\n0. Back`,
  "1*1": `END Coffee Advisory:\nPlant coffee in well-drained soil with pH 6.0-6.5. Apply copper fungicide monthly during rain season.\nዋናው: ቡናን በጥሩ ፍሳሽ ባለው አፈር ተክሉ`,
  "1*2": `END Teff Advisory:\nPlant teff after first heavy rains using 5kg seed/hectare. Avoid excess nitrogen.\nዋናው: ጤፍን 5ኪ.ግ/ሄ.ር ዘሩ`,
  "1*3": `END Sesame Advisory:\nPlant sesame in warm, well-drained soil. Row spacing 45cm. Harvest before capsules open.\nዋናው: ሰሊጥ 45ሴ.ሜ ርቀት ሰርዙ`,
  "2": `CON Market Prices (ETB/kg)\nExchange Rate: 1 USD = 57 ETB\n\n1. Coffee\n2. Teff\n3. Sesame\n4. Wheat\n0. Back`,
  "2*1": `END Coffee Prices:\nGrade 1: ETB 85/kg\nGrade 2: ETB 72/kg\nGrade 3: ETB 58/kg\nECX Addis: ETB 82/kg\nTrend: Rising (+3.2%)`,
  "2*2": `END Teff Prices:\nWhite Teff: ETB 45/kg\nMixed Teff: ETB 38/kg\nRed Teff: ETB 32/kg\nTrend: Stable (+0.5%)`,
  "2*3": `END Sesame Prices:\nHumera Sesame: ETB 62/kg\nWollega Sesame: ETB 55/kg\nExport quality: ETB 68/kg\nTrend: Rising (+5.1%)`,
  "2*4": `END Wheat Prices:\nImproved bread wheat: ETB 28/kg\nLocal variety: ETB 22/kg\nDurum wheat: ETB 31/kg\nTrend: Falling (-1.8%)`,
  "3": `CON Weather Advisory\nSelect your region:\n1. Oromia\n2. Amhara\n3. SNNPR\n4. Tigray\n0. Back`,
  "3*1": `END Oromia Weather:\nToday: Partly cloudy, 22°C\n3-Day: Light rains expected\nAdvisory: Good time for planting. Spray early morning. Monitor for pests after rains.\nRisk Level: LOW`,
  "3*2": `END Amhara Weather:\nToday: Sunny, 19°C\n3-Day: Clear skies\nAdvisory: Ideal for spraying and field work. Consider irrigation if dry spell continues.\nRisk Level: MEDIUM`,
  "3*3": `END SNNPR Weather:\nToday: Heavy rain, 24°C\n3-Day: Continued rains\nAdvisory: Delay harvesting. Ensure drainage. Coffee harvest window: next 5 days.\nRisk Level: HIGH`,
  "3*4": `END Tigray Weather:\nToday: Sunny, 26°C\n3-Day: Hot and dry\nAdvisory: Irrigate immediately. Drought stress likely. Contact insurance if crops fail.\nRisk Level: HIGH`,
  "4": `CON Crop Disease Detection\nDescribe symptoms:\n1. Yellow/brown spots on leaves\n2. Wilting and root rot\n3. White powder on leaves\n4. Dark spots on fruits\n0. Back`,
  "4*1": `END Likely Disease: RUST\nTreatment:\n1. Apply triazole fungicide\n2. Remove infected leaves\n3. Improve air circulation\nContact extension officer: 0800 100 200`,
  "4*2": `END Likely Disease: ROOT ROT\nTreatment:\n1. Improve field drainage\n2. Apply metalaxyl fungicide\n3. Remove infected plants\nUrgency: HIGH - Act within 48 hours`,
  "4*3": `END Likely Disease: POWDERY MILDEW\nTreatment:\n1. Apply sulfur-based fungicide\n2. Reduce plant density\n3. Avoid overhead irrigation\nRisk to neighboring farms: MEDIUM`,
  "5": `END Registration:\nTo register as a farmer:\nCall: 0800 100 200\nVisit: woreda agricultural office\nOnline: agri.gov.et\nBring: Kebele ID, land certificate`,
};

router.post("/ussd/session", async (req, res): Promise<void> => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  if (!sessionId || !phoneNumber) {
    res.status(400).json({ error: "sessionId and phoneNumber required" });
    return;
  }

  const inputText = (text ?? "").trim();
  const menuResponse = USSD_MENU[inputText as keyof typeof USSD_MENU] ?? USSD_MENU[""];
  const [state, ...responseParts] = menuResponse.split(" ");
  const sessionState = state as "CON" | "END";
  const response = responseParts.join(" ");

  res.json({ response, sessionState });
});

export default router;
