import { config } from "dotenv";
config();

export const createNotionPage = async () => {
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-type": "application/json",
      accept: "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: {
        page_id: "29277ac28aa68038bda1d1c6bf7c6d19",
        type: "workspace",
      },
    }),
  });
  const data = await response.json();
  console.log(data);

  try {
  } catch (err) {
    console.log(err);
  }
};
