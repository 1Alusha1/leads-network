import countryIpRanges from "./utilsData/countryIpRanges.js";

function ipToNumber(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + +octet, 0) >>> 0;
}

function numberToIp(num) {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
}

export default function getRandomIpByCountry(isoCode) {
  console.log(isoCode);
  const ranges = countryIpRanges[isoCode.toUpperCase()];
  if (!ranges) {
    throw new Error("Страна не найдена или нет данных по IP диапазонам");
  }

  const [startIp, endIp] = ranges[Math.floor(Math.random() * ranges.length)];

  const startNum = ipToNumber(startIp);
  const endNum = ipToNumber(endIp);

  const randomIpNum =
    Math.floor(Math.random() * (endNum - startNum + 1)) + startNum;

  return numberToIp(randomIpNum);
}
