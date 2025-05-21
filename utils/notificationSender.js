export default async (token, addSet, text, chat_id = -4662139699) => {
  const adsets = ["aff_Victoria2", "aff_Victoria22", "aff_Victoria3"];
  if (adsets.includes(addSet)) {
    await fetch(
      `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${text}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
};
