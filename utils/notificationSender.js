export default async (token, text, chat_id) => {
  console.log(chat_id);

  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${encodeURIComponent(
    text
  )}`;

  await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
  });
};
