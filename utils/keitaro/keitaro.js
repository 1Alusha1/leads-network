import { config } from "dotenv";
config();

export const getKeitaroLeads = async (adsetNames, fbData) => {
  const leadsMap = {};
  

  for (const adset of adsetNames) {
    // Находим соответствующий объект из fbData для дат
    const item = fbData.find((i) => i.adset_name === adset);
    if (!item) continue;

    const body = {
      range: {
        from: item.start_time
          ? item.start_time.slice(0, 10) + "T00:00:00.000Z"
          : "2025-08-17T00:00:00.000Z",
        to: item.stop_time
          ? item.stop_time.slice(0, 10) + "T23:59:59.999Z"
          : new Date().toISOString(),
        timezone: "Europe/Kyiv",
      },
      measures: ["conversions"],
      filters: [
        {
          name: "sub_id_5",
          operator: "EQUALS",
          expression: adset.trim(),
        },
      ],
    };

    const res = await fetch(`${process.env.KEITARO_HOST}/report/build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": process.env.KEITARO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log(data)
    const rows = data.rows || [];
    leadsMap[adset] = rows.reduce(
      (sum, row) => sum + parseInt(row.conversions || 0),
      0
    );
  }

  return leadsMap;
};
