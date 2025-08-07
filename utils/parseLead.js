import { getCountryISO } from "./getCountryIso.js";
import getRandomIpByCountry from "./getRandomIpByCountry.js";
import phonesData from "./utilsData/phonesData.js";

const FIELD_KEYWORDS = {
  full_name: [
    "full name",
    "name",
    "fullname",
    "nombre",
    "nome",
    "vollständiger_name",
    "नाम",
    "اسم",
    "שם",
    "nome_e_cognome",
  ],
  phone: [
    "phone",
    "tel",
    "mobile",
    "מספר טלפון",
    "מספר_טלפון",
    "telefono",
    "telefonnummer",
    "numero_di_telefono",
    "телефон",
    "फ़ोन",
    "هاتف",
  ],
  email: [
    "email",
    "e-mail",
    "correo",
    'דוא"ל',
    "דוא’ל",
    "почта",
    "ईमेल",
    "e-mail-adresse",
    "بريد",
  ],
};

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[_\-]/g, " ") // заменяем _ и - на пробел
    .replace(/["'“”‘’«»]/g, "") // убираем кавычки
    .trim();
}

function extractAnswers(lead) {
  const usedKeywords = [
    ...FIELD_KEYWORDS.full_name,
    ...FIELD_KEYWORDS.phone,
    ...FIELD_KEYWORDS.email,
  ].map(normalize);

  return lead.field_data
    .filter((f) => !usedKeywords.includes(normalize(f.name)))
    .flatMap((f) => f.values)
    .map((val) => val.replace(/_/g, " "))
    .join("; ");
}

function getFieldValueByKeywords(lead, keywords) {
  const normalizedKeywords = keywords.map(normalize);
  return (
    lead.field_data.find((f) => normalizedKeywords.includes(normalize(f.name)))
      ?.values?.[0] || ""
  );
}

export const fbLeadsTarget = (lead) => {
  const leadData = {
    full_name: getFieldValueByKeywords(lead, FIELD_KEYWORDS.full_name),
    phone: getFieldValueByKeywords(lead, FIELD_KEYWORDS.phone).replace(
      /\s+/g,
      ""
    ),
    email: getFieldValueByKeywords(lead, FIELD_KEYWORDS.email),
    answers: extractAnswers(lead),
  };
  return leadData;
};

export const fbLeadsCrm = (lead, template) => {
  const phone = getFieldValueByKeywords(lead, FIELD_KEYWORDS.phone).replace(
    /\s+/g,
    ""
  );
  const isoCode = getCountryISO(phone, phonesData);
  const leadData = {
    full_name: getFieldValueByKeywords(lead, FIELD_KEYWORDS.full_name),
    phone: getFieldValueByKeywords(lead, FIELD_KEYWORDS.phone).replace(
      /\s+/g,
      ""
    ),
    email: getFieldValueByKeywords(lead, FIELD_KEYWORDS.email),
    description: extractAnswers(lead),
    country: isoCode,
    landing: template.landing,
    landing_name: template.landing_name,
    ip: getRandomIpByCountry(isoCode),
    user_id: template.user_id,
    source: template.source,
  };
  return leadData;
};
