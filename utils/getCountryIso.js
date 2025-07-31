export function getCountryISO(phone, countries) {
  const cleanNumber = phone.replace("+", "");

  const sortedCountries = [...countries].sort(
    (a, b) => b[2].length - a[2].length
  );

  for (const [_, iso, code] of sortedCountries) {
    if (cleanNumber.startsWith(code)) {
      return iso;
    }
  }

  return null;
}
