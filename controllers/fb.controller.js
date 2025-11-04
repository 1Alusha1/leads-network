import dotenv from "dotenv";
import { fbLeadsCrm, fbLeadsTarget } from "../utils/parseLead.js";
import userModel from "../models/user.model.js";
import leadFormTemplateModel from "../models/formTemplate.model.js";
import appendToSheet from "../utils/appendToSheet.js";
import sendLogToChat from "../utils/sendLogToChat.js";
import { getKeitaroLeads } from "../utils/keitaro/keitaro.js";

dotenv.config();

export const validationHook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === process.env.FB_HOOK_TOKEN) {
    console.log("✅ Webhook подтвержден");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
};

export const sendDataToCRM = async (req, res) => {
  const { entry } = req.body;

  for (const lead of entry) {
    const formId = lead.changes[0].value.form_id;

    const template = await leadFormTemplateModel.findOne({ formId });
    const user = await userModel.findOne({
      "connectedForm.formId": formId,
    });

    if (!template) {
      console.log(`⛔ Форма ${formId} не подключена`);
      continue; // не прерываем — просто пропускаем
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${lead.changes[0].value.leadgen_id}?access_token=${user?.fb_token}`
    );

    const data = await response.json();

    console.log("📥 Получен лид:", data);

    if (data.error) {
      console.error("❌ Ошибка при получении лида:", data.error);
      continue;
    }

    if (template.type === "GOOGLESheets") {
      const validLead = fbLeadsTarget(data);
      const valuesArray = Object.values(validLead);
      valuesArray.push(template.adset);

      await appendToSheet(valuesArray, template.sheet, template.tableId);
      console.log("✅ Лид отправлен:", valuesArray);
    }

    if (template.type === "CRM") {
      const validLead = fbLeadsCrm(data, template);

      const formBody = new URLSearchParams(validLead).toString();

      try {
        const response = await fetch(process.env.CRM_URI, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: formBody,
        });

        const result = await response.json();

        if (response.status === 422) {
          sendLogToChat(
            process.env.BOT_LOG_TOKEN,
            "-1002534133157",
            "/leadformhook ❌ Ошибка при отправке лида:",
            {
              result,
              body: formBody,
              time: format("dd-MM-yyyy, hh:mm"),
            }
          );
        } else {
          sendLogToChat(
            process.env.BOT_LOG_TOKEN,
            "-1002534133157",
            "/leadformhook ✅ Лид отправлен в CRM:",
            {
              result,
              body: formBody,
              time: format("dd-MM-yyyy, hh:mm"),
            }
          );
        }
      } catch (err) {
        console.error("❌ Ошибка сети при отправке лида:", err.message);
      }
    }
  }

  // ВАЖНО: Facebook ждет только 200 OK. Ответ один на все entry
  return res.sendStatus(200);
};

export const getLongLivedToken = async (req, res) => {
  const { fb_token, authToken } = req.body;

  try {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.APP_ID,
      client_secret: process.env.FB_CLIENT_SECRET,
      fb_exchange_token: fb_token,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params}`
    );

    const data = await response.json();

    if (data.error) {
      return res
        .status(400)
        .json({ message: data.error.message, type: "error" });
    }

    if (data.access_token) {
      await userModel.findOneAndUpdate(
        { authToken },
        { fb_token: data.access_token },
        { new: true }
      );
    }

    return res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message, type: "error" });
  }
};

export const saveLeadFormTemplate = async (req, res) => {
  const { formId, userId } = req.body;

  try {
    const template = await leadFormTemplateModel.findOne({ formId });

    if (template) {
      return res
        .status(400)
        .json({ message: "Форма уже подключнеа", type: "error" });
    }

    await leadFormTemplateModel({ ...req.body }).save();

    await userModel.updateOne(
      { _id: userId },
      { $push: { connectedForm: { ...req.body } } }
    );

    return res
      .status(200)
      .json({ message: "Шаблон формы сохранен", type: "success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message, type: "error" });
  }
};

// === 1. Получить все рекламные аккаунты ===
const getAllAdAccounts = async (token) => {
  let url = `https://graph.facebook.com/v23.0/me/adaccounts?access_token=${token}`;
  let allAccounts = [];

  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      console.error("Ошибка API:", data.error);
      break;
    }
    if (data.data) allAccounts.push(...data.data);
    url = data.paging?.next || null;
  }

  return allAccounts;
};

// === 2. Получить статистику кампаний ===
const getCampaignSpends = async (accountId, token, datePreset = "last_30d") => {
  let url = `https://graph.facebook.com/v23.0/${accountId}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,date_start,date_stop,spend,clicks,impressions,actions&level=ad&date_preset=${datePreset}&limit=500`;
  let allCampaigns = [];

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.error) {
      console.error(`Ошибка на аккаунте ${accountId}:`, data.error);
      break;
    }

    if (data.data) {
      for (const item of data.data) {
        let leads = 0;
        if (item.actions) {
          item.actions.forEach((a) => {
            if (
              ["lead", "leadgen", "offsite_conversion.fb_lead"].includes(
                a.action_type
              )
            ) {
              leads += parseInt(a.value);
            }
          });
        }
        item.leads = leads;

        // ====== Получаем creative_id ======
        if (item.ad_id) {
          try {
            const resCreative = await fetch(
              `https://graph.facebook.com/v23.0/${item.ad_id}?fields=creative&access_token=${token}`
            );
            const dataCreative = await resCreative.json();
            item.creative_id = dataCreative.creative?.id || null;
          } catch (err) {
            console.error(
              `Ошибка получения creative для ad_id ${item.ad_id}:`,
              err
            );
            item.creative_id = null;
          }
        } else {
          item.creative_id = null;
        }

        allCampaigns.push(item);
      }
    }

    url = data.paging?.next || null;
  }
  return allCampaigns;
};
// === 3. Получить start_time/stop_time кампании ===
const getCampaignDates = async (campaignIds, token) => {
  const campaignDates = {};

  for (const id of campaignIds) {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${id}?fields=start_time,stop_time,status&access_token=${token}`
    );
    const data = await res.json();
    console.log(data);
    if (data.error) {
      console.error(`Ошибка получения дат кампании ${id}:`, data.error);
      continue;
    }
    campaignDates[id] = {
      start_time: data.start_time,
      stop_time: data.stop_time,
      status: data.status,
    };
  }

  return campaignDates;
};
export const fbSpend = async (req, res) => {
  try {
    const { fb_access_token } = req.body;
    const accounts = await getAllAdAccounts(fb_access_token);
    console.log(
      "Все рекламные аккаунты:",
      accounts.map((a) => a.id)
    );

    const datePreset = "last_30d";
    let allCampaigns = [];

    // === 1. Получаем статистику по всем аккаунтам ===
    for (const acc of accounts) {
      const campaigns = await getCampaignSpends(
        acc.id,
        fb_access_token,
        datePreset
      );
      campaigns.forEach((c) => (c.accountId = acc.id));
      allCampaigns.push(...campaigns);
    }

    // === 2. Собираем уникальные campaign_id ===
    const uniqueCampaignIds = [
      ...new Set(allCampaigns.map((c) => c.campaign_id)),
    ];

    // === 3. Получаем даты кампаний ===
    const campaignDates = await getCampaignDates(
      uniqueCampaignIds,
      fb_access_token
    );

    // === 4. Подгружаем лидов из Keitaro ===
    const adsetNames = allCampaigns.map((a) => a.adset_name).filter(Boolean);
    const keitaroLeads = await getKeitaroLeads(adsetNames, allCampaigns);

    // === 5. Склеиваем всё и добавляем новые метрики ===
    let allData = [];

    for (const item of allCampaigns) {
      const date = item.date_start;
      const dates = campaignDates[item.campaign_id] || {};

      const existing = allData.find(
        (d) =>
          d.accountId === item.accountId &&
          d.campaign_id === item.campaign_id &&
          d.adset_id === item.adset_id
      );

      const spend = parseFloat(item.spend || 0);
      const impressions = parseInt(item.impressions || 0);
      const clicksTotal = parseInt(item.clicks || 0);
      const leads = keitaroLeads[item.adset_name] || 0;

      // ======== Новые вычисления ========
      const linkClicks =
        item.actions?.find((a) => a.action_type === "link_click")?.value || 0;

      const cpm =
        impressions > 0 ? ((spend / impressions) * 1000).toFixed(2) : "0";
      const cpc_link = linkClicks > 0 ? (spend / linkClicks).toFixed(2) : "0";
      const cpc_all = clicksTotal > 0 ? (spend / clicksTotal).toFixed(2) : "0";
      const ctr_link =
        impressions > 0
          ? ((linkClicks / impressions) * 100).toFixed(2) + "%"
          : "0%";
      const ctr_all =
        impressions > 0
          ? ((clicksTotal / impressions) * 100).toFixed(2) + "%"
          : "0%";
      const cps = leads > 0 ? (spend / leads).toFixed(2) : "0";

      if (existing) {
        existing.spend = (parseFloat(existing.spend) + spend).toFixed(2);
        existing.clicks_total = (
          parseInt(existing.clicks_total) + clicksTotal
        ).toString();
        existing.link_clicks = (
          parseInt(existing.link_clicks) + parseInt(linkClicks)
        ).toString();
        existing.impressions_total = (
          parseInt(existing.impressions_total) + impressions
        ).toString();
        existing.leads = (parseInt(existing.leads) + leads).toString();
      } else {
        allData.push({
          accountId: item.accountId,
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          adset_id: item.adset_id,
          adset_name: item.adset_name,
          date,
          spend: spend.toFixed(2),
          impressions_total: impressions.toString(),
          clicks_total: clicksTotal.toString(),
          link_clicks: linkClicks.toString(),
          leads: leads.toString(),
          start_time: dates.start_time,
          stop_time: dates.stop_time,
          campaign_status: dates.status,

          // новые метрики:
          creative_id: item.creative_id,
          cpm,
          cpc_link,
          cpc_all,
          cps,
          ctr_link,
          ctr_all,
        });
      }
    }

    res.status(200).json({
      data: allData,
      type: "success",
      message: "Данные получены с расширенными метриками и лидами из Keitaro",
    });
  } catch (err) {
    console.error("Ошибка в fbSpend:", err);
    res.status(500).json({ type: "error", error: err.message });
  }
};
